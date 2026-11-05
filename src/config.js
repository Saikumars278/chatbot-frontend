const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = (isLocal && !import.meta.env.VITE_API_BASE_URL?.includes("localhost"))
  ? "http://localhost:8000/api"
  : (import.meta.env.VITE_API_BASE_URL || "https://chatbot-backend-tmii.onrender.com/api");
