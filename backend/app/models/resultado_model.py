from sqlalchemy import Column, Integer, Numeric, Text, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class Resultado(Base):
    __tablename__ = "resultado"

    id_resultado     = Column(Integer, primary_key=True, index=True)
    id_evaluacion    = Column(Integer, ForeignKey("evaluacion.id_evaluacion", ondelete="CASCADE"), nullable=False, unique=True)
    probabilidad     = Column(Numeric(5, 4))
    id_nivel_riesgo  = Column(Integer, ForeignKey("nivel_riesgo.id_nivel_riesgo", ondelete="SET NULL"), nullable=True)
    recomendaciones  = Column(Text)
    fecha_resultado  = Column(DateTime, server_default=func.now())
    modelo_utilizado = Column(String(100))
    version_modelo   = Column(String(20))

    evaluacion   = relationship("Evaluacion",          back_populates="resultado")
    nivel_riesgo = relationship("NivelRiesgo",         back_populates="resultados")
    acciones     = relationship("AccionRecomendada",   back_populates="resultado")
    historial    = relationship("HistorialEvaluacion", back_populates="resultado")