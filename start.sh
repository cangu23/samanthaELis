#!/bin/bash
# Script de inicio para Railway
set -e

# Instalación de dependencias si no existen (útil en entornos efímeros)
pnpm install --no-frozen-lockfile

echo "🧠 Iniciando Backend (API Server)..."
# Aseguramos que se construya el servidor y las librerías compartidas (@workspace/db, etc)
pnpm --filter @workspace/api-server run build
PORT=${PORT:-8080} pnpm --filter @workspace/api-server run start