from pydantic import BaseModel
from typing import Optional


class AccionOut(BaseModel):
    id_accion_recomendada: int
    id_tipo_accion: int
    nombre_accion: Optional[str]
    descripcion: Optional[str]
    recursos: Optional[str]
    descripcion_personalizada: Optional[str]
    estado: Optional[str]

    class Config:
        from_attributes = True