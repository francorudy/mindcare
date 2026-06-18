from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base


class RespuestaPHQ9(Base):
    __tablename__ = "respuesta_phq9"

    id_respuesta        = Column(Integer, primary_key=True, index=True)
    id_evaluacion       = Column(Integer, ForeignKey("evaluacion.id_evaluacion", ondelete="CASCADE"), nullable=False)
    pregunta_numero     = Column(Integer, nullable=False)
    texto_pregunta      = Column(String(300))
    opcion_seleccionada = Column(Integer)
    valor               = Column(Integer)

    evaluacion = relationship("Evaluacion", back_populates="respuestas")