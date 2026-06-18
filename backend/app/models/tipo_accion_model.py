from sqlalchemy import Column, Integer, String, Text, CHAR
from sqlalchemy.orm import relationship
from app.database.connection import Base


class TipoAccion(Base):
    __tablename__ = "tipo_accion"

    id_tipo_accion = Column(Integer, primary_key=True, index=True)
    nombre_accion  = Column(String(100), nullable=False)
    descripcion    = Column(String(255))
    recursos       = Column(Text)
    orden          = Column(Integer)
    estado         = Column(CHAR(1), default="A")

    acciones = relationship("AccionRecomendada", back_populates="tipo_accion")