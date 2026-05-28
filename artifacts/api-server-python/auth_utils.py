import os
import jwt as pyjwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db import get_db, fetchone

JWT_SECRET = os.environ.get("SESSION_SECRET", "cerebrito_secret_2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

security = HTTPBearer()


def crear_token(user_id: int, usuario: str, rol: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS)
    payload = {"userId": user_id, "usuario": usuario, "rol": rol, "exp": exp}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")

    user_id = payload.get("userId")
    with get_db() as conn:
        user = fetchone(
            conn,
            "SELECT id, usuario, rol, grado_bachillerato FROM perfiles WHERE id = %s",
            (user_id,),
        )
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


def require_docente(user=None):
    if user["rol"] != "docente":
        raise HTTPException(status_code=403, detail="Solo los docentes pueden realizar esta accion")
    return user
