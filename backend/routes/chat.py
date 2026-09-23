"""
API Routes for Caterpillar Operator RAG Chatbot.
Connects with local Ollama Llama 3.2 and FAISS vector index.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.rag_service import rag_service, INDEX_PATH, LLM_MODEL, EMBED_MODEL

router = APIRouter(prefix="/api/chat", tags=["operator-chat"])

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, example="How do I set the blade angle for finish grading?")
    machine_id: Optional[str] = Field(default=None, example="CAT-140")
    task_id: Optional[str] = Field(default=None, example="T004")
    history: Optional[List[Dict[str, str]]] = Field(default=None)

@router.post("")
def chat(req: ChatRequest):
    """
    RAG-powered conversational endpoint for Caterpillar operators.
    Searches official Markdown manuals with FAISS and invokes local Llama 3.2 with strict guardrails.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    try:
        response = rag_service.generate_chat_response(
            message=req.message.strip(),
            machine_id=req.machine_id,
            task_id=req.task_id,
            history=req.history
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Chatbot processing error: {e}")

@router.post("/reindex")
def reindex_manuals():
    """Admin endpoint to re-chunk manuals and rebuild the FAISS vector index."""
    try:
        rag_service.build_index(force_rebuild=True)
        return {
            "status": "success",
            "total_chunks": rag_service.index.ntotal if rag_service.index else 0,
            "index_path": INDEX_PATH
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reindex manuals: {e}")

@router.get("/status")
def chat_status():
    """Returns the operational status of the local RAG engine."""
    ollama_ready = rag_service.is_ollama_available()
    return {
        "status": "operational" if (ollama_ready and rag_service.is_initialized) else "degraded",
        "ollama_online": ollama_ready,
        "index_initialized": rag_service.is_initialized,
        "total_chunks": rag_service.index.ntotal if rag_service.index else 0,
        "llm_model": LLM_MODEL,
        "embed_model": EMBED_MODEL
    }
