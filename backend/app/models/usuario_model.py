from sqlalchemy import Column, Integer, String, Date, DateTime, CHAR
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario       = Column(Integer, primary_key=True, index=True)
    nombres          = Column(String(100), nullable=False)
    apellidos        = Column(String(100), nullable=False)
    email            = Column(String(150), nullable=False, unique=True)
    password         = Column(String(255), nullable=False)
    fecha_nacimiento = Column(Date, nullable=True)
    genero           =Column(String(20), nullable=True)
    telefono         = Column(String(15), nullable=True)
    fecha_registro   = Column(DateTime, server_default=func.now())
    estado           = Column(CHAR(1), default="A")

    roles        = relationship("UsuarioRol",          back_populates="usuario")
    evaluaciones = relationship("Evaluacion",          back_populates="usuario")
    historial    = relationship("HistorialEvaluacion", back_populates="usuario")
    bitacoras    = relationship("BitacoraSistema",     back_populates="usuario")