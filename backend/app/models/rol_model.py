from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Rol(Base):
    __tablename__ = "rol"

    id_rol      = Column(Integer, primary_key=True, index=True)
    nombre_rol  = Column(String(50), nullable=False)
    descripcion = Column(String(200))

    usuarios = relationship("UsuarioRol", back_populates="rol")