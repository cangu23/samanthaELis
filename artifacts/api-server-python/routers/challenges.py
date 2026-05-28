import json
import random
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
from db import get_db, fetchone, fetchall, execute
from auth_utils import get_current_user, require_docente
from datetime import datetime

router = APIRouter()


def serialize_row(row):
    if row is None:
        return None
    r = dict(row)
    for k, v in r.items():
        if isinstance(v, datetime):
            r[k] = v.isoformat()
    return r


def parse_opciones(row: dict) -> dict:
    row = dict(row)
    if row.get("opciones") and isinstance(row["opciones"], str):
        try:
            row["opciones"] = json.loads(row["opciones"])
        except Exception:
            pass
    return row


@router.get("/challenges")
def get_challenges(id_modulo: int = None, user=Depends(get_current_user)):
    with get_db() as conn:
        if id_modulo:
            retos_predef = fetchall(conn, "SELECT * FROM retos WHERE activo = 1 AND id_modulo = %s", (id_modulo,))
        else:
            retos_predef = fetchall(conn, "SELECT * FROM retos WHERE activo = 1")

        predefinidos = []
        for r in retos_predef:
            r = dict(r)
            modulo = fetchone(conn, "SELECT * FROM modulos WHERE id = %s", (r["id_modulo"],))
            nivel = fetchone(conn, "SELECT * FROM niveles WHERE id = %s", (r["id_nivel"],))
            r["modulo"] = serialize_row(modulo)
            r["nivel"] = serialize_row(nivel)
            r["is_custom"] = False
            predefinidos.append(serialize_row(r))

        if id_modulo:
            custom_retos = fetchall(conn, "SELECT * FROM retos_personalizados WHERE activo = 1 AND publicado = 1 AND id_modulo = %s", (id_modulo,))
        else:
            custom_retos = fetchall(conn, "SELECT * FROM retos_personalizados WHERE activo = 1 AND publicado = 1")

        custom = []
        for r in custom_retos:
            r = dict(r)
            docente = fetchone(conn, "SELECT nombre FROM perfiles WHERE id = %s", (r["id_docente"],))
            modulo = fetchone(conn, "SELECT * FROM modulos WHERE id = %s", (r["id_modulo"],))
            nivel = fetchone(conn, "SELECT * FROM niveles WHERE id = %s", (r["id_nivel"],))
            r["id"] = -r["id"]
            r["modulo"] = serialize_row(modulo)
            r["nivel"] = serialize_row(nivel)
            r["is_custom"] = True
            r["docente_nombre"] = docente["nombre"] if docente else None
            custom.append(serialize_row(r))

    return predefinidos + custom


@router.get("/challenges/custom")
def get_custom_challenges(user=Depends(get_current_user)):
    with get_db() as conn:
        retos = fetchall(conn, "SELECT * FROM retos_personalizados WHERE activo = 1")
        result = []
        for r in retos:
            r = dict(r)
            docente = fetchone(conn, "SELECT id, nombre, usuario, rol FROM perfiles WHERE id = %s", (r["id_docente"],))
            modulo = fetchone(conn, "SELECT * FROM modulos WHERE id = %s", (r["id_modulo"],))
            nivel = fetchone(conn, "SELECT * FROM niveles WHERE id = %s", (r["id_nivel"],))
            r["docente"] = serialize_row(docente)
            r["modulo"] = serialize_row(modulo)
            r["nivel"] = serialize_row(nivel)
            result.append(serialize_row(r))
    return result


@router.get("/challenges/{challenge_id}")
def get_challenge(challenge_id: int, user=Depends(get_current_user)):
    with get_db() as conn:
        reto = fetchone(conn, "SELECT * FROM retos WHERE id = %s", (challenge_id,))
        if not reto:
            raise HTTPException(404, "Reto no encontrado")
        reto = dict(reto)
        preguntas = fetchall(conn,
            "SELECT * FROM preguntas WHERE id_modulo = %s AND id_nivel = %s AND activa = 1 LIMIT %s",
            (reto["id_modulo"], reto["id_nivel"], reto["numero_preguntas"]))
        preguntas = [parse_opciones(serialize_row(p)) for p in preguntas]
        modulo = fetchone(conn, "SELECT * FROM modulos WHERE id = %s", (reto["id_modulo"],))
        nivel = fetchone(conn, "SELECT * FROM niveles WHERE id = %s", (reto["id_nivel"],))
        reto["preguntas"] = preguntas
        reto["modulo"] = serialize_row(modulo)
        reto["nivel"] = serialize_row(nivel)
    return serialize_row(reto)


@router.get("/challenges/{challenge_id}/questions")
def get_challenge_questions(challenge_id: int, user=Depends(get_current_user)):
    with get_db() as conn:
        reto = fetchone(conn, "SELECT * FROM retos WHERE id = %s", (challenge_id,))
        if not reto:
            raise HTTPException(404, "Reto no encontrado")
        preguntas = fetchall(conn,
            "SELECT * FROM preguntas WHERE id_modulo = %s AND id_nivel = %s AND activa = 1 ORDER BY RAND() LIMIT %s",
            (reto["id_modulo"], reto["id_nivel"], reto["numero_preguntas"]))
    return [parse_opciones(serialize_row(p)) for p in preguntas]


class CheckAnswerBody(BaseModel):
    pregunta_id: int
    respuesta: Any


@router.post("/challenges/{challenge_id}/check-answer")
def check_answer(challenge_id: int, body: CheckAnswerBody, user=Depends(get_current_user)):
    with get_db() as conn:
        pregunta = fetchone(conn, "SELECT * FROM preguntas WHERE id = %s", (body.pregunta_id,))
    if not pregunta:
        raise HTTPException(404, "Pregunta no encontrada")
    correcta = pregunta["respuesta_correcta"].strip().lower() == str(body.respuesta).strip().lower()
    return {
        "correcta": correcta,
        "respuesta_correcta": pregunta["respuesta_correcta"],
        "explicacion": pregunta.get("explicacion"),
        "puntos": pregunta.get("puntos", 10) if correcta else 0,
    }


class PreguntaBody(BaseModel):
    texto: str
    tipo: str
    opciones: Optional[List[str]] = None
    respuesta_correcta: str
    explicacion: Optional[str] = None
    dificultad: str
    puntos: Optional[int] = 10


class CreateCustomBody(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    tipo_juego: str
    id_modulo: int
    id_nivel: int
    puntos_maximos: Optional[int] = 100
    numero_preguntas: Optional[int] = 10
    tiempo_limite: Optional[int] = 300
    preguntas: Optional[List[PreguntaBody]] = None


@router.post("/challenges/custom", status_code=201)
def create_custom_challenge(body: CreateCustomBody, user=Depends(get_current_user)):
    require_docente(user)
    if not body.nombre or not body.tipo_juego or not body.id_modulo or not body.id_nivel:
        raise HTTPException(400, "Campos requeridos faltantes")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO retos_personalizados
                   (id_docente, nombre, descripcion, tipo_juego, id_modulo, id_nivel,
                    puntos_maximos, numero_preguntas, tiempo_limite, activo, publicado)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1, 0)""",
                (user["id"], body.nombre, body.descripcion, body.tipo_juego, body.id_modulo,
                 body.id_nivel, body.puntos_maximos, body.numero_preguntas, body.tiempo_limite),
            )
            conn.commit()
            nuevo_id = cur.lastrowid

        if body.preguntas:
            for p in body.preguntas:
                with conn.cursor() as cur:
                    cur.execute(
                        """INSERT INTO retos_personalizados_preguntas
                           (id_reto, id_pregunta, texto, tipo, opciones, respuesta_correcta, explicacion, dificultad, puntos)
                           VALUES (%s, 0, %s, %s, %s, %s, %s, %s, %s)""",
                        (nuevo_id, p.texto, p.tipo,
                         json.dumps(p.opciones) if p.opciones else None,
                         p.respuesta_correcta, p.explicacion, p.dificultad, p.puntos or 10),
                    )
            conn.commit()

        nuevo = fetchone(conn, "SELECT * FROM retos_personalizados WHERE id = %s", (nuevo_id,))
        docente = fetchone(conn, "SELECT id, nombre, usuario, rol FROM perfiles WHERE id = %s", (user["id"],))
        modulo = fetchone(conn, "SELECT * FROM modulos WHERE id = %s", (body.id_modulo,))
        nivel = fetchone(conn, "SELECT * FROM niveles WHERE id = %s", (body.id_nivel,))

    r = serialize_row(nuevo)
    r["docente"] = serialize_row(docente)
    r["modulo"] = serialize_row(modulo)
    r["nivel"] = serialize_row(nivel)
    return r


@router.get("/challenges/custom/{challenge_id}")
def get_custom_challenge(challenge_id: int, user=Depends(get_current_user)):
    with get_db() as conn:
        reto = fetchone(conn, "SELECT * FROM retos_personalizados WHERE id = %s", (challenge_id,))
        if not reto:
            raise HTTPException(404, "Reto personalizado no encontrado")
        reto = dict(reto)
        preguntas = fetchall(conn, "SELECT * FROM retos_personalizados_preguntas WHERE id_reto = %s", (challenge_id,))
        preguntas = [parse_opciones(serialize_row(p)) for p in preguntas]
        docente = fetchone(conn, "SELECT id, nombre, usuario, rol FROM perfiles WHERE id = %s", (reto["id_docente"],))
        modulo = fetchone(conn, "SELECT * FROM modulos WHERE id = %s", (reto["id_modulo"],))
        nivel = fetchone(conn, "SELECT * FROM niveles WHERE id = %s", (reto["id_nivel"],))
        reto["preguntas"] = preguntas
        reto["docente"] = serialize_row(docente)
        reto["modulo"] = serialize_row(modulo)
        reto["nivel"] = serialize_row(nivel)
    return serialize_row(reto)


class UpdateCustomBody(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo_juego: Optional[str] = None
    id_modulo: Optional[int] = None
    id_nivel: Optional[int] = None
    puntos_maximos: Optional[int] = None
    numero_preguntas: Optional[int] = None
    tiempo_limite: Optional[int] = None


@router.put("/challenges/custom/{challenge_id}")
def update_custom_challenge(challenge_id: int, body: UpdateCustomBody, user=Depends(get_current_user)):
    require_docente(user)
    with get_db() as conn:
        reto = fetchone(conn, "SELECT * FROM retos_personalizados WHERE id = %s", (challenge_id,))
        if not reto or reto["id_docente"] != user["id"]:
            raise HTTPException(404, "Reto no encontrado o sin permiso")

        updates = {k: v for k, v in body.dict().items() if v is not None}
        if updates:
            set_clause = ", ".join(f"{k} = %s" for k in updates)
            execute(conn, f"UPDATE retos_personalizados SET {set_clause} WHERE id = %s",
                    (*updates.values(), challenge_id))

        actualizado = fetchone(conn, "SELECT * FROM retos_personalizados WHERE id = %s", (challenge_id,))
        modulo = fetchone(conn, "SELECT * FROM modulos WHERE id = %s", (actualizado["id_modulo"],))
        nivel = fetchone(conn, "SELECT * FROM niveles WHERE id = %s", (actualizado["id_nivel"],))

    r = serialize_row(actualizado)
    r["modulo"] = serialize_row(modulo)
    r["nivel"] = serialize_row(nivel)
    return r


@router.patch("/challenges/custom/{challenge_id}/publish")
def toggle_publish(challenge_id: int, user=Depends(get_current_user)):
    require_docente(user)
    with get_db() as conn:
        reto = fetchone(conn, "SELECT * FROM retos_personalizados WHERE id = %s", (challenge_id,))
        if not reto or reto["id_docente"] != user["id"]:
            raise HTTPException(404, "Reto no encontrado o sin permiso")

        nuevo_estado = not bool(reto["publicado"])
        execute(conn, "UPDATE retos_personalizados SET publicado = %s WHERE id = %s",
                (1 if nuevo_estado else 0, challenge_id))

    return {
        "publicado": nuevo_estado,
        "message": "Reto publicado" if nuevo_estado else "Reto despublicado",
    }


@router.delete("/challenges/custom/{challenge_id}")
def delete_custom_challenge(challenge_id: int, user=Depends(get_current_user)):
    require_docente(user)
    with get_db() as conn:
        reto = fetchone(conn, "SELECT * FROM retos_personalizados WHERE id = %s", (challenge_id,))
        if not reto or reto["id_docente"] != user["id"]:
            raise HTTPException(404, "Reto no encontrado o sin permiso")
        execute(conn, "DELETE FROM retos_personalizados_preguntas WHERE id_reto = %s", (challenge_id,))
        execute(conn, "DELETE FROM retos_personalizados WHERE id = %s", (challenge_id,))
    return {"success": True, "message": "Reto eliminado exitosamente"}
