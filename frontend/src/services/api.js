// src/services/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
  timeout: 1000000,
});

// Request interceptor: attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// -------------------- AUTH API --------------------
// Matches: routes/authRoutes.js
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  // Search user by userId or phoneNumber -> GET /api/auth/search?identifier=...
  searchUser: (identifier) =>
    api.get(`/auth/search?identifier=${encodeURIComponent(identifier)}`),
};

// -------------------- CHAT API --------------------
// Matches: routes/chatRoutes.js (base /api/chat)
export const chatApi = {
  // GET /api/chat/conversations
  getConversations: () => api.get("/chat/conversations"),

  // GET /api/chat/messages/:partnerId?page=&limit=
  getMessages: (partnerId, page = 1, limit = 50) =>
    api.get(
      `/chat/messages/${encodeURIComponent(
        partnerId
      )}?page=${page}&limit=${limit}`
    ),

  // POST /api/chat/mark-read
  markAsRead: (partnerId) => api.post("/chat/mark-read", { partnerId }),

  // POST /api/chat/process-ai  (grammar/tone + optional save)
  processWithAI: (message, options) =>
    api.post("/chat/process-ai", { message, options }),
};

// -------------------- AGENT API --------------------
// Matches: routes/aiAgentRoutes.js (base /api/agent)
export const agentApi = {
  chat: (message) => api.post("/agent/chat", { message }),
  reset: () => api.post("/agent/reset"),
};
