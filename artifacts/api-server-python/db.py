import os
import pymysql
import pymysql.cursors
from contextlib import contextmanager


def get_connection():
    host = os.environ.get("DB_HOST", "127.0.0.1")
    port = int(os.environ.get("DB_PORT", "3306"))
    user = os.environ.get("DB_USER", "root")
    password = os.environ.get("DB_PASSWORD", "proyectodegrado3")
    database = os.environ.get("DB_NAME", "cerebrito")
    socket = os.environ.get("MYSQL_SOCKET", "")

    kwargs = dict(
        user=user,
        password=password,
        database=database,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )
    if socket and os.path.exists(socket):
        kwargs["unix_socket"] = socket
    else:
        kwargs["host"] = host
        kwargs["port"] = port

    return pymysql.connect(**kwargs)


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def fetchone(conn, sql, params=None):
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.fetchone()


def fetchall(conn, sql, params=None):
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.fetchall()


def execute(conn, sql, params=None):
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.lastrowid
