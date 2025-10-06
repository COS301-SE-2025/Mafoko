from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mavito_common.core.config import settings
from app.api.v1.endpoints import glossary

app = FastAPI(title="Marito Search Service")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(glossary.router, prefix="/api/v1/glossary", tags=["Glossary"])


@app.get("/", tags=["Health Check"])
async def read_root():
    return {"service": "Marito Search Service", "status": "ok"}
