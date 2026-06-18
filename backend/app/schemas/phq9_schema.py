from pydantic import BaseModel
from typing import Optional, List


class RespuestaPHQ9Item(BaseModel):
    pregunta_numero: int
    texto_pregunta: Optional[str] = None
    opcion_seleccionada: int   # 0-3
    valor: int                 # 0-3


class PHQ9Submit(BaseModel):
    id_evaluacion: int
    respuestas: List[RespuestaPHQ9Item]


class RespuestaPHQ9Out(BaseModel):
    id_respuesta: int
    pregunta_numero: int
    texto_pregunta: Optional[str]
    opcion_seleccionada: Optional[int]
    valor: Optional[int]

    class Config:
        from_attributes = True