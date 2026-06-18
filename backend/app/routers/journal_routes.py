from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.usuario_model import Usuario
from app.schemas.journal_schema import TextoLibreCreate, TextoLibreOut
from app.services.journal_service import service_guardar_journal, service_get_journal
from app.utils.dependencies import require_rol

router = APIRouter(prefix="/journal", tags=["Journal"])


@router.post("/", response_model=TextoLibreOut, status_code=201)
def guardar_journal(
    data: TextoLibreCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_guardar_journal(current_user.id_usuario, data, db, ip=request.client.host)


@router.get("/{id_evaluacion}", response_model=TextoLibreOut)
def get_journal(
    id_evaluacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_rol("estudiante")),
):
    return service_get_journal(id_evaluacion, current_user.id_usuario, db)