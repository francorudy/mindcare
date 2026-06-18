from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.connection import Base


class UsuarioRol(Base):
    __tablename__ = "usuario_rol"
    __table_args__ = (UniqueConstraint("id_usuario", "id_rol"),)

    id_usuario_rol = Column(Integer, primary_key=True, index=True)
    id_usuario     = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    id_rol         = Column(Integer, ForeignKey("rol.id_rol",         ondelete="CASCADE"), nullable=False)

    usuario = relationship("Usuario", back_populates="roles")
    rol     = relationship("Rol",     back_populates="usuarios")