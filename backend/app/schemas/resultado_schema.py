from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class ResultadoOut(BaseModel):
    id_resultado: int
    id_evaluacion: int
    probabilidad: Optional[Decimal]
    id_nivel_riesgo: Optional[int]
    nombre_nivel: Optional[str]
    color_nivel: Optional[str]
    recomendaciones: Optional[str]
    fecha_resultado: Optional[datetime]
    modelo_utilizado: Optional[str]
    version_modelo: Optional[str]

    class Config:
        from_attributes = True