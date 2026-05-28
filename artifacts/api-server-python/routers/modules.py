from fastapi import APIRouter, Depends, HTTPException
from db import get_db, fetchone, fetchall
from auth_utils import get_current_user

router = APIRouter()


def serialize_row(row):
    if row is None:
        return None
    from datetime import datetime
    r = dict(row)
    for k, v in r.items():
        if isinstance(v, datetime):
            r[k] = v.isoformat()
    return r


@router.get("/modules")
def get_modules(anio: int = None, user=Depends(get_current_user)):
    with get_db() as conn:
        if anio:
            rows = fetchall(conn, "SELECT * FROM modulos WHERE activo = 1 AND anio_bachillerato = %s ORDER BY anio_bachillerato", (anio,))
        else:
            rows = fetchall(conn, "SELECT * FROM modulos WHERE activo = 1 ORDER BY anio_bachillerato")
    return [serialize_row(r) for r in rows]


@router.get("/modules/{module_id}")
def get_module(module_id: int, user=Depends(get_current_user)):
    with get_db() as conn:
        modulo = fetchone(conn, "SELECT * FROM modulos WHERE id = %s", (module_id,))
    if not modulo:
        raise HTTPException(404, "Modulo no encontrado")
    return serialize_row(modulo)


@router.get("/modules/{module_id}/levels")
def get_module_levels(module_id: int, user=Depends(get_current_user)):
    with get_db() as conn:
        rows = fetchall(conn, "SELECT * FROM niveles WHERE id_modulo = %s AND activo = 1 ORDER BY orden", (module_id,))
    return [serialize_row(r) for r in rows]


@router.get("/modules/{module_id}/challenges")
def get_module_challenges(module_id: int, user=Depends(get_current_user)):
    with get_db() as conn:
        retos = fetchall(conn, "SELECT * FROM retos WHERE id_modulo = %s AND activo = 1", (module_id,))
        result = []
        for reto in retos:
            reto = dict(reto)
            nivel = fetchone(conn, "SELECT * FROM niveles WHERE id = %s", (reto["id_nivel"],))
            reto["nivel"] = serialize_row(nivel)
            result.append(serialize_row(reto))
    return result
