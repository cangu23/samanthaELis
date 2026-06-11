#!/bin/bash
set -e

DATADIR="/home/runner/mysql-data"
SOCKET="/tmp/mysql.sock"
PIDFILE="/tmp/mysql.pid"

# Initialize data directory if needed
if [ ! -d "$DATADIR/mysql" ]; then
  echo "[startup] Initializing MySQL data directory..."
  mysqld --initialize-insecure --user=runner --datadir="$DATADIR" 2>&1
fi

# Start MySQL daemon if not already running
if ! mysqladmin --socket="$SOCKET" ping --silent 2>/dev/null; then
  echo "[startup] Starting MySQL daemon..."
  mysqld --socket="$SOCKET" --pid-file="$PIDFILE" --user=runner \
    --datadir="$DATADIR" --port=3306 --daemonize \
    --skip-mysqlx 2>&1 || true
fi

# Wait for MySQL to be ready
echo "[startup] Waiting for MySQL..."
for i in $(seq 1 30); do
  if mysqladmin --socket="$SOCKET" ping --silent 2>/dev/null; then
    echo "[startup] MySQL is ready"
    break
  fi
  sleep 1
done

MYSQL_ROOT="mysql --socket=$SOCKET -u root"

# Usar la variable de entorno DB_PASSWORD o un valor por defecto seguro
DB_PASS="${DB_PASSWORD:-proyectodegrado3}"

# Set root password if not set (first run without password)
if $MYSQL_ROOT --connect-expired-password -e "SELECT 1;" >/dev/null 2>&1; then
  echo "[startup] Setting root password..."
  $MYSQL_ROOT --connect-expired-password -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_PASS'; FLUSH PRIVILEGES;" 2>/dev/null || true
fi

MYSQL_AUTH="mysql --socket=$SOCKET -u root -p$DB_PASS"

# Create database if not exists
$MYSQL_AUTH -e "CREATE DATABASE IF NOT EXISTS cerebrito CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run schema migration if tables are missing
TABLES=$($MYSQL_AUTH cerebrito -e "SHOW TABLES;" 2>/dev/null | wc -l)
if [ "$TABLES" -lt "5" ]; then
  echo "[startup] Running schema migration..."
  $MYSQL_AUTH cerebrito < "$SCRIPT_DIR/migrate_to_mysql.sql" 2>&1
  echo "[startup] Schema migration complete"
fi

# Migrate data from PostgreSQL if DB is empty
PROFILES=$($MYSQL_AUTH cerebrito -e "SELECT COUNT(*) as c FROM perfiles;" 2>/dev/null | tail -1 | tr -d '[:space:]')
if [ "$PROFILES" = "0" ] || [ -z "$PROFILES" ]; then
  echo "[startup] Migrating data from PostgreSQL..."
  cd "$SCRIPT_DIR" && python3 migrate_data.py 2>&1 || echo "[startup] Data migration failed (PostgreSQL may be unavailable)"
fi

# Export DB vars for FastAPI
export DB_HOST="127.0.0.1"
export DB_PORT="3306"
export DB_USER="root"
export DB_PASSWORD="$DB_PASS"
export DB_NAME="cerebrito"
export MYSQL_SOCKET="$SOCKET"

# Start FastAPI
cd "$SCRIPT_DIR"
echo "[startup] Starting FastAPI server on port ${PORT:-8080}..."
exec python3 -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8080}"
