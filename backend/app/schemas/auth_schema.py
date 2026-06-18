import re
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import date, datetime


class UsuarioCreate(BaseModel):
    nombres: str
    apellidos: str
    email: EmailStr
    password: str
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    telefono: Optional[str] = None
    id_rol: int = 1

    @field_validator("nombres", "apellidos")
    @classmethod
    def nombres_min_length(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Debe tener al menos 2 caracteres")
        return value

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not re.search(r"[A-Za-z]", value) or not re.search(r"[0-9]", value):
            raise ValueError("La contraseña debe incluir letras y números")
        return value


class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str
    tipo: str = "estudiante"


class UsuarioOut(BaseModel):
    id_usuario: int
    nombres: str
    apellidos: str
    email: str
    estado: Optional[str]
    fecha_registro: Optional[datetime]

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut
    rol: str