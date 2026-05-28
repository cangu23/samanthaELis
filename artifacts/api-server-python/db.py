import os
import pymysql
import pymysql.cursors
from contextlib import contextmanager

def get_connection():
    db_url = os.environ.get("DATABASE_URL", "")
    host = os.environ.get("DB_HOST", "localhost")
    port = int(os.environ.get("DB_PORT", "3306"))
    user = os.environ.get("DB_USER", "root")
    password = os.environ.get("DB_PASSWORD", "")
    database = os.environ.get("DB_NAME", "cerebrito")

    if db_url and db_url.startswith("mysql"):
        import re
        m = re.match(r"mysql(?:\+pymysql)?://([^:]+):([^@]*)@([^:/]+)(?::(\d+))?/(.+)", db_url)
        if m:
            user = m.group(1)
            password = m.group(2)
            host = m.group(3)
            port = int(m.group(4)) if m.group(4) else 3306
            database = m.group(5).split("?")[0]

    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )
    return conn


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
