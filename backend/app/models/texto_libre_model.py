from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base


class TextoLibre(Base):
    __tablename__ = "texto_libre"

    id_texto      = Column(Integer, primary_key=True, index=True)
    id_evaluacion = Column(Integer, ForeignKey("evaluacion.id_evaluacion", ondelete="CASCADE"), nullable=False)
    texto_usuario = Column(Text)

    evaluacion = relationship("Evaluacion", back_populates="texto")