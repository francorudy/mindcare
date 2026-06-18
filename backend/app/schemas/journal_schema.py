from pydantic import BaseModel
from typing import Optional


class TextoLibreCreate(BaseModel):
    id_evaluacion: int
    texto_usuario: str


class TextoLibreOut(BaseModel):
    id_texto: int
    id_evaluacion: int
    texto_usuario: Optional[str]

    class Config:
        from_attributes = True