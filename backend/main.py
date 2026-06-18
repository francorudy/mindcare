from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.database.connection import engine, Base

# Importar todos los modelos para que SQLAlchemy los registre
import app.models  # noqa: F401

from app.routers.auth_routes          import router as auth_router
from app.routers.evaluacion_routes    import router as evaluacion_router
from app.routers.phq9_routes          import router as phq9_router
from app.routers.journal_routes       import router as journal_router
from app.routers.procesamiento_routes import router as procesamiento_router
from app.routers.recomendacion_routes import router as recomendacion_router
from app.routers.admin_routes         import router as admin_router

# Crear tablas (en dev; en prod usa Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MindCare API",
    description="Sistema de detección temprana de bienestar emocional estudiantil",
    version="1.0.0",
)

# CORS — localhost, puertos alternativos y red local en desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth_router)
app.include_router(evaluacion_router)
app.include_router(phq9_router)
app.include_router(journal_router)
app.include_router(procesamiento_router)
app.include_router(recomendacion_router)
app.include_router(admin_router)


@app.get("/", tags=["Health"])
def root():
    return {"message": "MindCare API funcionando correctamente"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}