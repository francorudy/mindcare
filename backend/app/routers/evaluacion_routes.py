from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.usuario_model import Usuario
from app.schemas.evaluacion_schema import (
    EvaluacionCreate,
    EvaluacionOut,
    EvaluacionHistorialOut,
    EvaluacionDetalleOut,
)
from app.services.evaluacion_service import (
    service_iniciar_evaluacion,
    service_mis_evaluaciones,
    service_historial_evaluaciones,
    service_get_evaluacion,
    service_detalle_evaluacion,
)
from app.utils.dependencies import require_rol

router = APIRouter(prefix="/evaluaciones", tags=["Evaluaciones"])


@router.post("/", response_model=EvaluacionOut, status_code=201)
def iniciar_evaluacion(
    data: EvaluacionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_iniciar_evaluacion(current_user.id_usuario, data, db, ip=request.client.host)


@router.get("/mis-evaluaciones", response_model=List[EvaluacionOut])
def mis_evaluaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_mis_evaluaciones(current_user.id_usuario, db)


@router.get("/historial", response_model=List[EvaluacionHistorialOut])
def historial_evaluaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_historial_evaluaciones(current_user.id_usuario, db)

@router.get("/{id_evaluacion}/detalle", response_model=EvaluacionDetalleOut)
def detalle_evaluacion(
    id_evaluacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_detalle_evaluacion(id_evaluacion, current_user.id_usuario, db)


@router.get("/{id_evaluacion}", response_model=EvaluacionOut)
def get_evaluacion(
    id_evaluacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_get_evaluacion(id_evaluacion, current_user.id_usuario, db)
