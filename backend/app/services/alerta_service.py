from __future__ import annotations

import unicodedata
from datetime import datetime, timezone
from decimal import Decimal
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.alerta_notificacion_model import AlertaNotificacion
from app.models.evaluacion_model import Evaluacion
from app.models.usuario_model import Usuario
from app.models.bitacora_sistema_model import BitacoraSistema
from app.schemas.alerta_schema import AlertaNotificacionOut, AlertaPendientesOut


def _normalize_nivel(nombre: str) -> str:
    return (
        unicodedata.normalize("NFD", str(nombre))
        .encode("ascii", "ignore")
        .decode()
        .lower()
        .strip()
    )


def _es_riesgo_alto(nombre_nivel: str) -> bool:
    normalized = _normalize_nivel(nombre_nivel)
    return normalized == "alto" or "crit" in normalized


def service_crear_alerta_riesgo_alto(
    db: Session,
    *,
    id_evaluacion: int,
    id_resultado: int,
    id_estudiante: int,
    puntaje_phq9: int,
    probabilidad: float,
    nombre_nivel: str,
) -> AlertaNotificacion | None:
    if not _es_riesgo_alto(nombre_nivel):
        return None

    existente = (
        db.query(AlertaNotificacion)
        .filter(AlertaNotificacion.id_evaluacion == id_evaluacion)
        .first()
    )
    if existente:
        return existente

    alerta = AlertaNotificacion(
        id_evaluacion=id_evaluacion,
        id_resultado=id_resultado,
        id_estudiante=id_estudiante,
        puntaje_phq9=puntaje_phq9,
        probabilidad=Decimal(str(round(probabilidad, 4))),
        nombre_nivel=nombre_nivel,
        estado="pendiente",
    )
    db.add(alerta)
    db.flush()
    return alerta


def _to_alerta_out(alerta: AlertaNotificacion, db: Session) -> AlertaNotificacionOut:
    estudiante = db.query(Usuario).filter(Usuario.id_usuario == alerta.id_estudiante).first()
    evaluacion = db.query(Evaluacion).filter(Evaluacion.id_evaluacion == alerta.id_evaluacion).first()
    return AlertaNotificacionOut(
        id_alerta=alerta.id_alerta,
        id_evaluacion=alerta.id_evaluacion,
        id_estudiante=alerta.id_estudiante,
        nombres_estudiante=estudiante.nombres if estudiante else "",
        apellidos_estudiante=estudiante.apellidos if estudiante else "",
        fecha_evaluacion=evaluacion.fecha_evaluacion if evaluacion else None,
        puntaje_phq9=alerta.puntaje_phq9,
        probabilidad=alerta.probabilidad,
        nombre_nivel=alerta.nombre_nivel,
        estado=alerta.estado,
        fecha_creacion=alerta.fecha_creacion,
    )


def service_listar_alertas_pendientes(db: Session) -> List[AlertaNotificacionOut]:
    alertas = (
        db.query(AlertaNotificacion)
        .filter(AlertaNotificacion.estado == "pendiente")
        .order_by(AlertaNotificacion.fecha_creacion.desc())
        .all()
    )
    return [_to_alerta_out(a, db) for a in alertas]


def service_contar_alertas_pendientes(db: Session) -> AlertaPendientesOut:
    total = (
        db.query(AlertaNotificacion)
        .filter(AlertaNotificacion.estado == "pendiente")
        .count()
    )
    return AlertaPendientesOut(pendientes=total)


def service_marcar_alerta_revisada(
    id_alerta: int,
    id_consejero: int,
    db: Session,
    ip: str | None = None,
) -> AlertaNotificacionOut:
    alerta = db.query(AlertaNotificacion).filter(AlertaNotificacion.id_alerta == id_alerta).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    if alerta.estado == "revisado":
        return _to_alerta_out(alerta, db)

    alerta.estado = "revisado"
    alerta.id_consejero_revision = id_consejero
    alerta.fecha_revision = datetime.now(timezone.utc)

    db.add(BitacoraSistema(
        id_usuario=id_consejero,
        accion="ALERTA_REVISADA",
        detalles=(
            f"Alerta #{id_alerta} revisada | Estudiante #{alerta.id_estudiante} | "
            f"Evaluación #{alerta.id_evaluacion}"
        ),
        ip_origen=ip,
    ))
    db.commit()
    db.refresh(alerta)
    return _to_alerta_out(alerta, db)
