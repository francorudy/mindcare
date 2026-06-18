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
from app.models.bitacora_sistema_model  import BitacoraSistema
from app.schemas.evaluacion_schema import EvaluacionCreate, EvaluacionOut, EvaluacionHistorialOut, EvaluacionDetalleOut
from app.schemas.phq9_schema import RespuestaPHQ9Out
from app.schemas.journal_schema import TextoLibreOut
from app.schemas.resultado_schema import ResultadoOut
from app.schemas.recomendacion_schema import AccionOut


def _verificar_propiedad(evaluacion: Evaluacion, id_usuario: int) -> None:
    if evaluacion.id_usuario != id_usuario:
        raise HTTPException(
            status_code=403,
            detail="No tienes permiso para acceder a esta evaluación",
        )


def _resultado_out(res: Resultado, db: Session) -> ResultadoOut:
    nivel = db.query(NivelRiesgo).filter(NivelRiesgo.id_nivel_riesgo == res.id_nivel_riesgo).first()
    return ResultadoOut(
        id_resultado=res.id_resultado,
        id_evaluacion=res.id_evaluacion,
        probabilidad=res.probabilidad,
        id_nivel_riesgo=res.id_nivel_riesgo,
        nombre_nivel=nivel.nombre_nivel if nivel else None,
        color_nivel=nivel.color if nivel else None,
        recomendaciones=res.recomendaciones,
        fecha_resultado=res.fecha_resultado,
        modelo_utilizado=res.modelo_utilizado,
        version_modelo=res.version_modelo,
    )


def _acciones_out(id_resultado: int, db: Session) -> list[AccionOut]:
    acciones_out = []
    for a in db.query(AccionRecomendada).filter(AccionRecomendada.id_resultado == id_resultado).all():
        tipo = db.query(TipoAccion).filter(TipoAccion.id_tipo_accion == a.id_tipo_accion).first()
        acciones_out.append(AccionOut(
            id_accion_recomendada=a.id_accion_recomendada,
            id_tipo_accion=a.id_tipo_accion,
            nombre_accion=tipo.nombre_accion if tipo else None,
            descripcion=tipo.descripcion if tipo else None,
            recursos=tipo.recursos if tipo else None,
            descripcion_personalizada=a.descripcion_personalizada,
            estado=a.estado,
        ))
    return acciones_out


def service_iniciar_evaluacion(
    id_usuario: int,
    data: EvaluacionCreate,
    db: Session,
    ip: str = None,
) -> Evaluacion:
    nueva = Evaluacion(id_usuario=id_usuario, fuente=data.fuente or "WEB")
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    db.add(BitacoraSistema(
        id_usuario=id_usuario,
        accion="INICIAR_EVALUACION",
        detalles=f"Evaluación #{nueva.id_evaluacion} iniciada",
        ip_origen=ip,
    ))
    db.commit()
    return nueva


def service_mis_evaluaciones(id_usuario: int, db: Session):
    return (
        db.query(Evaluacion)
        .filter(Evaluacion.id_usuario == id_usuario)
        .order_by(Evaluacion.fecha_evaluacion.desc())
        .all()
    )


def service_historial_evaluaciones(id_usuario: int, db: Session) -> list[EvaluacionHistorialOut]:
    evaluaciones = (
        db.query(Evaluacion)
        .join(Resultado, Resultado.id_evaluacion == Evaluacion.id_evaluacion)
        .filter(Evaluacion.id_usuario == id_usuario)
        .order_by(Evaluacion.fecha_evaluacion.desc())
        .all()
    )
    historial = []

    for ev in evaluaciones:
        res = db.query(Resultado).filter(Resultado.id_evaluacion == ev.id_evaluacion).first()
        nivel = db.query(NivelRiesgo).filter(NivelRiesgo.id_nivel_riesgo == res.id_nivel_riesgo).first()

        puntaje = (
            db.query(func.sum(RespuestaPHQ9.valor))
            .filter(RespuestaPHQ9.id_evaluacion == ev.id_evaluacion)
            .scalar()
        )

        historial.append(EvaluacionHistorialOut(
            id_evaluacion=ev.id_evaluacion,
            fecha_evaluacion=ev.fecha_evaluacion,
            nombre_nivel=nivel.nombre_nivel if nivel else None,
            color_nivel=nivel.color if nivel else None,
            probabilidad=res.probabilidad if res else None,
            puntaje_phq9=int(puntaje) if puntaje is not None else None,
            tiene_resultado=True,
        ))

    return historial


def service_get_evaluacion(id_evaluacion: int, id_usuario: int, db: Session) -> Evaluacion:
    ev = db.query(Evaluacion).filter(Evaluacion.id_evaluacion == id_evaluacion).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    _verificar_propiedad(ev, id_usuario)
    return ev


def service_detalle_evaluacion(
    id_evaluacion: int,
    id_usuario: int,
    db: Session,
) -> EvaluacionDetalleOut:
    ev = service_get_evaluacion(id_evaluacion, id_usuario, db)

    respuestas = (
        db.query(RespuestaPHQ9)
        .filter(RespuestaPHQ9.id_evaluacion == id_evaluacion)
        .order_by(RespuestaPHQ9.pregunta_numero)
        .all()
    )
    texto = db.query(TextoLibre).filter(TextoLibre.id_evaluacion == id_evaluacion).first()
    res = db.query(Resultado).filter(Resultado.id_evaluacion == id_evaluacion).first()

    resultado_out = _resultado_out(res, db) if res else None
    acciones_out = _acciones_out(res.id_resultado, db) if res else []
    puntaje = sum(r.valor or 0 for r in respuestas) if respuestas else None

    return EvaluacionDetalleOut(
        evaluacion=EvaluacionOut.model_validate(ev),
        respuestas_phq9=[RespuestaPHQ9Out.model_validate(r) for r in respuestas],
        texto_libre=TextoLibreOut.model_validate(texto) if texto else None,
        resultado=resultado_out,
        acciones=acciones_out,
        puntaje_phq9=puntaje,
    )
