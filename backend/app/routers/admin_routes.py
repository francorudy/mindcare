from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.usuario_model import Usuario
from app.schemas.admin_schema import (
    DashboardResumenOut,
    EstudianteRiesgoOut,
    CaseDetailOut,
    SeguimientoUpdate,
)
from app.services.admin_service import (
    service_resumen,
    service_listar_estudiantes,
    service_detalle_caso,
    service_marcar_seguimiento,
)
from app.services.alerta_service import (
    service_listar_alertas_pendientes,
    service_contar_alertas_pendientes,
    service_marcar_alerta_revisada,
)
from app.schemas.alerta_schema import AlertaNotificacionOut, AlertaPendientesOut
from app.utils.dependencies import require_role

router = APIRouter(prefix="/admin", tags=["Panel de Consejería"])


@router.get("/resumen", response_model=DashboardResumenOut)
def resumen(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("consejero")),
):
    return service_resumen(db)


@router.get("/estudiantes", response_model=List[EstudianteRiesgoOut])
def listar_estudiantes(
    nivel: Optional[str] = Query(None, description="Filtrar por nivel: Alto, Moderado, Bajo"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("consejero")),
):
    return service_listar_estudiantes(db, nivel=nivel)


@router.get("/estudiantes/{id_usuario}", response_model=CaseDetailOut)
def detalle_caso(
    id_usuario: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("consejero")),
):
    return service_detalle_caso(
        id_usuario=id_usuario,
        id_consejero=current_user.id_usuario,
        db=db,
        ip=request.client.host,
    )


@router.post("/estudiantes/{id_usuario}/seguimiento")
def marcar_seguimiento(
    id_usuario: int,
    data: SeguimientoUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("consejero")),
):
    return service_marcar_seguimiento(
        id_usuario=id_usuario,
        id_consejero=current_user.id_usuario,
        data=data,
        db=db,
        ip=request.client.host,
    )


@router.get("/alertas", response_model=List[AlertaNotificacionOut])
def listar_alertas_pendientes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("consejero")),
):
    return service_listar_alertas_pendientes(db)


@router.get("/alertas/pendientes", response_model=AlertaPendientesOut)
def contar_alertas_pendientes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("consejero")),
):
    return service_contar_alertas_pendientes(db)


@router.patch("/alertas/{id_alerta}/revisar", response_model=AlertaNotificacionOut)
def marcar_alerta_revisada(
    id_alerta: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("consejero")),
):
    return service_marcar_alerta_revisada(
        id_alerta=id_alerta,
        id_consejero=current_user.id_usuario,
        db=db,
        ip=request.client.host,
    )