from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from app.schemas.phq9_schema import RespuestaPHQ9Out
from app.schemas.journal_schema import TextoLibreOut
from app.schemas.resultado_schema import ResultadoOut
from app.schemas.recomendacion_schema import AccionOut


class EvaluacionCreate(BaseModel):
    fuente: Optional[str] = "WEB"


class EvaluacionOut(BaseModel):
    id_evaluacion: int
    id_usuario: int
    fecha_evaluacion: Optional[datetime]
    fuente: Optional[str]
    estado: Optional[str]

    class Config:
        from_attributes = True


class EvaluacionHistorialOut(BaseModel):
    id_evaluacion: int
    fecha_evaluacion: Optional[datetime]
    nombre_nivel: Optional[str] = None
    color_nivel: Optional[str] = None
    probabilidad: Optional[Decimal] = None
    puntaje_phq9: Optional[int] = None
    tiene_resultado: bool = False


class EvaluacionDetalleOut(BaseModel):
    evaluacion: EvaluacionOut
    respuestas_phq9: List[RespuestaPHQ9Out]
    texto_libre: Optional[TextoLibreOut] = None
    resultado: Optional[ResultadoOut] = None
    acciones: List[AccionOut] = []
    puntaje_phq9: Optional[int] = None