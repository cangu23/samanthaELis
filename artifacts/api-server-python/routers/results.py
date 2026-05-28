from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from db import get_db, fetchone, fetchall, execute
from auth_utils import get_current_user
from datetime import datetime
import json

router = APIRouter()


def serialize_row(row):
    if row is None:
        return None
    r = dict(row)
    for k, v in r.items():
        if isinstance(v, datetime):
            r[k] = v.isoformat()
    return r


class ResultBody(BaseModel):
    id_reto: int
    is_custom: Optional[bool] = False
    puntaje: Optional[float] = None
    puntuacion: Optional[float] = None
    puntos_maximos: Optional[int] = 100
    respuestas_correctas: Optional[int] = 0
    total_preguntas: Optional[int] = 1
    tiempo_empleado: Optional[int] = None
    tiempo_total: Optional[int] = None
    completado: Optional[bool] = True
    respuestas: Optional[Any] = None
    detalles: Optional[Any] = None


@router.post("/results", status_code=201)
def create_result(body: ResultBody, user=Depends(get_current_user)):
    puntuacion = body.puntaje if body.puntaje is not None else (body.puntuacion or 0)
    respuestas_correctas = body.respuestas_correctas or 0
    total_preguntas = body.total_preguntas or 1
    respuestas_incorrectas = total_preguntas - respuestas_correctas
    precision = respuestas_correctas / max(total_preguntas, 1)
    tiempo_total = body.tiempo_empleado or body.tiempo_total or 0
    detalles = json.dumps(body.respuestas) if body.respuestas else (json.dumps(body.detalles) if body.detalles else None)

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO resultados
                   (id_usuario, id_reto, is_custom, puntuacion, puntos_maximos, `precision`,
                    tiempo_total, detalles, completado, tiempo_respuesta, respuestas_correctas, respuestas_incorrectas)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0, %s, %s)""",
                (user["id"], body.id_reto, body.is_custom, puntuacion, body.puntos_maximos,
                 precision, tiempo_total, detalles, body.completado,
                 respuestas_correctas, respuestas_incorrectas),
            )
            conn.commit()
            nuevo_id = cur.lastrowid

        if body.completado:
            pts_row = fetchone(conn, "SELECT SUM(puntuacion) as total FROM resultados WHERE id_usuario = %s", (user["id"],))
            cnt_row = fetchone(conn, "SELECT COUNT(*) as cnt FROM resultados WHERE id_usuario = %s", (user["id"],))
            pts_totales = int(pts_row["total"] or 0) if pts_row else 0
            cnt_total = int(cnt_row["cnt"] or 0) if cnt_row else 0
            execute(conn, "UPDATE perfiles SET puntos_totales = %s, retos_completados = %s WHERE id = %s",
                    (pts_totales, cnt_total, user["id"]))

        if precision < 0.5 and body.completado:
            execute(conn,
                "INSERT INTO alertas (id_usuario, descripcion, tipo) VALUES (%s, %s, 'bajo_rendimiento')",
                (user["id"], f"Tu precision en el ultimo reto fue del {round(precision * 100)}%. Te recomendamos repasar los temas del modulo."))

        if precision >= 0.8 and body.completado:
            execute(conn,
                "INSERT INTO alertas (id_usuario, descripcion, tipo) VALUES (%s, %s, 'logro')",
                (user["id"], f"Excelente! Completaste el reto con {round(precision * 100)}% de precision. Sigue adelante!"))

        resultado = fetchone(conn, "SELECT * FROM resultados WHERE id = %s", (nuevo_id,))

    return serialize_row(resultado)


@router.get("/results/my")
def my_results(user=Depends(get_current_user)):
    with get_db() as conn:
        resultados = fetchall(conn,
            "SELECT * FROM resultados WHERE id_usuario = %s ORDER BY fecha DESC",
            (user["id"],))
        result = []
        for r in resultados:
            r = dict(r)
            reto = None
            if not r.get("is_custom"):
                reto = fetchone(conn, "SELECT * FROM retos WHERE id = %s", (r["id_reto"],))
            r["reto"] = serialize_row(reto)
            result.append(serialize_row(r))
    return result


@router.get("/results/my-history")
def my_history(user=Depends(get_current_user)):
    with get_db() as conn:
        resultados = fetchall(conn,
            "SELECT * FROM resultados WHERE id_usuario = %s ORDER BY fecha DESC",
            (user["id"],))
        result = []
        for r in resultados:
            r = dict(r)
            reto_nombre = "Reto desconocido"
            tipo_juego = "quiz"
            puntos_maximos = 100
            if not r.get("is_custom"):
                reto = fetchone(conn, "SELECT * FROM retos WHERE id = %s", (r["id_reto"],))
                if reto:
                    reto_nombre = reto["nombre"]
                    tipo_juego = reto["tipo_juego"]
                    puntos_maximos = reto["puntos_maximos"]
            total = (r.get("respuestas_correctas") or 0) + (r.get("respuestas_incorrectas") or 0)
            result.append({
                "id": r["id"],
                "nombre_reto": reto_nombre,
                "tipo_juego": tipo_juego,
                "puntaje": r.get("puntuacion", 0),
                "puntos_maximos": r.get("puntos_maximos") or puntos_maximos,
                "respuestas_correctas": r.get("respuestas_correctas") or 0,
                "total_preguntas": total,
                "completado": r.get("completado"),
                "fecha_completado": r["fecha"].isoformat() if isinstance(r.get("fecha"), datetime) else r.get("fecha"),
            })
    return result


@router.get("/results/stats")
def stats(user=Depends(get_current_user)):
    with get_db() as conn:
        s = fetchone(conn,
            "SELECT SUM(puntuacion) as puntos_totales, COUNT(*) as retos_completados, AVG(`precision`) as precision_promedio, AVG(tiempo_total) as tiempo_promedio FROM resultados WHERE id_usuario = %s",
            (user["id"],))
        perfil = fetchone(conn, "SELECT racha_dias FROM perfiles WHERE id = %s", (user["id"],))
        mejor = fetchone(conn, "SELECT puntuacion FROM resultados WHERE id_usuario = %s ORDER BY puntuacion DESC LIMIT 1", (user["id"],))
        todos = fetchall(conn,
            "SELECT id_usuario, SUM(puntuacion) as total FROM resultados GROUP BY id_usuario ORDER BY total DESC")

    posicion = next((i + 1 for i, r in enumerate(todos) if r["id_usuario"] == user["id"]), 0)
    return {
        "puntos_totales": float(s["puntos_totales"] or 0) if s else 0,
        "retos_completados": int(s["retos_completados"] or 0) if s else 0,
        "precision_promedio": float(s["precision_promedio"] or 0) if s else 0,
        "tiempo_promedio": float(s["tiempo_promedio"] or 0) if s else 0,
        "racha_dias": perfil["racha_dias"] if perfil else 0,
        "mejor_puntaje": mejor["puntuacion"] if mejor else 0,
        "posicion_ranking": posicion,
    }
