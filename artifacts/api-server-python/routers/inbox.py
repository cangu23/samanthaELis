from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from db import get_db, fetchone, fetchall, execute
from auth_utils import get_current_user
from datetime import datetime

router = APIRouter()


def dt(v):
    if isinstance(v, datetime):
        return v.isoformat()
    return v


@router.get("/inbox/alerts")
def get_alerts(user=Depends(get_current_user)):
    with get_db() as conn:
        alertas = fetchall(conn,
            "SELECT * FROM alertas WHERE id_usuario = %s ORDER BY fecha DESC",
            (user["id"],))
    result = []
    for a in alertas:
        tipo = a["tipo"]
        titulo = (
            "Logro Desbloqueado!" if tipo == "logro" else
            "Alerta de Rendimiento" if tipo == "bajo_rendimiento" else
            "Nivel Completado" if tipo == "nivel_completado" else
            "Mensaje del Sistema"
        )
        result.append({
            "id": a["id"],
            "titulo": titulo,
            "mensaje": a["descripcion"],
            "tipo": tipo,
            "leido": bool(a["leida"]),
            "fecha_creacion": dt(a.get("fecha")),
        })
    return result


@router.put("/inbox/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, user=Depends(get_current_user)):
    with get_db() as conn:
        alerta = fetchone(conn,
            "SELECT * FROM alertas WHERE id = %s AND id_usuario = %s",
            (alert_id, user["id"]))
        if not alerta:
            raise HTTPException(404, "Alerta no encontrada")
        execute(conn, "UPDATE alertas SET leida = 1 WHERE id = %s", (alert_id,))
    return {"success": True, "message": "Alerta marcada como leida"}


@router.post("/inbox/alerts/{alert_id}/read")
def mark_alert_read_post(alert_id: int, user=Depends(get_current_user)):
    with get_db() as conn:
        alerta = fetchone(conn,
            "SELECT * FROM alertas WHERE id = %s AND id_usuario = %s",
            (alert_id, user["id"]))
        if not alerta:
            raise HTTPException(404, "Alerta no encontrada")
        execute(conn, "UPDATE alertas SET leida = 1 WHERE id = %s", (alert_id,))
    return {"success": True}


@router.get("/inbox/recommendations")
def get_recommendations(user=Depends(get_current_user)):
    with get_db() as conn:
        recs = fetchall(conn,
            "SELECT * FROM recomendaciones WHERE id_usuario = %s ORDER BY fecha DESC",
            (user["id"],))
    return [
        {
            "id": r["id"],
            "titulo": r.get("motivo") or "Recomendacion personalizada",
            "descripcion": r["descripcion"],
            "tipo": r.get("tipo"),
            "leido": bool(r.get("leida")),
            "fecha_creacion": dt(r.get("fecha")),
        }
        for r in recs
    ]


@router.delete("/inbox/recommendations/{rec_id}")
def delete_recommendation(rec_id: int, user=Depends(get_current_user)):
    with get_db() as conn:
        rec = fetchone(conn,
            "SELECT * FROM recomendaciones WHERE id = %s AND id_usuario = %s",
            (rec_id, user["id"]))
        if not rec:
            raise HTTPException(404, "Recomendacion no encontrada")
        execute(conn, "DELETE FROM recomendaciones WHERE id = %s", (rec_id,))
    return {"success": True, "message": "Recomendacion eliminada"}


class FeedbackBody(BaseModel):
    mensaje: str


@router.post("/inbox/feedback", status_code=201)
def send_feedback(body: FeedbackBody, user=Depends(get_current_user)):
    if not body.mensaje or not body.mensaje.strip():
        raise HTTPException(400, "El mensaje es requerido")
    with get_db() as conn:
        docente = fetchone(conn, "SELECT id FROM perfiles WHERE rol = 'docente' LIMIT 1")
        if not docente:
            raise HTTPException(404, "No hay docentes disponibles")
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO feedback_docente (id_estudiante, id_docente, contenido, tipo, leido) VALUES (%s, %s, %s, 'general', 0)",
                (user["id"], docente["id"], body.mensaje.strip()),
            )
            conn.commit()
            nuevo_id = cur.lastrowid
        nuevo = fetchone(conn, "SELECT * FROM feedback_docente WHERE id = %s", (nuevo_id,))
    r = dict(nuevo)
    for k, v in r.items():
        if isinstance(v, datetime):
            r[k] = v.isoformat()
    return r


@router.get("/inbox/feedback")
def get_feedback(user=Depends(get_current_user)):
    with get_db() as conn:
        feedback = fetchall(conn,
            "SELECT * FROM feedback_docente WHERE id_estudiante = %s ORDER BY creado_en DESC",
            (user["id"],))
        result = []
        for f in feedback:
            docente = fetchone(conn, "SELECT nombre FROM perfiles WHERE id = %s", (f["id_docente"],))
            result.append({
                "id": f["id"],
                "mensaje": f["contenido"],
                "respuesta": None,
                "leido": bool(f.get("leido")),
                "fecha_creacion": dt(f.get("creado_en")),
                "docente_nombre": docente["nombre"] if docente else "Docente",
            })
    return result


@router.get("/inbox/unread-count")
def unread_count(user=Depends(get_current_user)):
    with get_db() as conn:
        alertas = fetchone(conn,
            "SELECT COUNT(*) as cnt FROM alertas WHERE id_usuario = %s AND leida = 0",
            (user["id"],))
        feedback = fetchone(conn,
            "SELECT COUNT(*) as cnt FROM feedback_docente WHERE id_estudiante = %s AND leido = 0",
            (user["id"],))
        recs = fetchone(conn,
            "SELECT COUNT(*) as cnt FROM recomendaciones WHERE id_usuario = %s AND leida = 0",
            (user["id"],))
    a = int(alertas["cnt"] or 0) if alertas else 0
    f = int(feedback["cnt"] or 0) if feedback else 0
    r = int(recs["cnt"] or 0) if recs else 0
    return {"alerts": a, "feedback": f, "recommendations": r, "total": a + f + r}
