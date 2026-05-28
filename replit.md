# Cerebrito - Plataforma Gamificada de Informatica

## Overview

pnpm workspace monorepo using TypeScript. Cerebrito is a gamified educational competition platform for high school informatics students (bachillerato) in Nacional Cumbaya. Features: 3 modules (one per year), competitive challenges (quiz, code_challenge, security_puzzle, drag_drop, speed_race), teacher registration/dashboard with custom challenge creation, student dashboard restricted to their grade level, ranked leaderboard with color tiers, inbox (alerts, feedback, recommendations), saved progress.

## Artifacts

- **artifacts/Cerebrito** — React + Vite frontend at `/`
- **artifacts/api-server** — Express + TypeScript API at `/api/*`

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Fonts**: Orbitron, Inter, JetBrains Mono
- **Color palette**: Dark bg, electric blue #0EA5E9, cyan #06B6D4, vivid green #22C55E, purple #A855F7
- **Auth**: JWT Bearer tokens, stored in `localStorage["Cerebrito_token"]`

## Database Schema

Tables: `perfiles`, `modulos`, `niveles`, `preguntas`, `retos`, `retos_personalizados`, `retos_personalizados_preguntas`, `resultados`, `alertas`, `recomendaciones`, `feedback_docente`, `intentos_guardados`

Key field names:
- `alertas`: uses `descripcion`, `leida`, `tipo` (enum: bajo_rendimiento, nivel_completado, logro, sistema)
- `feedback_docente`: uses `contenido`, `leido`, `tipo` (enum: mejora, felicitacion, advertencia, general), `creado_en`
- `recomendaciones`: uses `descripcion`, `leida`, `motivo`, `tipo`
- `resultados`: uses `puntuacion` (not puntaje), `precision`, `tiempo_total` (not tiempo_empleado)
- `retos`: uses `id_modulo`, `id_nivel`, `tipo_juego`, `puntos_maximos`, `numero_preguntas`

## Demo Accounts

- Docente: `docente1` / `123456` (Prof. Carlos Mendoza)
- Estudiante 1er año: `ana_torres` / `123456`
- Estudiante 2do año: `luis_L` / `123456`
- Estudiante 3er año: `maria_s` / `123456`
- Estudiante 1er año: `diego_f` / `123456`

## API Routes

### Auth
- POST `/api/auth/register` — registro
- POST `/api/auth/login` — login (returns JWT token)
- GET `/api/auth/me` — perfil actual (requires auth)

### Modules
- GET `/api/modules` — todos los modulos (soporta `?anio=N`)
- GET `/api/modules/:id` — modulo especifico
- GET `/api/modules/:id/levels` — niveles del modulo

### Challenges
- GET `/api/challenges` — retos predefinidos (soporta `?id_modulo=N`)
- GET `/api/challenges/custom` — retos personalizados del docente
- POST `/api/challenges/custom` — crear reto personalizado (docente)
- GET `/api/challenges/:id` — reto especifico con preguntas
- GET `/api/challenges/:id/questions` — preguntas en orden aleatorio
- POST `/api/challenges/:id/check-answer` — verificar respuesta

### Results
- POST `/api/results` — registrar resultado
- GET `/api/results/my` — resultados del usuario actual
- GET `/api/results/my-history` — historial formateado
- GET `/api/results/stats` — estadisticas del usuario

### Ranking
- GET `/api/ranking` — tabla de clasificacion global
- GET `/api/ranking/module/:moduleId` — ranking por modulo

### Inbox
- GET `/api/inbox/alerts` — alertas (normalizado con titulo+mensaje)
- PUT `/api/inbox/alerts/:id/read` — marcar como leida
- GET `/api/inbox/recommendations` — recomendaciones
- GET `/api/inbox/feedback` — feedback del docente
- POST `/api/inbox/feedback` — enviar mensaje al docente
- GET `/api/inbox/unread-count` — contador de no leidos

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/Carebrito run dev` — run frontend locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
