#!/bin/bash
# Script de inicio para Railway
set -e

echo "🧠 Iniciando Backend (API Server)..."
pnpm --filter @workspace/api-server run start