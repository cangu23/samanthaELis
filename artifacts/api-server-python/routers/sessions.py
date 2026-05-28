import random
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from db import get_db, fetchone, fetchall, execute
from auth_utils import get_current_user
from datetime import datetime

router = APIRouter()

CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_code() -> str:
    return "".join(random.choices(CHARS, k=6))


def dt(v):
    if isinstance(v, datetime):
        return v.isoformat()
    return v


def serialize_row(row):
    if row is None:
        return None
    r = dict(row)
    for k, v in r.items():
        if isinstance(v, datetime):
            r[k] = v.isoformat()
    return r


class CreateSessionBody(BaseModel):
    nombre: str
    id_reto: int


@router.post("/sessions", status_code=201)
def create_session(body: CreateSessionBody, user=Depends(get_current_user)):
    if user["rol"] != "docente":
        raise HTTPException(403, "Solo los docentes pueden crear sesiones")
    if not body.nombre or not body.nombre.strip() or not body.id_reto:
        raise HTTPException(400, "nombre e id_reto son requeridos")

    with get_db() as conn:
        codigo = generate_code()
        for _ in range(10):
            existing = fetchone(conn, "SELECT id FROM sesiones_competencia WHERE codigo = %s", (codigo,))
            if not existing:
                break
            codigo = generate_code()

        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO sesiones_competencia (codigo, nombre, id_reto, id_docente, activa) VALUES (%s, %s, %s, %s, 1)",
                (codigo, body.nombre.strip(), body.id_reto, user["id"]),
            )
            conn.commit()
            sesion_id = cur.lastrowid

        sesion = fetchone(conn, "SELECT * FROM sesiones_competencia WHERE id = %s", (sesion_id,))

    r = serialize_row(sesion)
    r["link"] = f"/competir/{codigo}"
    return r


@router.get("/sessions")
def get_sessions(user=Depends(get_current_user)):
    if user["rol"] != "docente":
        raise HTTPException(403, "Solo los docentes pueden ver sus sesiones")

    with get_db() as conn:
        sesiones = fetchall(conn,
            "SELECT * FROM sesiones_competencia WHERE id_docente = %s ORDER BY creado_en DESC",
            (user["id"],))
        result = []
        for s in sesiones:
            s = dict(s)
            participantes = fetchall(conn, "SELECT id FROM participantes_sesion WHERE id_sesion = %s", (s["id"],))
            reto = fetchone(conn, "SELECT nombre, tipo_juego FROM retos WHERE id = %s", (s["id_reto"],))
            r = serialize_row(s)
            r["participantes_count"] = len(participantes)
            r["reto_nombre"] = reto["nombre"] if reto else "—"
            r["reto_tipo"] = reto["tipo_juego"] if reto else ""
            result.append(r)
    return result


@router.get("/sessions/{code}")
def get_session(code: str, user=Depends(get_current_user)):
    with get_db() as conn:
        sesion = fetchone(conn,
            "SELECT * FROM sesiones_competencia WHERE codigo = %s",
            (code.upper(),))
        if not sesion:
            raise HTTPException(404, "Sesion no encontrada")
        reto = fetchone(conn, "SELECT * FROM retos WHERE id = %s", (sesion["id_reto"],))
        docente = fetchone(conn, "SELECT nombre FROM perfiles WHERE id = %s", (sesion["id_docente"],))
        participantes = fetchall(conn, "SELECT id FROM participantes_sesion WHERE id_sesion = %s", (sesion["id"],))

    r = serialize_row(sesion)
    r["reto"] = serialize_row(reto)
    r["docente_nombre"] = docente["nombre"] if docente else "Docente"
    r["participantes_count"] = len(participantes)
    return r


class SessionResultBody(BaseModel):
    puntuacion: Optional[float] = 0
    tiempo_total: Optional[int] = 0
    respuestas_correctas: Optional[int] = 0
    total_preguntas: Optional[int] = 0


@router.post("/sessions/{code}/result")
def session_result(code: str, body: SessionResultBody, user=Depends(get_current_user)):
    with get_db() as conn:
        sesion = fetchone(conn,
            "SELECT * FROM sesiones_competencia WHERE codigo = %s",
            (code.upper(),))
        if not sesion:
            raise HTTPException(404, "Sesion no encontrada")
        if not sesion["activa"]:
            raise HTTPException(400, "La sesion ya no esta activa")

        existing = fetchone(conn,
            "SELECT * FROM participantes_sesion WHERE id_sesion = %s AND id_usuario = %s",
            (sesion["id"], user["id"]))

        if existing:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE participantes_sesion SET puntuacion=%s, tiempo_total=%s, respuestas_correctas=%s, total_preguntas=%s, completado=1 WHERE id=%s",
                    (body.puntuacion, body.tiempo_total, body.respuestas_correctas, body.total_preguntas, existing["id"]),
                )
                conn.commit()
            updated = fetchone(conn, "SELECT * FROM participantes_sesion WHERE id = %s", (existing["id"],))
            return serialize_row(updated)
        else:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO participantes_sesion (id_sesion, id_usuario, puntuacion, tiempo_total, respuestas_correctas, total_preguntas, completado) VALUES (%s,%s,%s,%s,%s,%s,1)",
                    (sesion["id"], user["id"], body.puntuacion, body.tiempo_total, body.respuestas_correctas, body.total_preguntas),
                )
                conn.commit()
                nuevo_id = cur.lastrowid
            nuevo = fetchone(conn, "SELECT * FROM participantes_sesion WHERE id = %s", (nuevo_id,))
            return serialize_row(nuevo)


@router.get("/sessions/{code}/ranking")
def session_ranking(code: str, user=Depends(get_current_user)):
    with get_db() as conn:
        sesion = fetchone(conn, "SELECT * FROM sesiones_competencia WHERE codigo = %s", (code.upper(),))
        if not sesion:
            raise HTTPException(404, "Sesion no encontrada")

        participantes = fetchall(conn,
            "SELECT * FROM participantes_sesion WHERE id_sesion = %s ORDER BY puntuacion DESC",
            (sesion["id"],))
        result = []
        for i, p in enumerate(participantes):
            perfil = fetchone(conn,
                "SELECT nombre, usuario, grado_bachillerato FROM perfiles WHERE id = %s",
                (p["id_usuario"],))
            result.append({
                "posicion": i + 1,
                "usuario_id": p["id_usuario"],
                "nombre": perfil["nombre"] if perfil else "Estudiante",
                "usuario": perfil["usuario"] if perfil else "",
                "grado_bachillerato": perfil["grado_bachillerato"] if perfil else None,
                "puntuacion": p["puntuacion"],
                "tiempo_total": p.get("tiempo_total"),
                "respuestas_correctas": p.get("respuestas_correctas"),
                "total_preguntas": p.get("total_preguntas"),
                "completado": bool(p.get("completado")),
            })
    return result


@router.get("/sessions/{code}/report")
def session_report(code: str, user=Depends(get_current_user)):
    if user["rol"] != "docente":
        raise HTTPException(403, "Solo los docentes pueden ver el informe")

    with get_db() as conn:
        sesion = fetchone(conn,
            "SELECT * FROM sesiones_competencia WHERE codigo = %s AND id_docente = %s",
            (code.upper(), user["id"]))
        if not sesion:
            raise HTTPException(404, "Sesion no encontrada o no eres el creador")

        reto = fetchone(conn, "SELECT * FROM retos WHERE id = %s", (sesion["id_reto"],))
        participantes = fetchall(conn,
            "SELECT * FROM participantes_sesion WHERE id_sesion = %s ORDER BY puntuacion DESC",
            (sesion["id"],))
        participantes_con_perfil = []
        for p in participantes:
            perfil = fetchone(conn,
                "SELECT nombre, usuario, grado_bachillerato FROM perfiles WHERE id = %s",
                (p["id_usuario"],))
            row = serialize_row(p)
            row["perfil"] = serialize_row(perfil)
            participantes_con_perfil.append(row)

    total = len(participantes)
    completaron = sum(1 for p in participantes if p.get("completado"))
    prom_puntuacion = round(sum(p["puntuacion"] for p in participantes) / total) if total else 0
    prom_precision = round(
        sum((p["respuestas_correctas"] / p["total_preguntas"] * 100) if p.get("total_preguntas") else 0
            for p in participantes) / total
    ) if total else 0

    return {
        "sesion": {**serialize_row(sesion), "reto": serialize_row(reto)},
        "estadisticas": {
            "totalParticipantes": total,
            "completaron": completaron,
            "promPuntuacion": prom_puntuacion,
            "promPrecision": prom_precision,
        },
        "participantes": participantes_con_perfil,
    }


@router.patch("/sessions/{code}/toggle")
def toggle_session(code: str, user=Depends(get_current_user)):
    if user["rol"] != "docente":
        raise HTTPException(403, "forbidden")

    with get_db() as conn:
        sesion = fetchone(conn,
            "SELECT * FROM sesiones_competencia WHERE codigo = %s AND id_docente = %s",
            (code.upper(), user["id"]))
        if not sesion:
            raise HTTPException(404, "not_found")

        nuevo = not bool(sesion["activa"])
        execute(conn, "UPDATE sesiones_competencia SET activa = %s WHERE id = %s",
                (1 if nuevo else 0, sesion["id"]))
        updated = fetchone(conn, "SELECT * FROM sesiones_competencia WHERE id = %s", (sesion["id"],))
    return serialize_row(updated)
