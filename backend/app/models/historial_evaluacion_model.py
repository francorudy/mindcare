from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class HistorialEvaluacion(Base):
    __tablename__ = "historial_evaluacion"

    id_historial   = Column(Integer, primary_key=True, index=True)
    id_usuario     = Column(Integer, ForeignKey("usuario.id_usuario",       ondelete="CASCADE"),   nullable=False)
    id_evaluacion  = Column(Integer, ForeignKey("evaluacion.id_evaluacion", ondelete="CASCADE"),   nullable=False)
    id_resultado   = Column(Integer, ForeignKey("resultado.id_resultado",   ondelete="SET NULL"),  nullable=True)
    fecha_registro = Column(DateTime, server_default=func.now())
    observacion    = Column(Text)

    usuario    = relationship("Usuario",    back_populates="historial")
    evaluacion = relationship("Evaluacion", back_populates="historial")
    resultado  = relationship("Resultado",  back_populates="historial")