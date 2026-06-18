from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.rol_model import Rol


def find_rol_by_name(db: Session, nombre: str) -> Rol | None:
    return (
        db.query(Rol)
        .filter(func.lower(Rol.nombre_rol) == nombre.lower())
        .first()
    )
