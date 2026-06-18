from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.usuario_model      import Usuario
from app.models.usuario_rol_model  import UsuarioRol
from app.models.rol_model          import Rol
from app.models.bitacora_sistema_model  import BitacoraSistema
from app.schemas.auth_schema import UsuarioCreate, UsuarioLogin, UsuarioOut, TokenOut
from app.utils.auth import hash_password, verify_password, create_access_token
from app.utils.roles import find_rol_by_name


def _registrar_bitacora(db: Session, accion: str, id_usuario=None, detalles=None, ip=None):
    db.add(BitacoraSistema(id_usuario=id_usuario, accion=accion, detalles=detalles, ip_origen=ip))
    db.commit()


def service_register(data: UsuarioCreate, db: Session, ip: str = None) -> Usuario:
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    if data.id_rol not in (1, 2):
        raise HTTPException(status_code=400, detail="Rol no válido")

    rol = db.query(Rol).filter(Rol.id_rol == data.id_rol).first()
    if not rol:
        rol = find_rol_by_name(db, "estudiante" if data.id_rol == 1 else "consejero")
    if not rol:
        raise HTTPException(status_code=400, detail="Rol no válido")

    nuevo = Usuario(
        nombres=data.nombres,
        apellidos=data.apellidos,
        email=data.email,
        password=hash_password(data.password),
        fecha_nacimiento=data.fecha_nacimiento,
        genero=data.genero,
        telefono=data.telefono,
    )
    db.add(nuevo)
    db.flush()

    db.add(UsuarioRol(id_usuario=nuevo.id_usuario, id_rol=rol.id_rol))
    db.commit()
    db.refresh(nuevo)

    _registrar_bitacora(
        db, accion="REGISTRO",
        id_usuario=nuevo.id_usuario,
        detalles=f"Email: {nuevo.email} | Rol: {rol.nombre_rol}",
        ip=ip,
    )
    return nuevo


def service_login(data: UsuarioLogin, db: Session, ip: str = None) -> TokenOut:
    user = db.query(Usuario).filter(
        Usuario.email == data.email,
        Usuario.estado == "A",
    ).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    rol_nombre = "estudiante" if data.tipo == "estudiante" else "consejero"
    rol = find_rol_by_name(db, rol_nombre)
    if not rol:
        raise HTTPException(status_code=403, detail=f"El usuario no tiene rol de {rol_nombre}")

    ur = (
        db.query(UsuarioRol)
        .filter(
            UsuarioRol.id_usuario == user.id_usuario,
            UsuarioRol.id_rol == rol.id_rol,
        )
        .first()
    )
    if not ur:
        raise HTTPException(status_code=403, detail=f"El usuario no tiene rol de {rol_nombre}")

    token = create_access_token({"sub": str(user.id_usuario), "rol": rol_nombre})

    _registrar_bitacora(
        db, accion="LOGIN",
        id_usuario=user.id_usuario,
        detalles=f"Login | tipo: {data.tipo}",
        ip=ip,
    )

    return TokenOut(
        access_token=token,
        token_type="bearer",
        usuario=UsuarioOut.model_validate(user),
        rol=rol_nombre,
    )