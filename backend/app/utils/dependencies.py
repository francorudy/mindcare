from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.usuario_model     import Usuario
from app.models.usuario_rol_model import UsuarioRol
from app.utils.auth         import decode_token
from app.utils.roles        import find_rol_by_name

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    if not credentials or not credentials.credentials.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Debes iniciar sesión para continuar.",
        )

    payload = decode_token(credentials.credentials.strip())
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin usuario")

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

    user = db.query(Usuario).filter(
        Usuario.id_usuario == user_id_int,
        Usuario.estado == "A",
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user


def require_rol(nombre_rol: str):
    """Dependencia que exige un rol específico."""
    def checker(
        current_user: Usuario = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> Usuario:
        rol = find_rol_by_name(db, nombre_rol)
        if not rol:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere rol: {nombre_rol}",
            )

        ur = (
            db.query(UsuarioRol)
            .filter(
                UsuarioRol.id_usuario == current_user.id_usuario,
                UsuarioRol.id_rol == rol.id_rol,
            )
            .first()
        )
        if not ur:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere rol: {nombre_rol}",
            )
        return current_user
    return checker


def require_role(nombre_rol: str):
    """Alias de require_rol para validación de roles en endpoints."""
    return require_rol(nombre_rol)