#!/bin/bash
# Script de inicio para Railway
set -e

if [ "$SERVICE_TYPE" = "FRONTEND" ]; then
  echo "🚀 Iniciando Frontend (InfoQuest)..."
  # Ejecuta el preview de Vite en el puerto que asigne Railway
  pnpm --filter ./artifacts/infoquest run preview -- --host 0.0.0.0 --port ${PORT:-8080}
else
  echo "🧠 Iniciando Backend (API Server)..."
  PORT=${PORT:-8080} pnpm --filter ./artifacts/api-server run start
fi