@echo off
echo =======================================================
echo Starting Caterpillar Operator Simulation Module
echo =======================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "CAT Simulator Backend" cmd /k "backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 --reload"

echo [2/2] Starting React + Vite Frontend on http://localhost:5173 ...
cd frontend
start "CAT Simulator Frontend" cmd /k "npm run dev"

echo Both services launched!
echo Access the UI at: http://localhost:5173
echo Access the API docs at: http://localhost:8000/docs
pause
