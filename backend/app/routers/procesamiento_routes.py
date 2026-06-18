from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.usuario_model import Usuario
from app.schemas.resultado_schema import ResultadoOut
from app.services.procesamiento_service import (
    service_procesar_evaluacion,
    service_obtener_resultado,
)
from app.utils.dependencies import require_rol

router = APIRouter(prefix="/procesamiento", tags=["Procesamiento"])


@router.get("/{id_evaluacion}", response_model=ResultadoOut)
def obtener_resultado(
    id_evaluacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_obtener_resultado(
        id_evaluacion=id_evaluacion,
        id_usuario=current_user.id_usuario,
        db=db,
    )


@router.post("/{id_evaluacion}", response_model=ResultadoOut)
def procesar_evaluacion(
    id_evaluacion: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_procesar_evaluacion(
        id_evaluacion=id_evaluacion,
        id_usuario=current_user.id_usuario,
        db=db,
        ip=request.client.host,
    )