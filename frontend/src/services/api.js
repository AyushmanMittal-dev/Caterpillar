/**
 * API client to interact with FastAPI simulation backend.
 */

const API_BASE = '/api';

export async function fetchTasks() {
  const res = await fetch(`${API_BASE}/tasks`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function fetchMachines() {
  const res = await fetch(`${API_BASE}/machines`);
  if (!res.ok) throw new Error('Failed to fetch machines');
  return res.json();
}

export async function runSimulation(payload) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Simulation run failed');
  }
  return res.json();
}

export async function fetchOptimalSolution(taskId) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/optimal`);
  if (!res.ok) throw new Error('Failed to fetch optimal solution');
  return res.json();
}

export async function sendChatMessage(payload) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Chat query failed');
  }
  return res.json();
}

export async function fetchChatStatus() {
  const res = await fetch(`${API_BASE}/chat/status`);
  if (!res.ok) return { ollama_online: false, status: 'offline' };
  return res.json();
}
