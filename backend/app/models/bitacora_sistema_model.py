from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class BitacoraSistema(Base):
    __tablename__ = "bitacora_sistema"

    id_bitacora = Column(Integer, primary_key=True, index=True)
    id_usuario  = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="SET NULL"), nullable=True)
    accion      = Column(String(100), nullable=False)
    detalles    = Column(Text)
    fecha_hora  = Column(DateTime, server_default=func.now())
    ip_origen   = Column(String(45))

    usuario = relationship("Usuario", back_populates="bitacoras")