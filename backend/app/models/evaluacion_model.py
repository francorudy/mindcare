from sqlalchemy import Column, Integer, String, DateTime, CHAR, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class Evaluacion(Base):
    __tablename__ = "evaluacion"

    id_evaluacion    = Column(Integer, primary_key=True, index=True)
    id_usuario       = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    fecha_evaluacion = Column(DateTime, server_default=func.now())
    fuente           = Column(String(20))
    estado           = Column(CHAR(1), default="A")

    usuario    = relationship("Usuario",             back_populates="evaluaciones")
    respuestas = relationship("RespuestaPHQ9",       back_populates="evaluacion")
    texto      = relationship("TextoLibre",          back_populates="evaluacion", uselist=False)
    resultado  = relationship("Resultado",           back_populates="evaluacion", uselist=False)
    historial  = relationship("HistorialEvaluacion", back_populates="evaluacion")