"""
Migra datos de PostgreSQL a MySQL.
Ejecutar: python3 migrate_data.py
"""
import json
import psycopg2
import psycopg2.extras
import pymysql
import pymysql.cursors

PG_URL = "postgresql://postgres:password@helium/heliumdb?sslmode=disable"
MYSQL_SOCKET = "/tmp/mysql.sock"
MYSQL_DB = "cerebrito"
MYSQL_USER = "root"
MYSQL_PASS = "proyectodegrado3"


def pg_connect():
    return psycopg2.connect(PG_URL, cursor_factory=psycopg2.extras.RealDictCursor)


def my_connect():
    return pymysql.connect(
        unix_socket=MYSQL_SOCKET,
        user=MYSQL_USER,
        password=MYSQL_PASS,
        database=MYSQL_DB,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def b(v):
    if v is None:
        return None
    return 1 if v else 0


TIPO_PREGUNTA_MAP = {
    "multiple_choice": "multiple",
    "true_false": "verdadero_falso",
    "code_completion": "completar",
    "multiple": "multiple",
    "verdadero_falso": "verdadero_falso",
    "completar": "completar",
    "codigo": "codigo",
    "ordenar": "ordenar",
}

def js(v):
    if v is None:
        return None
    if isinstance(v, str):
        return v
    return json.dumps(v)


def migrate():
    pg = pg_connect()
    my = my_connect()
    pgc = pg.cursor()
    myc = my.cursor()

    print("Limpiando tablas MySQL...")
    tables_to_clear = [
        "participantes_sesion", "sesiones_competencia",
        "intentos_guardados", "feedback_docente",
        "recomendaciones", "alertas", "resultados",
        "retos_personalizados_preguntas", "retos_personalizados",
        "preguntas", "retos", "niveles", "modulos", "perfiles",
    ]
    myc.execute("SET FOREIGN_KEY_CHECKS = 0")
    for t in tables_to_clear:
        myc.execute(f"TRUNCATE TABLE {t}")
    myc.execute("SET FOREIGN_KEY_CHECKS = 1")
    my.commit()

    # ---- perfiles ----
    print("Migrando perfiles...")
    pgc.execute("""
        SELECT id, nombre, usuario, password_hash, rol, grado_bachillerato, email,
               avatar_url, puntos_totales, racha_dias, retos_completados,
               ultimo_acceso, creado_en, reset_token, reset_token_expires_at,
               ultimo_nivel_intento, mejor_puntaje_por_modulo
        FROM perfiles ORDER BY id
    """)
    for row in pgc.fetchall():
        myc.execute("""
            INSERT INTO perfiles
            (id, nombre, usuario, password_hash, rol, grado_bachillerato, email,
             avatar_url, puntos_totales, racha_dias, retos_completados,
             ultimo_acceso, creado_en, reset_token, reset_token_expires_at,
             ultimo_nivel_intento, mejor_puntaje_por_modulo)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            row["id"], row["nombre"], row["usuario"], row["password_hash"],
            row["rol"], row.get("grado_bachillerato"), row.get("email"),
            row.get("avatar_url"), row.get("puntos_totales", 0),
            row.get("racha_dias", 0), row.get("retos_completados", 0),
            row.get("ultimo_acceso"), row.get("creado_en"),
            row.get("reset_token"), row.get("reset_token_expires_at"),
            row.get("ultimo_nivel_intento"),
            js(row.get("mejor_puntaje_por_modulo")),
        ))
    my.commit()
    print("  perfiles: OK")

    # ---- modulos ----
    print("Migrando modulos...")
    pgc.execute("""
        SELECT id, nombre, anio_bachillerato, descripcion, color, icono, activo, creado_en
        FROM modulos ORDER BY id
    """)
    for row in pgc.fetchall():
        myc.execute("""
            INSERT INTO modulos (id, nombre, anio_bachillerato, descripcion, color, icono, activo, creado_en)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            row["id"], row["nombre"], row["anio_bachillerato"],
            row.get("descripcion"), row.get("color"), row.get("icono"),
            b(row.get("activo", True)), row.get("creado_en"),
        ))
    my.commit()
    print("  modulos: OK")

    # ---- niveles (no tiene creado_en en PG) ----
    print("Migrando niveles...")
    pgc.execute("""
        SELECT id, id_modulo, nombre, orden, descripcion, puntos_por_reto, activo
        FROM niveles ORDER BY id
    """)
    for row in pgc.fetchall():
        myc.execute("""
            INSERT INTO niveles (id, id_modulo, nombre, orden, puntos_por_reto, activo)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            row["id"], row["id_modulo"], row["nombre"], row.get("orden", 1),
            row.get("puntos_por_reto", 100), b(row.get("activo", True)),
        ))
    my.commit()
    print("  niveles: OK")

    # ---- preguntas (no tiene creado_en en PG) ----
    print("Migrando preguntas...")
    pgc.execute("""
        SELECT id, id_modulo, id_nivel, tipo, texto, opciones, respuesta_correcta,
               explicacion, dificultad, puntos, activa
        FROM preguntas ORDER BY id
    """)
    for row in pgc.fetchall():
        myc.execute("""
            INSERT INTO preguntas
            (id, id_modulo, id_nivel, tipo, texto, opciones, respuesta_correcta,
             explicacion, dificultad, puntos, activa)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            row["id"], row["id_modulo"], row["id_nivel"],
            TIPO_PREGUNTA_MAP.get(row["tipo"], "multiple"),
            row["texto"], js(row.get("opciones")),
            row["respuesta_correcta"], row.get("explicacion"),
            row.get("dificultad", "medio") or "medio", row.get("puntos", 10),
            b(row.get("activa", True)),
        ))
    my.commit()
    print("  preguntas: OK")

    # ---- retos ----
    print("Migrando retos...")
    pgc.execute("""
        SELECT id, nombre, descripcion, tipo_juego, id_modulo, id_nivel,
               tiempo_limite, puntos_maximos, numero_preguntas, activo, creado_en
        FROM retos ORDER BY id
    """)
    for row in pgc.fetchall():
        myc.execute("""
            INSERT INTO retos
            (id, nombre, descripcion, tipo_juego, id_modulo, id_nivel,
             tiempo_limite, puntos_maximos, numero_preguntas, activo, creado_en)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            row["id"], row["nombre"], row.get("descripcion"),
            row.get("tipo_juego", "quiz"), row["id_modulo"], row["id_nivel"],
            row.get("tiempo_limite", 300), row.get("puntos_maximos", 100),
            row.get("numero_preguntas", 10),
            b(row.get("activo", True)), row.get("creado_en"),
        ))
    my.commit()
    print("  retos: OK")

    # ---- retos_personalizados ----
    print("Migrando retos_personalizados...")
    pgc.execute("""
        SELECT id, id_docente, nombre, descripcion, tipo_juego, id_modulo, id_nivel,
               puntos_maximos, numero_preguntas, tiempo_limite, activo, publicado, creado_en
        FROM retos_personalizados ORDER BY id
    """)
    for row in pgc.fetchall():
        myc.execute("""
            INSERT INTO retos_personalizados
            (id, id_docente, nombre, descripcion, tipo_juego, id_modulo, id_nivel,
             puntos_maximos, numero_preguntas, tiempo_limite, activo, publicado, creado_en)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            row["id"], row["id_docente"], row["nombre"], row.get("descripcion"),
            row.get("tipo_juego", "quiz"), row["id_modulo"], row["id_nivel"],
            row.get("puntos_maximos", 100), row.get("numero_preguntas", 10),
            row.get("tiempo_limite", 300),
            b(row.get("activo", True)), b(row.get("publicado", False)),
            row.get("creado_en"),
        ))
    my.commit()
    print("  retos_personalizados: OK")

    # ---- retos_personalizados_preguntas ----
    print("Migrando retos_personalizados_preguntas...")
    pgc.execute("SELECT * FROM retos_personalizados_preguntas ORDER BY id")
    for row in pgc.fetchall():
        myc.execute("""
            INSERT INTO retos_personalizados_preguntas
            (id, id_reto, id_pregunta, texto, tipo, opciones, respuesta_correcta,
             explicacion, dificultad, puntos)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            row["id"], row["id_reto"], row.get("id_pregunta"),
            row["texto"], row.get("tipo", "multiple"),
            js(row.get("opciones")), row["respuesta_correcta"],
            row.get("explicacion"), row.get("dificultad", "medio"),
            row.get("puntos", 10),
        ))
    my.commit()
    print("  retos_personalizados_preguntas: OK")

    # ---- resultados ----
    print("Migrando resultados...")
    pgc.execute("""
        SELECT id, id_usuario, id_reto, is_custom, puntuacion, puntos_maximos,
               precision, tiempo_total, tiempo_respuesta, respuestas_correctas,
               respuestas_incorrectas, detalles, completado, fecha
        FROM resultados ORDER BY id
    """)
    for row in pgc.fetchall():
        myc.execute("""
            INSERT INTO resultados
            (id, id_usuario, id_reto, is_custom, puntuacion, puntos_maximos, `precision`,
             tiempo_total, tiempo_respuesta, respuestas_correctas, respuestas_incorrectas,
             detalles, completado, fecha)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            row["id"], row["id_usuario"], row["id_reto"],
            b(row.get("is_custom", False)),
            row.get("puntuacion", 0), row.get("puntos_maximos"),
            row.get("precision", 0), row.get("tiempo_total", 0),
            row.get("tiempo_respuesta", 0),
            row.get("respuestas_correctas", 0),
            row.get("respuestas_incorrectas", 0),
            js(row.get("detalles")),
            b(row.get("completado", True)), row.get("fecha"),
        ))
    my.commit()
    print("  resultados: OK")

    # ---- alertas ----
    print("Migrando alertas...")
    pgc.execute("""
        SELECT id, id_usuario, descripcion, tipo, leida, fecha
        FROM alertas ORDER BY id
    """)
    for row in pgc.fetchall():
        myc.execute("""
            INSERT INTO alertas (id, id_usuario, descripcion, tipo, leida, fecha)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            row["id"], row["id_usuario"], row["descripcion"],
            row.get("tipo", "sistema"), b(row.get("leida", False)),
            row.get("fecha"),
        ))
    my.commit()
    print("  alertas: OK")

    # ---- recomendaciones ----
    print("Migrando recomendaciones...")
    pgc.execute("""
        SELECT id, id_usuario, descripcion, motivo, tipo, leida, fecha
        FROM recomendaciones ORDER BY id
    """)
    for row in pgc.fetchall():
        myc.execute("""
            INSERT INTO recomendaciones (id, id_usuario, descripcion, motivo, tipo, leida, fecha)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (
            row["id"], row["id_usuario"], row["descripcion"],
            row.get("motivo"), row.get("tipo", "general"),
            b(row.get("leida", False)), row.get("fecha"),
        ))
    my.commit()
    print("  recomendaciones: OK")

    # ---- feedback_docente ----
    print("Migrando feedback_docente...")
    pgc.execute("""
        SELECT id, id_docente, id_estudiante, contenido, tipo, leido, creado_en
        FROM feedback_docente ORDER BY id
    """)
    for row in pgc.fetchall():
        myc.execute("""
            INSERT INTO feedback_docente (id, id_docente, id_estudiante, contenido, tipo, leido, creado_en)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (
            row["id"], row["id_docente"], row["id_estudiante"],
            row["contenido"], row.get("tipo", "general"),
            b(row.get("leido", False)), row.get("creado_en"),
        ))
    my.commit()
    print("  feedback_docente: OK")

    # Reset AUTO_INCREMENT
    print("\nAjustando AUTO_INCREMENT...")
    for table in ["perfiles", "modulos", "niveles", "preguntas", "retos",
                  "retos_personalizados", "retos_personalizados_preguntas",
                  "resultados", "alertas", "recomendaciones", "feedback_docente"]:
        myc.execute(f"SELECT MAX(id) as mx FROM {table}")
        row = myc.fetchone()
        mx = row["mx"] if row and row["mx"] else 0
        myc.execute(f"ALTER TABLE {table} AUTO_INCREMENT = {mx + 1}")
    my.commit()

    pg.close()
    my.close()
    print("\n✓ Migracion completada exitosamente.")


if __name__ == "__main__":
    migrate()
