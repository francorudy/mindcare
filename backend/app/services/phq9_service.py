from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List

from app.models.evaluacion_model        import Evaluacion
from app.models.respuesta_phq9_model    import RespuestaPHQ9
from app.models.bitacora_sistema_model  import BitacoraSistema
from app.schemas.phq9_schema     import PHQ9Submit

PREGUNTAS_PHQ9 = [
    "¿Con qué frecuencia has tenido poco interés o placer en hacer cosas?",
    "¿Con qué frecuencia te has sentido decaído/a, deprimido/a o sin esperanza?",
    "¿Con qué frecuencia has tenido dificultad para dormir o has dormido demasiado?",
    "¿Con qué frecuencia te has sentido cansado/a o con poca energía?",
    "¿Con qué frecuencia has tenido poco apetito o has comido en exceso?",
    "¿Con qué frecuencia te has sentido mal contigo mismo/a o que has fracasado?",
    "¿Con qué frecuencia has tenido dificultad para concentrarte en las cosas?",
    "¿Con qué frecuencia te has movido o hablado tan lento que otros lo han notado?",
    "¿Con qué frecuencia has pensado que estarías mejor muerto/a o en hacerte daño?",
]


def service_enviar_phq9(
    id_usuario: int,
    data: PHQ9Submit,
    db: Session,
    ip: str = None,
) -> List[RespuestaPHQ9]:
    ev = db.query(Evaluacion).filter(
        Evaluacion.id_evaluacion == data.id_evaluacion,
        Evaluacion.id_usuario == id_usuario,
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada o no pertenece al usuario")

    if len(data.respuestas) != 9:
        raise HTTPException(status_code=400, detail="Se requieren exactamente 9 respuestas")

    # Borrar respuestas previas si ya existen (re-envío)
    db.query(RespuestaPHQ9).filter(RespuestaPHQ9.id_evaluacion == data.id_evaluacion).delete()

    guardadas = []
    for item in data.respuestas:
        r = RespuestaPHQ9(
            id_evaluacion=data.id_evaluacion,
            pregunta_numero=item.pregunta_numero,
            texto_pregunta=item.texto_pregunta or PREGUNTAS_PHQ9[item.pregunta_numero - 1],
            opcion_seleccionada=item.opcion_seleccionada,
            valor=item.valor,
        )
        db.add(r)
        guardadas.append(r)

    db.commit()
    for r in guardadas:
        db.refresh(r)

    puntaje = sum(i.valor for i in data.respuestas)
    db.add(BitacoraSistema(
        id_usuario=id_usuario,
        accion="ENVIAR_PHQ9",
        detalles=f"Evaluación #{data.id_evaluacion} | Puntaje total: {puntaje}",
        ip_origen=ip,
    ))
    db.commit()
    return guardadas


def service_get_respuestas(id_evaluacion: int, id_usuario: int, db: Session) -> List[RespuestaPHQ9]:
    ev = db.query(Evaluacion).filter(
        Evaluacion.id_evaluacion == id_evaluacion,
        Evaluacion.id_usuario == id_usuario,
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada o no pertenece al usuario")

    return (
        db.query(RespuestaPHQ9)
        .filter(RespuestaPHQ9.id_evaluacion == id_evaluacion)
        .order_by(RespuestaPHQ9.pregunta_numero)
        .all()
    )