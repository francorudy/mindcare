from sqlalchemy.orm import Session
from app.models.bitacora_sistema_model import BitacoraSistema
from typing import Optional


def registrar_bitacora(
    db: Session,
    accion: str,
    id_usuario: Optional[int] = None,
    detalles: Optional[str] = None,
    ip_origen: Optional[str] = None,
):
    entrada = BitacoraSistema(
        id_usuario=id_usuario,
        accion=accion,
        detalles=detalles,
        ip_origen=ip_origen,
    )
    db.add(entrada)
    db.commit()
