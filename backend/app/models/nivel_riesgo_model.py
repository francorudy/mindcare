from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.connection import Base


class NivelRiesgo(Base):
    __tablename__ = "nivel_riesgo"

    id_nivel_riesgo = Column(Integer, primary_key=True, index=True)
    nombre_nivel    = Column(String(20), nullable=False, unique=True)
    descripcion     = Column(String(255))
    color           = Column(String(20))
    orden           = Column(Integer)

    resultados = relationship("Resultado", back_populates="nivel_riesgo")
 