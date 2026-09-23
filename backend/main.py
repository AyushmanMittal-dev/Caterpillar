"""
FastAPI Server Entrypoint for Caterpillar Machine Operator Simulation Module.
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

from backend.routes.simulation import router as simulation_router
from backend.routes.chat import router as chat_router
from backend.routes.engine import router as engine_router
from backend.services.ml_engine import ml_engine
from backend.services.rag_service import rag_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure ML models and RAG index are loaded
    if not ml_engine.is_loaded:
        print("Loading ML models during startup...")
        ml_engine.load()
    if not rag_service.is_initialized:
        try:
            print("Loading RAG FAISS index during startup...")
            rag_service.build_index()
        except Exception as e:
            print(f"Warning: RAG service index initialization deferred: {e}")
    yield
    # Shutdown logic if any
    print("Shutting down CAT Simulator backend...")

# Also load immediately on import so it's warm
try:
    ml_engine.load()
except Exception as e:
    print(f"Warning: Deferred ML engine load: {e}")

try:
    rag_service.build_index()
except Exception as e:
    print(f"Warning: Deferred RAG index load: {e}")

app = FastAPI(
    title="Caterpillar Intelligent Operator Assistant API",
    description="Multifunctional simulation and training API for CAT machinery operators",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite default is 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation_router)
app.include_router(chat_router)
app.include_router(engine_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CAT Machine Operator Simulation Module",
        "ml_engine_loaded": ml_engine.is_loaded,
        "rag_engine_loaded": rag_service.is_initialized,
        "ollama_available": rag_service.is_ollama_available(),
        "metrics": ml_engine.metrics
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
