import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import auth, modules, challenges, results, ranking, inbox, sessions

app = FastAPI(title="Cerebrito API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(modules.router, prefix="/api")
app.include_router(challenges.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(ranking.router, prefix="/api")
app.include_router(inbox.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")


@app.get("/api/healthz")
def healthz():
    return {"status": "ok"}
