from fastapi import APIRouter, Depends
from db import get_db, fetchone, fetchall
from auth_utils import get_current_user
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


def build_ranking(conn, module_id=None):
    rows = fetchall(conn,
        """SELECT id_usuario,
               SUM(puntuacion) as puntos_totales,
               COUNT(*) as retos_completados,
               AVG(`precision`) as precision_promedio,
               AVG(tiempo_total) as tiempo_promedio,
               SUM(respuestas_correctas) as respuestas_correctas,
               SUM(respuestas_incorrectas) as respuestas_incorrectas
           FROM resultados
           GROUP BY id_usuario
           ORDER BY puntos_totales DESC""")

    ranking = []
    for entry in rows:
        perfil = fetchone(conn,
            "SELECT id, nombre, usuario, rol, grado_bachillerato, avatar_url, puntos_totales, retos_completados, racha_dias, ultimo_acceso, creado_en FROM perfiles WHERE id = %s",
            (entry["id_usuario"],))
        if not perfil or perfil["rol"] != "estudiante":
            continue
        if module_id and perfil.get("grado_bachillerato") != module_id:
            continue
        ranking.append({
            "usuario_id": perfil["id"],
            "nombre": perfil["nombre"] or perfil["usuario"],
            "usuario": perfil["usuario"],
            "grado_bachillerato": perfil.get("grado_bachillerato"),
            "rol": perfil["rol"],
            "avatar_url": perfil.get("avatar_url"),
            "racha_dias": perfil.get("racha_dias"),
            "puntos_totales": float(entry["puntos_totales"] or 0),
            "retos_completados": int(entry["retos_completados"] or 0),
            "precision_promedio": float(entry["precision_promedio"] or 0),
            "tiempo_promedio": float(entry["tiempo_promedio"] or 0),
            "respuestas_correctas": int(entry["respuestas_correctas"] or 0),
            "respuestas_incorrectas": int(entry["respuestas_incorrectas"] or 0),
        })

    return [{"posicion": i + 1, **e} for i, e in enumerate(ranking)]


@router.get("/ranking")
def get_ranking(user=Depends(get_current_user)):
    with get_db() as conn:
        return build_ranking(conn)


@router.get("/ranking/module/{module_id}")
def get_ranking_module(module_id: int, user=Depends(get_current_user)):
    with get_db() as conn:
        return build_ranking(conn, module_id=module_id)
