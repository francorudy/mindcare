from pydantic import BaseModel
from typing import Optional


class NivelRiesgoOut(BaseModel):
    id_nivel_riesgo: int
    nombre_nivel: str
    descripcion: Optional[str]
    color: Optional[str]
    orden: Optional[int]

    class Config:
        from_attributes = True


class TipoAccionOut(BaseModel):
    id_tipo_accion: int
    nombre_accion: str
    descripcion: Optional[str]
    recursos: Optional[str]
    orden: Optional[int]
    estado: Optional[str]

    class Config:
        from_attributes = True