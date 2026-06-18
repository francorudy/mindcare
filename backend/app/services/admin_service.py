import unicodedata

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from typing import List, Optional

from app.models.usuario_model              import Usuario
from app.models.usuario_rol_model           import UsuarioRol
from app.models.rol_model                   import Rol
from app.models.evaluacion_model            import Evaluacion
from app.models.respuesta_phq9_model        import RespuestaPHQ9
from app.models.texto_libre_model           import TextoLibre
from app.models.resultado_model             import Resultado
from app.models.nivel_riesgo_model          import NivelRiesgo
from app.models.accion_recomendada_model    import AccionRecomendada
from app.models.tipo_accion_model           import TipoAccion
from app.models.historial_evaluacion_model  import HistorialEvaluacion
from app.models.bitacora_sistema_model      import BitacoraSistema

from app.schemas.auth_schema          import UsuarioOut
from app.schemas.evaluacion_schema    import EvaluacionOut
from app.schemas.phq9_schema          import RespuestaPHQ9Out
from app.schemas.journal_schema       import TextoLibreOut
from app.schemas.resultado_schema     import ResultadoOut
from app.schemas.recomendacion_schema import AccionOut
from app.schemas.admin_schema import (
    DashboardResumenOut, EstudianteRiesgoOut,
    CaseDetailOut, HistorialOut, SeguimientoUpdate,
)
from app.utils.roles import find_rol_by_name
from app.utils.historial_parser import parse_historial_observacion, format_seguimiento_observacion


def _get_id_rol_estudiante(db: Session) -> int:
    rol = find_rol_by_name(db, "estudiante")
    return rol.id_rol if rol else 1


# ── Dashboard resumen ─────────────────────────────────────────────────────────

def _normalize_nivel(nombre: str) -> str:
    return (
        unicodedata.normalize("NFD", nombre)
        .encode("ascii", "ignore")
        .decode()
        .lower()
        .strip()
    )


def _clasificar_nivel(nombre: Optional[str]) -> Optional[str]:
    if not nombre:
        return None
    lower = _normalize_nivel(nombre)
    if "crit" in lower or lower == "alto":
        return "Alto"
    if lower == "moderado":
        return "Moderado"
    if lower == "bajo":
        return "Bajo"
    return None


def service_resumen(db: Session) -> DashboardResumenOut:
    id_rol = _get_id_rol_estudiante(db)

    ultimo_ev_sq = (
        db.query(
            Evaluacion.id_usuario,
            func.max(Evaluacion.id_evaluacion).label("ultimo_id"),
        )
        .group_by(Evaluacion.id_usuario)
        .subquery()
    )

    niveles = (
        db.query(NivelRiesgo.nombre_nivel)
        .join(Resultado, Resultado.id_nivel_riesgo == NivelRiesgo.id_nivel_riesgo)
        .join(Evaluacion, Evaluacion.id_evaluacion == Resultado.id_evaluacion)
        .join(ultimo_ev_sq, ultimo_ev_sq.c.ultimo_id == Evaluacion.id_evaluacion)
        .join(UsuarioRol, UsuarioRol.id_usuario == Evaluacion.id_usuario)
        .join(Usuario, Usuario.id_usuario == Evaluacion.id_usuario)
        .filter(UsuarioRol.id_rol == id_rol, Usuario.estado == "A")
        .all()
    )

    riesgo_alto = moderado = riesgo_bajo = 0
    for (nombre,) in niveles:
        bucket = _clasificar_nivel(nombre)
        if bucket == "Alto":
            riesgo_alto += 1
        elif bucket == "Moderado":
            moderado += 1
        elif bucket == "Bajo":
            riesgo_bajo += 1

    total = riesgo_alto + moderado + riesgo_bajo

    nuevos = (
        db.query(func.count(func.distinct(HistorialEvaluacion.id_usuario)))
        .join(
            ultimo_ev_sq,
            (HistorialEvaluacion.id_usuario == ultimo_ev_sq.c.id_usuario)
            & (HistorialEvaluacion.id_evaluacion == ultimo_ev_sq.c.ultimo_id),
        )
        .filter(HistorialEvaluacion.observacion.like("%automático%"))
        .scalar() or 0
    )

    return DashboardResumenOut(
        total=total,
        riesgo_alto=riesgo_alto,
        moderado=moderado,
        riesgo_bajo=riesgo_bajo,
        nuevos=nuevos,
    )


# ── Lista estudiantes ─────────────────────────────────────────────────────────

def service_listar_estudiantes(db: Session, nivel: Optional[str] = None) -> List[EstudianteRiesgoOut]:
    id_rol = _get_id_rol_estudiante(db)

    ultimo_ev_sq = (
        db.query(
            Evaluacion.id_usuario,
            func.max(Evaluacion.id_evaluacion).label("ultimo_id"),
        )
        .join(Resultado, Resultado.id_evaluacion == Evaluacion.id_evaluacion)
        .group_by(Evaluacion.id_usuario)
        .subquery()
    )

    query = (
        db.query(Usuario, Evaluacion, Resultado, NivelRiesgo)
        .join(UsuarioRol, UsuarioRol.id_usuario == Usuario.id_usuario)
        .join(ultimo_ev_sq, ultimo_ev_sq.c.id_usuario == Usuario.id_usuario)
        .join(Evaluacion, Evaluacion.id_evaluacion == ultimo_ev_sq.c.ultimo_id)
        .join(Resultado, Resultado.id_evaluacion == Evaluacion.id_evaluacion)
        .join(NivelRiesgo, NivelRiesgo.id_nivel_riesgo == Resultado.id_nivel_riesgo)
        .filter(UsuarioRol.id_rol == id_rol, Usuario.estado == "A")
    )

    if nivel:
        if nivel == "Alto":
            query = query.filter(NivelRiesgo.nombre_nivel.in_(["Alto", "Crítico"]))
        else:
            query = query.filter(NivelRiesgo.nombre_nivel == nivel)

    rows = query.order_by(Evaluacion.fecha_evaluacion.desc()).all()

    result = []
    for usuario, ev, res, nivel_obj in rows:
        puntaje = None
        if ev:
            puntaje = (
                db.query(func.sum(RespuestaPHQ9.valor))
                .filter(RespuestaPHQ9.id_evaluacion == ev.id_evaluacion)
                .scalar()
            )
        result.append(EstudianteRiesgoOut(
            id_usuario=usuario.id_usuario,
            nombres=usuario.nombres,
            apellidos=usuario.apellidos,
            email=usuario.email,
            id_evaluacion=ev.id_evaluacion if ev else None,
            fecha_evaluacion=ev.fecha_evaluacion if ev else None,
            nombre_nivel=nivel_obj.nombre_nivel if nivel_obj else None,
            color_nivel=nivel_obj.color if nivel_obj else None,
            puntaje_phq9=int(puntaje) if puntaje else None,
            probabilidad=res.probabilidad if res else None,
        ))
    return result


def service_detalle_caso(id_usuario: int, id_consejero: int, db: Session, ip: str = None) -> CaseDetailOut:
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    ultima_ev = (
        db.query(Evaluacion)
        .filter(Evaluacion.id_usuario == id_usuario)
        .order_by(Evaluacion.fecha_evaluacion.desc())
        .first()
    )

    respuestas, texto, resultado_out, acciones_out = [], None, None, []

    if ultima_ev:
        respuestas = (
            db.query(RespuestaPHQ9)
            .filter(RespuestaPHQ9.id_evaluacion == ultima_ev.id_evaluacion)
            .order_by(RespuestaPHQ9.pregunta_numero)
            .all()
        )
        texto = db.query(TextoLibre).filter(TextoLibre.id_evaluacion == ultima_ev.id_evaluacion).first()

        res = db.query(Resultado).filter(Resultado.id_evaluacion == ultima_ev.id_evaluacion).first()
        if res:
            nivel = db.query(NivelRiesgo).filter(NivelRiesgo.id_nivel_riesgo == res.id_nivel_riesgo).first()
            resultado_out = ResultadoOut(
                id_resultado=res.id_resultado,
                id_evaluacion=res.id_evaluacion,
                probabilidad=res.probabilidad,
                id_nivel_riesgo=res.id_nivel_riesgo,
                nombre_nivel=nivel.nombre_nivel if nivel else None,
                color_nivel=nivel.color if nivel else None,
                recomendaciones=res.recomendaciones,
                fecha_resultado=res.fecha_resultado,
                modelo_utilizado=res.modelo_utilizado,
                version_modelo=res.version_modelo,
            )
            for a in db.query(AccionRecomendada).filter(AccionRecomendada.id_resultado == res.id_resultado).all():
                tipo = db.query(TipoAccion).filter(TipoAccion.id_tipo_accion == a.id_tipo_accion).first()
                acciones_out.append(AccionOut(
                    id_accion_recomendada=a.id_accion_recomendada,
                    id_tipo_accion=a.id_tipo_accion,
                    nombre_accion=tipo.nombre_accion if tipo else None,
                    descripcion=tipo.descripcion if tipo else None,
                    recursos=tipo.recursos if tipo else None,
                    descripcion_personalizada=a.descripcion_personalizada,
                    estado=a.estado,
                ))

    historial_db = (
        db.query(HistorialEvaluacion)
        .filter(HistorialEvaluacion.id_usuario == id_usuario)
        .order_by(HistorialEvaluacion.fecha_registro.desc())
        .all()
    )
    historial_out = []
    for h in historial_db:
        nivel_h = None
        if h.id_resultado:
            res_h = db.query(Resultado).filter(Resultado.id_resultado == h.id_resultado).first()
            if res_h:
                nivel_h = db.query(NivelRiesgo).filter(NivelRiesgo.id_nivel_riesgo == res_h.id_nivel_riesgo).first()
        es_seguimiento, nombre_consejero, observacion = parse_historial_observacion(h.observacion)
        historial_out.append(HistorialOut(
            id_historial=h.id_historial,
            id_evaluacion=h.id_evaluacion,
            id_resultado=h.id_resultado,
            fecha_registro=h.fecha_registro,
            observacion=observacion or h.observacion,
            nombre_nivel=nivel_h.nombre_nivel if nivel_h else None,
            color_nivel=nivel_h.color if nivel_h else None,
            nombre_consejero=nombre_consejero,
            es_seguimiento=es_seguimiento,
        ))

    db.add(BitacoraSistema(
        id_usuario=id_consejero,
        accion="VER_CASO",
        detalles=f"Consejero #{id_consejero} vio caso estudiante #{id_usuario}",
        ip_origen=ip,
    ))
    db.commit()

    return CaseDetailOut(
        usuario=UsuarioOut.model_validate(usuario),
        ultima_evaluacion=EvaluacionOut.model_validate(ultima_ev) if ultima_ev else None,
        respuestas_phq9=[RespuestaPHQ9Out.model_validate(r) for r in respuestas],
        texto_libre=TextoLibreOut.model_validate(texto) if texto else None,
        resultado=resultado_out,
        acciones=acciones_out,
        historial=historial_out,
    )

def service_marcar_seguimiento(
    id_usuario: int,
    id_consejero: int,
    data: SeguimientoUpdate,
    db: Session,
    ip: str = None,
) -> dict:
    ultima_ev = (
        db.query(Evaluacion)
        .filter(Evaluacion.id_usuario == id_usuario)
        .order_by(Evaluacion.fecha_evaluacion.desc())
        .first()
    )
    if not ultima_ev:
        raise HTTPException(status_code=404, detail="El estudiante no tiene evaluaciones")

    res = db.query(Resultado).filter(Resultado.id_evaluacion == ultima_ev.id_evaluacion).first()
    consejero = db.query(Usuario).filter(Usuario.id_usuario == id_consejero).first()
    nombre_consejero = (
        f"{consejero.nombres} {consejero.apellidos}".strip() if consejero else "Consejero"
    )
    db.add(HistorialEvaluacion(
        id_usuario=id_usuario,
        id_evaluacion=ultima_ev.id_evaluacion,
        id_resultado=res.id_resultado if res else None,
        observacion=format_seguimiento_observacion(
            id_consejero,
            nombre_consejero,
            data.observacion,
        ),
    ))
    db.add(BitacoraSistema(
        id_usuario=id_consejero,
        accion="SEGUIMIENTO",
        detalles=f"Seguimiento estudiante #{id_usuario}: {data.observacion}",
        ip_origen=ip,
    ))
    db.commit()
    return {"message": "Seguimiento registrado correctamente"}