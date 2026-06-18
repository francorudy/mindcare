from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.usuario_model import Usuario
from app.schemas.recomendacion_schema import AccionOut
from app.services.recomendacion_service import service_get_recomendaciones
from app.utils.dependencies import require_rol

router = APIRouter(prefix="/recomendaciones", tags=["Recomendaciones"])


@router.get("/{id_evaluacion}", response_model=List[AccionOut])
def get_recomendaciones(
    id_evaluacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_get_recomendaciones(id_evaluacion, current_user.id_usuario, db)