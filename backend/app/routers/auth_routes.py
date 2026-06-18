from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.auth_schema import UsuarioCreate, UsuarioLogin, UsuarioOut, TokenOut
from app.services.auth_service import service_register, service_login

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/register", response_model=UsuarioOut, status_code=201)
def register(data: UsuarioCreate, request: Request, db: Session = Depends(get_db)):
    usuario = service_register(data, db, ip=request.client.host)
    return usuario


@router.post("/login", response_model=TokenOut)
def login(data: UsuarioLogin, request: Request, db: Session = Depends(get_db)):
    return service_login(data, db, ip=request.client.host)