from sqlalchemy import Column, Integer, Text, DateTime, CHAR, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class AccionRecomendada(Base):
    __tablename__ = "accion_recomendada"

    id_accion_recomendada     = Column(Integer, primary_key=True, index=True)
    id_resultado              = Column(Integer, ForeignKey("resultado.id_resultado",         ondelete="CASCADE"),  nullable=False)
    id_tipo_accion            = Column(Integer, ForeignKey("tipo_accion.id_tipo_accion",     ondelete="RESTRICT"), nullable=False)
    descripcion_personalizada = Column(Text)
    fecha_generacion          = Column(DateTime, server_default=func.now())
    estado                    = Column(CHAR(1), default="A")

    resultado   = relationship("Resultado",   back_populates="acciones")
    tipo_accion = relationship("TipoAccion",  back_populates="acciones")