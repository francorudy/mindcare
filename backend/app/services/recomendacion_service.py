from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List

from app.models.resultado_model          import Resultado
from app.models.evaluacion_model         import Evaluacion
from app.models.accion_recomendada_model import AccionRecomendada
from app.models.tipo_accion_model        import TipoAccion
from app.schemas.recomendacion_schema import AccionOut


def service_get_recomendaciones(id_evaluacion: int, id_usuario: int, db: Session) -> List[AccionOut]:
    ev = db.query(Evaluacion).filter(
        Evaluacion.id_evaluacion == id_evaluacion,
        Evaluacion.id_usuario == id_usuario,
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada o no pertenece al usuario")

    resultado = db.query(Resultado).filter(Resultado.id_evaluacion == id_evaluacion).first()
    if not resultado:
        raise HTTPException(status_code=404, detail="No hay resultado para esta evaluación")

    acciones = (
        db.query(AccionRecomendada)
        .filter(
            AccionRecomendada.id_resultado == resultado.id_resultado,
            AccionRecomendada.estado == "A",
        )
        .all()
    )

    out = []
    for a in acciones:
        tipo = db.query(TipoAccion).filter(TipoAccion.id_tipo_accion == a.id_tipo_accion).first()
        out.append(AccionOut(
            id_accion_recomendada=a.id_accion_recomendada,
            id_tipo_accion=a.id_tipo_accion,
            nombre_accion=tipo.nombre_accion if tipo else None,
            descripcion=tipo.descripcion if tipo else None,
            recursos=tipo.recursos if tipo else None,
            descripcion_personalizada=a.descripcion_personalizada,
            estado=a.estado,
        ))
    return out