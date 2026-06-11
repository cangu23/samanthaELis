#!/bin/bash
# Script de inicio para Railway
set -e

# Instalación de dependencias si no existen (útil en entornos efímeros)
pnpm install --no-frozen-lockfile

if [ "$SERVICE_TYPE" = "FRONTEND" ]; then
  echo "🚀 Iniciando Frontend (InfoQuest)..."
  pnpm --filter ./artifacts/infoquest run build && pnpm --filter ./artifacts/infoquest run preview -- --host 0.0.0.0 --port ${PORT:-8080}
else
  echo "🧠 Iniciando Backend (API Server)..."
  # Aseguramos que se construya el servidor y las librerías compartidas
  pnpm --filter @workspace/api-server run build
  PORT=${PORT:-8080} pnpm --filter @workspace/api-server run start
fi