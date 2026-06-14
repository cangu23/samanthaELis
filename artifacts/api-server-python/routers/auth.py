import os
import random
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from db import get_db, fetchone, execute, fetchall
from auth_utils import crear_token, get_current_user

router = APIRouter()

DOCENTE_CODE = os.environ.get("DOCENTE_CODE", "CUMBAYA2025").strip().upper()

CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generar_token6() -> str:
    return "".join(random.choices(CHARS, k=6))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(10)).decode()


def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def safe_user(row: dict) -> dict:
    row = dict(row)
    row.pop("password_hash", None)
    row.pop("reset_token", None)
    row.pop("reset_token_expires_at", None)
    for k, v in row.items():
        if isinstance(v, datetime):
            row[k] = v.isoformat()
    return row


async def enviar_email_reset(email: str, token: str) -> bool:
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    smtp_from = os.environ.get("SMTP_FROM", smtp_user)
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    if not smtp_host or not smtp_user or not smtp_pass:
        return False
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Recuperacion de contrasena - Cerebrito"
        msg["From"] = f"Cerebrito <{smtp_from}>"
        msg["To"] = email
        html = f"""<div style="font-family:sans-serif;max-width:400px;margin:auto">
<h2 style="color:#0EA5E9">Cerebrito</h2>
<p>Tu codigo de recuperacion de contrasena es:</p>
<div style="font-size:2rem;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#0f172a;color:#A855F7;border-radius:8px;font-family:monospace">{token}</div>
<p style="color:#666;font-size:0.875rem">Este codigo expira en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
</div>"""
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, email, msg.as_string())
        return True
    except Exception:
        return False


class RegisterBody(BaseModel):
    nombre: str
    usuario: str
    password: str
    rol: str
    grado_bachillerato: Optional[int] = None
    codigo_docente: Optional[str] = None
    email: Optional[str] = None
    cedula: Optional[str] = None


@router.post("/auth/register", status_code=201)
def register(body: RegisterBody):
    if not body.nombre or not body.usuario or not body.password or not body.rol:
        raise HTTPException(400, "Todos los campos son requeridos")

    if body.rol == "docente":
        codigo_enviado = (body.codigo_docente or "").strip().upper()
        if not DOCENTE_CODE or codigo_enviado != DOCENTE_CODE:
            raise HTTPException(403, "El codigo de docente es incorrecto")
    elif body.rol != "estudiante":
        raise HTTPException(403, "Rol no permitido")

    if body.rol == "estudiante":
        if not body.grado_bachillerato:
            raise HTTPException(400, "El grado de bachillerato es requerido para estudiantes")
        if body.grado_bachillerato not in (1, 2, 3):
            raise HTTPException(400, "El grado debe ser 1, 2 o 3")

    with get_db() as conn:
        existing = fetchone(conn, "SELECT id FROM perfiles WHERE usuario = %s", (body.usuario,))
        if existing:
            raise HTTPException(400, "El nombre de usuario ya esta en uso")

        if body.cedula:
            existing_cedula = fetchone(conn, "SELECT id FROM perfiles WHERE cedula = %s", (body.cedula,))
            if existing_cedula:
                raise HTTPException(400, "La cedula ya esta registrada")

        password_hash = hash_password(body.password)
        grado = body.grado_bachillerato if body.rol == "estudiante" else None

        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO perfiles (nombre, cedula, usuario, password_hash, rol, grado_bachillerato, email,
                   puntos_totales, racha_dias, retos_completados)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, 0, 0, 0)""",
                (body.nombre, body.cedula or None, body.usuario, password_hash, body.rol, grado, body.email or None),
            )
            conn.commit()
            nuevo_id = cur.lastrowid

        nuevo = fetchone(conn, "SELECT * FROM perfiles WHERE id = %s", (nuevo_id,))

    token = crear_token(nuevo["id"], nuevo["usuario"], nuevo["rol"])
    return {"user": safe_user(nuevo), "token": token}


class LoginBody(BaseModel):
    usuario: str
    password: str


@router.post("/auth/login")
def login(body: LoginBody):
    if not body.usuario or not body.password:
        raise HTTPException(400, "Usuario y contrasena son requeridos")

    with get_db() as conn:
        perfil = fetchone(conn, "SELECT * FROM perfiles WHERE usuario = %s", (body.usuario,))
        if not perfil:
            raise HTTPException(401, "Usuario o contrasena incorrectos")

        if not check_password(body.password, perfil["password_hash"]):
            raise HTTPException(401, "Usuario o contrasena incorrectos")

        ahora = datetime.now(timezone.utc)
        nueva_racha = perfil.get("racha_dias") or 0
        ultimo = perfil.get("ultimo_acceso")

        if not ultimo:
            nueva_racha = 1
        else:
            if isinstance(ultimo, str):
                ultimo = datetime.fromisoformat(ultimo)
            if ultimo.tzinfo is None:
                ultimo = ultimo.replace(tzinfo=timezone.utc)
            diff_horas = (ahora - ultimo).total_seconds() / 3600
            if diff_horas < 24:
                nueva_racha = perfil.get("racha_dias") or 0
            elif diff_horas < 48:
                nueva_racha = (perfil.get("racha_dias") or 0) + 1
            else:
                nueva_racha = 1

        execute(conn, "UPDATE perfiles SET ultimo_acceso = %s, racha_dias = %s WHERE id = %s",
                (ahora, nueva_racha, perfil["id"]))

    token = crear_token(perfil["id"], perfil["usuario"], perfil["rol"])
    user_data = safe_user(dict(perfil))
    user_data["racha_dias"] = nueva_racha
    return {"user": user_data, "token": token}


class ForgotPasswordBody(BaseModel):
    cedula: str


@router.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordBody):
    if not body.cedula:
        raise HTTPException(400, "Cedula requerida")

    with get_db() as conn:
        perfil = fetchone(conn, "SELECT * FROM perfiles WHERE cedula = %s", (body.cedula,))
        if not perfil:
            return {"message": "Si la cedula existe, recibira instrucciones de recuperacion"}

        token = generar_token6()
        expiry = datetime.now(timezone.utc) + timedelta(hours=1)
        execute(conn, "UPDATE perfiles SET reset_token = %s, reset_token_expires_at = %s WHERE id = %s",
                (token, expiry, perfil["id"]))

    email_enviado = False
    if perfil.get("email"):
        email_enviado = await enviar_email_reset(perfil["email"], token)

    is_dev = os.environ.get("NODE_ENV", "development") != "production"
    resp: dict = {
        "message": "Si la cedula existe, recibira instrucciones de recuperacion",
        "email_enviado": email_enviado,
    }
    if is_dev:
        resp["dev_token"] = token
    return resp


class ResetPasswordBody(BaseModel):
    token: str
    nueva_password: str


@router.post("/auth/reset-password")
def reset_password(body: ResetPasswordBody):
    if not body.token or not body.nueva_password:
        raise HTTPException(400, "Token y nueva contrasena son requeridos")
    if len(body.nueva_password) < 6:
        raise HTTPException(400, "La contrasena debe tener al menos 6 caracteres")

    with get_db() as conn:
        perfil = fetchone(conn, "SELECT * FROM perfiles WHERE reset_token = %s", (body.token,))
        if not perfil:
            raise HTTPException(400, "El codigo es invalido o ha expirado")

        expiry = perfil.get("reset_token_expires_at")
        if expiry:
            if isinstance(expiry, str):
                expiry = datetime.fromisoformat(expiry)
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            if expiry < datetime.now(timezone.utc):
                raise HTTPException(400, "El codigo es invalido o ha expirado")

        new_hash = hash_password(body.nueva_password)
        execute(conn, "UPDATE perfiles SET password_hash = %s, reset_token = NULL, reset_token_expires_at = NULL WHERE id = %s",
                (new_hash, perfil["id"]))

    return {"message": "Contrasena actualizada exitosamente"}


@router.post("/auth/logout")
def logout(user=Depends(get_current_user)):
    return {"success": True, "message": "Sesion cerrada exitosamente"}


@router.get("/auth/me")
def me(user=Depends(get_current_user)):
    with get_db() as conn:
        perfil = fetchone(conn, "SELECT * FROM perfiles WHERE id = %s", (user["id"],))
    if not perfil:
        raise HTTPException(404, "Usuario no encontrado")
    return safe_user(dict(perfil))