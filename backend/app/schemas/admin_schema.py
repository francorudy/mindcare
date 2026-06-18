from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

from app.schemas.auth_schema       import UsuarioOut
from app.schemas.evaluacion_schema import EvaluacionOut
from app.schemas.phq9_schema       import RespuestaPHQ9Out
from app.schemas.journal_schema    import TextoLibreOut
from app.schemas.resultado_schema  import ResultadoOut
from app.schemas.recomendacion_schema import AccionOut


class HistorialOut(BaseModel):
    id_historial: int
    id_evaluacion: int
    id_resultado: Optional[int]
    fecha_registro: Optional[datetime]
    observacion: Optional[str]
    nombre_nivel: Optional[str]
    color_nivel: Optional[str]
    nombre_consejero: Optional[str] = None
    es_seguimiento: bool = False

    class Config:
        from_attributes = True


class EstudianteRiesgoOut(BaseModel):
    id_usuario: int
    nombres: str
    apellidos: str
    email: str
    id_evaluacion: Optional[int]
    fecha_evaluacion: Optional[datetime]
    nombre_nivel: Optional[str]
    color_nivel: Optional[str]
    puntaje_phq9: Optional[int]
    probabilidad: Optional[Decimal]

    class Config:
        from_attributes = True


class DashboardResumenOut(BaseModel):
    total: int
    riesgo_alto: int
    moderado: int
    riesgo_bajo: int
    nuevos: int


class CaseDetailOut(BaseModel):
    usuario: UsuarioOut
    ultima_evaluacion: Optional[EvaluacionOut]
    respuestas_phq9: List[RespuestaPHQ9Out]
    texto_libre: Optional[TextoLibreOut]
    resultado: Optional[ResultadoOut]
    acciones: List[AccionOut]
    historial: List[HistorialOut]

class SeguimientoUpdate(BaseModel):
    observacion: str
    estado_seguimiento: Optional[str] = "Seguimiento"

    @field_validator("observacion")
    @classmethod
    def observacion_no_vacia(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("La observación no puede estar vacía")
        return value