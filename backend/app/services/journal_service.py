from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.evaluacion_model        import Evaluacion
from app.models.texto_libre_model       import TextoLibre
from app.models.bitacora_sistema_model  import BitacoraSistema
from app.schemas.journal_schema  import TextoLibreCreate


def service_guardar_journal(
    id_usuario: int,
    data: TextoLibreCreate,
    db: Session,
    ip: str = None,
) -> TextoLibre:
    ev = db.query(Evaluacion).filter(
        Evaluacion.id_evaluacion == data.id_evaluacion,
        Evaluacion.id_usuario == id_usuario,
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")

    existente = db.query(TextoLibre).filter(TextoLibre.id_evaluacion == data.id_evaluacion).first()
    if existente:
        existente.texto_usuario = data.texto_usuario
        db.commit()
        db.refresh(existente)
        return existente

    nuevo = TextoLibre(id_evaluacion=data.id_evaluacion, texto_usuario=data.texto_usuario)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    db.add(BitacoraSistema(
        id_usuario=id_usuario,
        accion="JOURNAL_GUARDADO",
        detalles=f"Evaluación #{data.id_evaluacion} | {len(data.texto_usuario)} caracteres",
        ip_origen=ip,
    ))
    db.commit()
    return nuevo


def service_get_journal(id_evaluacion: int, id_usuario: int, db: Session) -> TextoLibre:
    ev = db.query(Evaluacion).filter(
        Evaluacion.id_evaluacion == id_evaluacion,
        Evaluacion.id_usuario == id_usuario,
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada o no pertenece al usuario")

    tl = db.query(TextoLibre).filter(TextoLibre.id_evaluacion == id_evaluacion).first()
    if not tl:
        raise HTTPException(status_code=404, detail="Journal no encontrado")
    return tl