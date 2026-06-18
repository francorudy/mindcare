from __future__ import annotations

import logging
import re
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.evaluacion_model        import Evaluacion
from app.models.respuesta_phq9_model    import RespuestaPHQ9
from app.models.texto_libre_model       import TextoLibre
from app.models.resultado_model         import Resultado
from app.models.nivel_riesgo_model      import NivelRiesgo
from app.models.accion_recomendada_model import AccionRecomendada
from app.models.tipo_accion_model       import TipoAccion
from app.models.historial_evaluacion_model import HistorialEvaluacion
from app.models.bitacora_sistema_model  import BitacoraSistema
from app.services.alerta_service import service_crear_alerta_riesgo_alto
from app.schemas.resultado_schema       import ResultadoOut



MODELO_NOMBRE  = "DecisionTreeClassifier"
MODELO_VERSION = "stub-1.0"

logger = logging.getLogger(__name__)
_modelo_ml = None

# Keywords NLP muy básicas para detectar polaridad del texto libre
_PALABRAS_NEGATIVAS = {
    "mal", "triste", "deprimido", "solo", "soledad", "ansiedad", "ansioso",
    "miedo", "desesperado", "agotado", "cansado", "inútil", "fracasado",
    "llorar", "lloré", "lloro", "angustia", "angustiado", "sin esperanza",
    "hacerme daño", "morir", "muerte", "suicidio",
}
_PALABRAS_POSITIVAS = {
    "bien", "feliz", "contento", "alegre", "tranquilo", "motivado",
    "esperanza", "mejoré", "mejor", "positivo", "energía", "descansado",
}

def _analizar_texto(texto: str | None) -> dict:
    if not texto or len(texto.strip()) < 10:
        return {"score_negativo": 0, "score_positivo": 0, "aplico_nlp": False}

    texto_lower = texto.lower()
    neg = sum(1 for w in _PALABRAS_NEGATIVAS if w in texto_lower)
    pos = sum(1 for w in _PALABRAS_POSITIVAS if w in texto_lower)
    return {"score_negativo": neg, "score_positivo": pos, "aplico_nlp": True}


def _load_modelo_ml():
    global _modelo_ml
    if _modelo_ml is not None:
        return _modelo_ml

    import pickle
    import pathlib

    model_path = pathlib.Path(__file__).parent.parent / "ml" / "modelo_arbol.pkl"
    with open(model_path, "rb") as f:
        _modelo_ml = pickle.load(f)
    return _modelo_ml


def _predecir_nivel_ml(puntaje_phq9: int, nlp: dict) -> tuple[str, float]:
    import numpy as np

    try:
        modelo = _load_modelo_ml()
        features = np.array([[
            puntaje_phq9,
            nlp["score_negativo"],
            nlp["score_positivo"],
        ]])
        pred = str(modelo.predict(features)[0])
        proba = float(modelo.predict_proba(features).max())
        return pred, proba
    except (FileNotFoundError, Exception):
        pass

    # Reglas de respaldo si no encuentra el pkl
    ajuste = 2 if nlp["score_negativo"] >= 3 else 0
    score_ajustado = puntaje_phq9 + ajuste
    if score_ajustado >= 15:
        return "Alto", 0.87
    elif score_ajustado >= 10:
        return "Moderado", 0.78
    else:
        return "Bajo", 0.91


#Generación de acciones recomendadas
def _generar_acciones(resultado: Resultado, nivel: str, db: Session) -> None:
    # Obtener todos los tipos de acción activos ordenados
    tipos = (
        db.query(TipoAccion)
        .filter(TipoAccion.estado == "A")
        .order_by(TipoAccion.orden)
        .all()
    )

    # Selección por nivel
    if nivel == "Crítico":
        seleccionados = tipos[:5]
    elif nivel == "Alto":
        seleccionados = tipos[:4]
    elif nivel == "Moderado":
        seleccionados = tipos[:3]
    else:
        seleccionados = tipos[:2]

    for tipo in seleccionados:
        db.add(AccionRecomendada(
            id_resultado=resultado.id_resultado,
            id_tipo_accion=tipo.id_tipo_accion,
            descripcion_personalizada=None,
            estado="A",
        ))


def _intentar_crear_alerta_riesgo(
    db: Session,
    *,
    id_evaluacion: int,
    id_resultado: int,
    id_estudiante: int,
    puntaje_phq9: int,
    probabilidad: float,
    nombre_nivel: str,
) -> None:
    try:
        service_crear_alerta_riesgo_alto(
            db,
            id_evaluacion=id_evaluacion,
            id_resultado=id_resultado,
            id_estudiante=id_estudiante,
            puntaje_phq9=puntaje_phq9,
            probabilidad=probabilidad,
            nombre_nivel=str(nombre_nivel),
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception(
            "No se pudo crear la alerta de riesgo para evaluación #%s",
            id_evaluacion,
        )


#Servicio principal
def service_procesar_evaluacion(
    id_evaluacion: int,
    id_usuario: int,
    db: Session,
    ip: str | None = None,
) -> ResultadoOut:
    # 1. Validar evaluación
    ev = db.query(Evaluacion).filter(
        Evaluacion.id_evaluacion == id_evaluacion,
        Evaluacion.id_usuario == id_usuario,
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")

    #Verificar que no tenga resultado previo
    existente = db.query(Resultado).filter(Resultado.id_evaluacion == id_evaluacion).first()
    if existente:
        nivel_obj = db.query(NivelRiesgo).filter(
            NivelRiesgo.id_nivel_riesgo == existente.id_nivel_riesgo
        ).first()
        puntaje_existente = (
            db.query(func.sum(RespuestaPHQ9.valor))
            .filter(RespuestaPHQ9.id_evaluacion == id_evaluacion)
            .scalar()
        ) or 0
        _intentar_crear_alerta_riesgo(
            db,
            id_evaluacion=id_evaluacion,
            id_resultado=existente.id_resultado,
            id_estudiante=id_usuario,
            puntaje_phq9=int(puntaje_existente),
            probabilidad=float(existente.probabilidad or 0),
            nombre_nivel=nivel_obj.nombre_nivel if nivel_obj else "Alto",
        )
        return _to_resultado_out(existente, nivel_obj)

    #Puntaje PHQ-9
    respuestas = (
        db.query(RespuestaPHQ9)
        .filter(RespuestaPHQ9.id_evaluacion == id_evaluacion)
        .all()
    )
    if len(respuestas) != 9:
        raise HTTPException(
            status_code=400,
            detail="Debes completar las 9 preguntas del PHQ-9 antes de procesar",
        )
    puntaje = sum(r.valor for r in respuestas)

    # Detección de riesgo crítico (pregunta 9 PHQ-9: ideación suicida)
    q9 = next((r for r in respuestas if r.pregunta_numero == 9), None)
    riesgo_critico = q9 is not None and (q9.valor or 0) >= 1

    #NLP
    texto_obj = db.query(TextoLibre).filter(TextoLibre.id_evaluacion == id_evaluacion).first()
    texto_usuario = texto_obj.texto_usuario if texto_obj else None
    nlp = _analizar_texto(texto_usuario)

    if riesgo_critico or any(
        kw in (texto_usuario or "").lower()
        for kw in ("suicidio", "hacerme daño", "morir", "muerte")
    ):
        nombre_nivel, probabilidad = "Crítico", 0.95
    else:
        #Predicción
        nombre_nivel, probabilidad = _predecir_nivel_ml(puntaje, nlp)

    #Obtener id_nivel_riesgo
    nivel_obj = db.query(NivelRiesgo).filter(NivelRiesgo.nombre_nivel == nombre_nivel).first()
    if not nivel_obj:
        raise HTTPException(
            status_code=500,
            detail=f"Nivel de riesgo '{nombre_nivel}' no encontrado en catálogo. "
                   "Ejecuta el seed de datos.",
        )

    #Persistir Resultado
    recomendaciones_texto = _texto_recomendacion(nombre_nivel)
    resultado = Resultado(
        id_evaluacion=id_evaluacion,
        probabilidad=Decimal(str(round(probabilidad, 4))),
        id_nivel_riesgo=nivel_obj.id_nivel_riesgo,
        recomendaciones=recomendaciones_texto,
        modelo_utilizado=MODELO_NOMBRE,
        version_modelo=MODELO_VERSION,
    )
    db.add(resultado)
    try:
        db.flush()
    except Exception:
        db.rollback()
        existente = db.query(Resultado).filter(
            Resultado.id_evaluacion == id_evaluacion
        ).first()
        if existente:
            nivel_obj2 = db.query(NivelRiesgo).filter(
                NivelRiesgo.id_nivel_riesgo == existente.id_nivel_riesgo
            ).first()
            return _to_resultado_out(existente, nivel_obj2)
        raise HTTPException(
            status_code=500,
            detail="No se pudo guardar el resultado. Intenta de nuevo.",
        )

    #Generar acciones recomendadas
    _generar_acciones(resultado, nombre_nivel, db)

    #Registrar en historial
    db.add(HistorialEvaluacion(
        id_usuario=id_usuario,
        id_evaluacion=id_evaluacion,
        id_resultado=resultado.id_resultado,
        observacion="Registro automático — evaluación procesada por sistema",
    ))

    # 9. Bitácora
    db.add(BitacoraSistema(
        id_usuario=id_usuario,
        accion="PROCESAR_EVALUACION",
        detalles=(
            f"Evaluación #{id_evaluacion} | Puntaje PHQ-9: {puntaje} | "
            f"Nivel: {nombre_nivel} | Prob: {probabilidad:.2%}"
        ),
        ip_origen=ip,
    ))

    db.commit()
    db.refresh(resultado)

    # 10. Alerta de riesgo alto para consejería (después del commit; no bloquea el resultado)
    _intentar_crear_alerta_riesgo(
        db,
        id_evaluacion=id_evaluacion,
        id_resultado=resultado.id_resultado,
        id_estudiante=id_usuario,
        puntaje_phq9=puntaje,
        probabilidad=probabilidad,
        nombre_nivel=nombre_nivel,
    )

    return _to_resultado_out(resultado, nivel_obj)


def service_obtener_resultado(
    id_evaluacion: int,
    id_usuario: int,
    db: Session,
) -> ResultadoOut:
    ev = db.query(Evaluacion).filter(Evaluacion.id_evaluacion == id_evaluacion).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    if ev.id_usuario != id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permiso para acceder a esta evaluación")

    res = db.query(Resultado).filter(Resultado.id_evaluacion == id_evaluacion).first()
    if not res:
        raise HTTPException(status_code=404, detail="Esta evaluación aún no tiene resultado")

    nivel_obj = db.query(NivelRiesgo).filter(NivelRiesgo.id_nivel_riesgo == res.id_nivel_riesgo).first()
    return _to_resultado_out(res, nivel_obj)


#Helpers
def _texto_recomendacion(nivel: str) -> str:
    textos = {
        "Crítico": (
            "Se requiere intervención inmediata. Tus respuestas indican una situación de alto "
            "riesgo que necesita atención profesional urgente. Contacta a la consejería "
            "universitaria o a servicios de emergencia de inmediato."
        ),
        "Alto": (
            "Tus respuestas indican síntomas significativos que requieren atención prioritaria. "
            "Por favor, contacta a la consejería universitaria lo antes posible."
        ),
        "Moderado": (
            "Tus respuestas sugieren que podrías estar experimentando algunos síntomas que están "
            "afectando tu bienestar emocional. Te recomendamos buscar apoyo profesional y acudir "
            "a consejería universitaria en los próximos días."
        ),
        "Bajo": (
            "¡Buenas noticias! Tus respuestas indican que tu bienestar emocional se encuentra en "
            "un rango saludable. Mantén tus hábitos de autocuidado y realiza un monitoreo periódico."
        ),
    }
    return textos.get(nivel, "")


def _to_resultado_out(resultado: Resultado, nivel_obj: NivelRiesgo | None) -> ResultadoOut:
    return ResultadoOut(
        id_resultado=resultado.id_resultado,
        id_evaluacion=resultado.id_evaluacion,
        probabilidad=resultado.probabilidad,
        id_nivel_riesgo=resultado.id_nivel_riesgo,
        nombre_nivel=nivel_obj.nombre_nivel if nivel_obj else None,
        color_nivel=nivel_obj.color if nivel_obj else None,
        recomendaciones=resultado.recomendaciones,
        fecha_resultado=resultado.fecha_resultado,
        modelo_utilizado=resultado.modelo_utilizado,
        version_modelo=resultado.version_modelo,
    )