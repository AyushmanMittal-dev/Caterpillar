"""
Caterpillar Operator Simulation Module — RAG Engine
Implements Vector Search with FAISS and local LLM / Embedding generation via Ollama (Llama 3.2 + nomic-embed-text).
Enforces strict anti-hallucination guardrails and similarity threshold validation.
"""

import os
import json
import re
import urllib.request
import urllib.error
import numpy as np
import faiss
from typing import List, Dict, Any, Optional, Tuple

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
DATA_DIR = os.path.join(BACKEND_DIR, "data")
MANUALS_DIR = os.path.join(DATA_DIR, "training_manuals")
INDEX_PATH = os.path.join(DATA_DIR, "cat_rag_index.faiss")
METADATA_PATH = os.path.join(DATA_DIR, "cat_rag_metadata.json")

OLLAMA_BASE_URL = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
EMBED_MODEL = "nomic-embed-text"
LLM_MODEL = "llama3.2"
EMBED_DIM = 768
SIMILARITY_THRESHOLD = 0.58  # Strict anti-hallucination cutoff for cosine similarity

GUARDRAIL_REFUSAL_MESSAGE = (
    "I am the Caterpillar Operator Assistant. I can only provide instructions and technical guidance "
    "verified in the official Caterpillar Operator Training Manuals. No relevant documentation was "
    "found for your query in the manuals. Please ask a question related to CAT machinery operation, "
    "cab controls, or job procedures."
)

MACHINE_MAP = {
    "CAT-320": "cat_320_excavator_manual.md",
    "CAT-420": "cat_420_backhoe_manual.md",
    "CAT-950M": "cat_950M_wheel_loader_manual.md",
    "CAT-140": "cat_140_motor_grader_manual.md",
    "CAT-349": "cat_349_demolition_manual.md"
}

class CatRAGService:
    def __init__(self):
        self.index: Optional[faiss.IndexFlatIP] = None
        self.chunks_metadata: List[Dict[str, Any]] = []
        self.is_initialized: bool = False

    def is_ollama_available(self) -> bool:
        """Check if local Ollama server is responding."""
        try:
            req = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=3) as resp:
                return resp.status == 200
        except Exception:
            return False

    def get_embedding(self, text: str) -> np.ndarray:
        """Fetch normalized 768-dim embedding vector from local Ollama."""
        clean_text = text.replace("\n", " ").strip()
        payload = json.dumps({
            "model": EMBED_MODEL,
            "prompt": clean_text
        }).encode("utf-8")
        
        req = urllib.request.Request(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                vec = np.array(data["embedding"], dtype=np.float32)
                # L2-normalize vector so that inner product equals cosine similarity
                norm = np.linalg.norm(vec)
                if norm > 0:
                    vec = vec / norm
                return vec
        except Exception as e:
            raise RuntimeError(f"Failed to generate embedding from Ollama: {e}")

    def load_and_chunk_manuals(self) -> List[Dict[str, Any]]:
        """Parses markdown manuals into semantically coherent sections with rich metadata."""
        if not os.path.exists(MANUALS_DIR):
            return []
            
        chunks = []
        files = [f for f in os.listdir(MANUALS_DIR) if f.endswith(".md")]
        
        for filename in files:
            filepath = os.path.join(MANUALS_DIR, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                
            # Extract document title
            doc_title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
            doc_title = doc_title_match.group(1).strip() if doc_title_match else filename
            
            # Map machine ID
            machine_id = "General"
            for mid, mfile in MACHINE_MAP.items():
                if mfile.lower() == filename.lower():
                    machine_id = mid
                    break
                    
            # Split by markdown headers (## or ###)
            sections = re.split(r"(?=(?:^##\s+|^###\s+))", content, flags=re.MULTILINE)
            
            for section in sections:
                sec_text = section.strip()
                if not sec_text:
                    continue
                    
                # Extract header line if present
                header_match = re.match(r"^(?:##|###)\s+(.+)$", sec_text, re.MULTILINE)
                section_title = header_match.group(1).strip() if header_match else "Overview"
                
                # If section is very long, split into sub-chunks of ~350 words
                words = sec_text.split()
                if len(words) > 380:
                    sub_chunk_size = 300
                    overlap = 40
                    for i in range(0, len(words), sub_chunk_size - overlap):
                        sub_words = words[i:i + sub_chunk_size]
                        sub_text = " ".join(sub_words)
                        chunks.append({
                            "doc_title": doc_title,
                            "filename": filename,
                            "machine_id": machine_id,
                            "section": section_title,
                            "text": f"[{doc_title} — {section_title}]\n{sub_text}"
                        })
                else:
                    chunks.append({
                        "doc_title": doc_title,
                        "filename": filename,
                        "machine_id": machine_id,
                        "section": section_title,
                        "text": f"[{doc_title} — {section_title}]\n{sec_text}"
                    })
                    
        return chunks

    def build_index(self, force_rebuild: bool = False):
        """Indexes all training manuals into FAISS IndexFlatIP."""
        if not force_rebuild and os.path.exists(INDEX_PATH) and os.path.exists(METADATA_PATH):
            try:
                self.index = faiss.read_index(INDEX_PATH)
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    self.chunks_metadata = json.load(f)
                self.is_initialized = True
                print(f"Loaded existing FAISS index with {self.index.ntotal} vectors from {INDEX_PATH}")
                return
            except Exception as e:
                print(f"Failed to load cached index, rebuilding: {e}")

        print("Building new FAISS vector index from Caterpillar training manuals...")
        chunks = self.load_and_chunk_manuals()
        if not chunks:
            print("Warning: No manual chunks found to index.")
            return

        embeddings = []
        valid_chunks = []
        for idx, chunk in enumerate(chunks):
            try:
                vec = self.get_embedding(chunk["text"])
                embeddings.append(vec)
                valid_chunks.append(chunk)
            except Exception as e:
                print(f"Error embedding chunk {idx}: {e}")

        if not embeddings:
            raise RuntimeError("No embeddings were generated. Ensure Ollama is running.")

        matrix = np.vstack(embeddings).astype(np.float32)
        # Using IndexFlatIP on L2-normalized vectors yields exact Cosine Similarity
        self.index = faiss.IndexFlatIP(EMBED_DIM)
        self.index.add(matrix)
        self.chunks_metadata = valid_chunks

        # Persist index and metadata
        faiss.write_index(self.index, INDEX_PATH)
        with open(METADATA_PATH, "w", encoding="utf-8") as f:
            json.dump(valid_chunks, f, indent=2)

        self.is_initialized = True
        print(f"Successfully built & saved FAISS index with {self.index.ntotal} chunks to {INDEX_PATH}")

    def search(self, query: str, top_k: int = 4, machine_id: Optional[str] = None) -> List[Tuple[Dict[str, Any], float]]:
        """Vector similarity search returning chunks and cosine similarity scores."""
        if not self.is_initialized or self.index is None:
            self.build_index()

        query_vec = self.get_embedding(query).reshape(1, -1)
        
        # Over-retrieve if filtering by machine
        k_retrieve = top_k * 3 if machine_id else top_k
        k_retrieve = min(k_retrieve, self.index.ntotal)
        
        distances, indices = self.index.search(query_vec, k_retrieve)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1 or idx >= len(self.chunks_metadata):
                continue
            chunk = self.chunks_metadata[idx]
            
            # Apply machine preference / filter if relevant
            if machine_id and chunk["machine_id"] not in [machine_id, "General"]:
                # Penalize or skip mismatched machines unless no machine-specific chunk exists
                continue
                
            results.append((chunk, float(dist)))
            if len(results) >= top_k:
                break
                
        # If strict filtering produced too few results, fallback to unfiltered top results
        if len(results) < 2 and machine_id:
            for dist, idx in zip(distances[0], indices[0]):
                if idx == -1 or idx >= len(self.chunks_metadata):
                    continue
                chunk = self.chunks_metadata[idx]
                if not any(r[0]["text"] == chunk["text"] for r in results):
                    results.append((chunk, float(dist)))
                if len(results) >= top_k:
                    break

        return results

    def generate_chat_response(
        self,
        message: str,
        machine_id: Optional[str] = None,
        task_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Executes grounded RAG pipeline:
        1. Checks Ollama availability.
        2. Retrieves top-K chunks from FAISS.
        3. Validates against similarity threshold (Guardrail).
        4. Invokes Llama 3.2 with strict grounded system prompt.
        """
        if not self.is_ollama_available():
            return {
                "reply": "Ollama local AI server is currently offline. Please ensure Ollama is running on your machine (http://localhost:11434).",
                "sources": [],
                "is_grounded": False,
                "similarity_score": 0.0,
                "retrieved": False
            }

        # 1. Similarity Retrieval
        search_results = self.search(message, top_k=3, machine_id=machine_id)
        if not search_results:
            return {
                "reply": GUARDRAIL_REFUSAL_MESSAGE,
                "sources": [],
                "is_grounded": False,
                "similarity_score": 0.0,
                "retrieved": False
            }

        best_score = search_results[0][1]
        
        # 2. Strict Anti-Hallucination Guardrail Check
        if best_score < SIMILARITY_THRESHOLD:
            return {
                "reply": GUARDRAIL_REFUSAL_MESSAGE,
                "sources": [],
                "is_grounded": False,
                "similarity_score": round(best_score, 3),
                "retrieved": False
            }

        # Collect relevant chunks
        context_chunks = []
        sources = []
        for chunk, score in search_results:
            if score >= (SIMILARITY_THRESHOLD - 0.06):  # Keep relevant support chunks
                context_chunks.append(chunk["text"])
                source_entry = {
                    "doc_title": chunk["doc_title"],
                    "section": chunk["section"],
                    "machine_id": chunk["machine_id"],
                    "similarity": round(score * 100, 1)
                }
                if not any(s["section"] == source_entry["section"] and s["machine_id"] == source_entry["machine_id"] for s in sources):
                    sources.append(source_entry)

        context_text = "\n\n---\n\n".join(context_chunks)

        # 3. Grounded Prompt with Anti-Hallucination Guardrails
        system_instruction = (
            "You are the official Caterpillar Intelligent Cab Operator Assistant.\n"
            "Your mission is to provide accurate, practical, and safety-focused guidance to machine operators sitting in the cab.\n"
            "STRICT RULES:\n"
            "1. Answer ONLY using the facts, tuning specifications, and procedures present in the VERIFIED CATERPILLAR MANUAL EXCERPTS below.\n"
            "2. Do NOT extrapolate, speculate, guess, or invent instructions not contained in the excerpts.\n"
            "3. If the provided excerpts do not mention the answer, state clearly: 'The official Caterpillar manuals provided do not contain specific instructions for this question.'\n"
            "4. Format the reply cleanly using concise bullet points and bold key parameters (e.g. RPM values, mode names, blade angles)."
        )

        prompt = (
            f"{system_instruction}\n\n"
            f"### VERIFIED CATERPILLAR MANUAL EXCERPTS:\n"
            f"{context_text}\n\n"
            f"### OPERATOR QUESTION:\n"
            f"{message}\n\n"
            f"### CATERPILLAR CAB ASSISTANT ADVICE:"
        )

        payload = json.dumps({
            "model": LLM_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,  # Low temperature for strict factual accuracy
                "top_p": 0.9,
                "num_predict": 350
            }
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{OLLAMA_BASE_URL}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                reply = data.get("response", "").strip()
                if not reply:
                    reply = GUARDRAIL_REFUSAL_MESSAGE

                return {
                    "reply": reply,
                    "sources": sources,
                    "is_grounded": True,
                    "similarity_score": round(best_score, 3),
                    "retrieved": True
                }
        except Exception as e:
            return {
                "reply": f"Error communicating with local Llama 3.2 model: {e}",
                "sources": sources,
                "is_grounded": False,
                "similarity_score": round(best_score, 3),
                "retrieved": True
            }

rag_service = CatRAGService()
