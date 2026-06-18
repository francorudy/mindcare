from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class AlertaNotificacionOut(BaseModel):
    id_alerta: int
    id_evaluacion: int
    id_estudiante: int
    nombres_estudiante: str
    apellidos_estudiante: str
    fecha_evaluacion: Optional[datetime]
    puntaje_phq9: int
    probabilidad: Decimal
    nombre_nivel: str
    estado: str
    fecha_creacion: Optional[datetime]

    class Config:
        from_attributes = True


class AlertaPendientesOut(BaseModel):
    pendientes: int
