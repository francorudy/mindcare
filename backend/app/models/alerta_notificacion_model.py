from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base


class AlertaNotificacion(Base):
    __tablename__ = "alerta_notificacion"

    id_alerta = Column(Integer, primary_key=True, index=True)
    id_evaluacion = Column(
        Integer,
        ForeignKey("evaluacion.id_evaluacion", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    id_resultado = Column(
        Integer,
        ForeignKey("resultado.id_resultado", ondelete="CASCADE"),
        nullable=False,
    )
    id_estudiante = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"),
        nullable=False,
    )
    puntaje_phq9 = Column(Integer, nullable=False)
    probabilidad = Column(Numeric(6, 4), nullable=False)
    nombre_nivel = Column(String(50), nullable=False)
    estado = Column(String(20), nullable=False, default="pendiente")
    fecha_creacion = Column(DateTime, server_default=func.now())
    fecha_revision = Column(DateTime, nullable=True)
    id_consejero_revision = Column(
        Integer,
        ForeignKey("usuario.id_usuario", ondelete="SET NULL"),
        nullable=True,
    )

    evaluacion = relationship("Evaluacion")
    resultado = relationship("Resultado")
    estudiante = relationship("Usuario", foreign_keys=[id_estudiante])
    consejero_revision = relationship("Usuario", foreign_keys=[id_consejero_revision])
