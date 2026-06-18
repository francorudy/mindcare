from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.usuario_model import Usuario
from app.schemas.phq9_schema import PHQ9Submit, RespuestaPHQ9Out
from app.services.phq9_service import service_enviar_phq9, service_get_respuestas
from app.utils.dependencies import require_rol

router = APIRouter(prefix="/phq9", tags=["PHQ-9"])


@router.post("/", response_model=List[RespuestaPHQ9Out], status_code=201)
def enviar_phq9(
    data: PHQ9Submit,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_enviar_phq9(current_user.id_usuario, data, db, ip=request.client.host)


@router.get("/{id_evaluacion}", response_model=List[RespuestaPHQ9Out])
def get_respuestas(
    id_evaluacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_get_respuestas(id_evaluacion, current_user.id_usuario, db)