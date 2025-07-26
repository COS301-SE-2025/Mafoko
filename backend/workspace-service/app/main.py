from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import workspace

app = FastAPI(title="Marito Workspace Service")

# Add CORS middleware to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # React dev server
        "http://localhost:8080",  # Alternative frontend port
        "*",  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workspace.router, prefix="/api/v1/workspace", tags=["Workspace"])


@app.get("/", tags=["Health Check"])
async def read_root():
    return {"service": "Marito Workspace Service", "status": "ok"}
