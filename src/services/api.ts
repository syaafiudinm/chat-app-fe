// ============================================
// API Service Layer
// ============================================

import type {
  AuthTokens,
  User,
  Room,
  Message,
  PaginatedResponse,
  RoomMember,
  MessageRead,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

// ---- Token Management ----
let tokens: AuthTokens | null = null;

export function loadTokens(): AuthTokens | null {
  if (tokens) return tokens;
  try {
    const stored = localStorage.getItem("auth_tokens");
    if (!stored || stored === "undefined") return null;
    tokens = JSON.parse(stored);
    return tokens;
  } catch {
    localStorage.removeItem("auth_tokens");
    return null;
  }
}

export function saveTokens(t: AuthTokens) {
  tokens = t;
  localStorage.setItem("auth_tokens", JSON.stringify(t));
}

export function clearTokens() {
  tokens = null;
  localStorage.removeItem("auth_tokens");
}

// ---- Error Parser ----
async function parseError(res: Response): Promise<ApiError> {
  let message = "Something went wrong";
  try {
    const body = await res.json();
    message = body.message || body.error || body.status || JSON.stringify(body);
  } catch {
    try {
      const text = await res.text();
      message = text || `Error ${res.status}`;
    } catch {
      message = `Error ${res.status}`;
    }
  }
  return new ApiError(res.status, message);
}

// ---- HTTP Client ----
// Backend wraps all responses in { code, status, message, data }
// This function unwraps and returns `data` directly.
async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const t = loadTokens();
    if (t) headers["Authorization"] = `Bearer ${t.access_token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && auth) {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${refreshed.access_token}`;
      const retry = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (!retry.ok) throw await parseError(retry);
      const retryBody = await retry.json();
      return retryBody.data as T;
    }
    clearTokens();
    window.location.href = "/login";
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) return {} as T;

  const body = await res.json();
  return body.data as T;
}

// Raw request that returns the full response body (for auth endpoints)
async function requestRaw<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    throw await parseError(res);
  }

  return res.json();
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ---- Auth API ----
// Login response: { code, status, message, data: { access_token, refresh_token, user } }
export async function register(name: string, email: string, password: string) {
  const body = await requestRaw<{
    data: { access_token: string; refresh_token: string; user: User };
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  const { access_token, refresh_token, user } = body.data;
  saveTokens({ access_token, refresh_token });
  return { user, tokens: { access_token, refresh_token } };
}

export async function login(email: string, password: string) {
  const body = await requestRaw<{
    data: { access_token: string; refresh_token: string; user: User };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const { access_token, refresh_token, user } = body.data;
  saveTokens({ access_token, refresh_token });
  return { user, tokens: { access_token, refresh_token } };
}

async function refreshToken(): Promise<AuthTokens | null> {
  const t = loadTokens();
  if (!t?.refresh_token) return null;
  try {
    const body = await requestRaw<{
      data: { access_token: string; refresh_token: string };
    }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: t.refresh_token }),
    });
    const newTokens = {
      access_token: body.data.access_token,
      refresh_token: body.data.refresh_token,
    };
    saveTokens(newTokens);
    return newTokens;
  } catch {
    return null;
  }
}

export async function logout() {
  const t = loadTokens();
  try {
    await request("/auth/logout", {
      method: "POST",
      body: t?.refresh_token
        ? JSON.stringify({ refresh_token: t.refresh_token })
        : undefined,
    });
  } finally {
    clearTokens();
  }
}

// ---- Users API ----
export async function getUsers(page = 1, limit = 20) {
  return request<User[]>(`/users?page=${page}&limit=${limit}`);
}

export async function getMe() {
  return request<User>("/users/me");
}

export async function updateMe(
  data: Partial<Pick<User, "name" | "email" | "avatar">>,
) {
  return request<User>("/users/me", {
    method: "PUT",
    body: JSON.stringify({
      name: data.name,
      avatar: data.avatar,
    }),
  });
}

export async function updatePassword(
  old_password: string,
  new_password: string,
) {
  return request("/users/me/password", {
    method: "PUT",
    body: JSON.stringify({ old_password, new_password }),
  });
}

export async function getUserById(id: number) {
  return request<User>(`/users/${id}`);
}

export async function deleteUser(id: number) {
  return request(`/users/${id}`, { method: "DELETE" });
}

// ---- Rooms API ----
export async function createRoom(data: {
  name: string;
  description?: string;
  type?: string;
  member_ids?: number[];
}) {
  return request<Room>("/rooms", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      type: data.type || "group",
      member_ids: data.member_ids || [],
    }),
  });
}

export async function getRooms(page = 1, limit = 50) {
  return request<Room[]>(`/rooms?page=${page}&limit=${limit}`);
}

export async function getUserRooms(userId: number, page = 1, limit = 50) {
  return request<Room[]>(`/rooms/user/${userId}?page=${page}&limit=${limit}`);
}

export async function getRoomById(id: number) {
  return request<Room>(`/rooms/${id}`);
}

export async function updateRoom(
  id: number,
  data: Partial<Pick<Room, "name" | "description">>,
) {
  return request<Room>(`/rooms/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteRoom(id: number) {
  return request(`/rooms/${id}`, { method: "DELETE" });
}

export async function getRoomMembers(roomId: number) {
  return request<RoomMember[]>(`/rooms/${roomId}/members`);
}

export async function addRoomMember(
  roomId: number,
  userId: number,
  role = "member",
) {
  return request<RoomMember>(`/rooms/${roomId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, role }),
  });
}

export async function removeRoomMember(roomId: number, userId: number) {
  return request(`/rooms/${roomId}/members`, {
    method: "DELETE",
    body: JSON.stringify({ user_id: userId }),
  });
}

// ---- Messages API ----
export async function sendMessage(data: {
  room_id: number;
  content: string;
  type?: string;
}) {
  return request<Message>("/messages", {
    method: "POST",
    body: JSON.stringify({
      room_id: data.room_id,
      content: data.content,
      type: data.type || "text",
    }),
  });
}

export async function getMessage(id: number) {
  return request<Message>(`/messages/${id}`);
}

export async function updateMessage(id: number, content: string) {
  return request<Message>(`/messages/${id}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export async function deleteMessage(id: number) {
  return request(`/messages/${id}`, { method: "DELETE" });
}

export async function markMessageRead(messageId: number) {
  return request("/messages/read", {
    method: "POST",
    body: JSON.stringify({ message_id: messageId }),
  });
}

export async function getMessageReads(messageId: number) {
  return request<MessageRead[]>(`/messages/${messageId}/reads`);
}

export async function getRoomMessages(roomId: number, page = 1, limit = 50) {
  return request<Message[]>(
    `/rooms/${roomId}/messages?page=${page}&limit=${limit}`,
  );
}

export async function markAllRoomMessagesRead(roomId: number) {
  return request(`/rooms/${roomId}/messages/read-all`, { method: "POST" });
}

// ---- WebSocket URL ----
export function getWsUrl(): string {
  const t = loadTokens();
  const wsBase = import.meta.env.VITE_WS_URL || "ws://localhost:8080/api/v1/ws";
  // If VITE_WS_URL already ends with /ws, don't append again
  const base = wsBase.endsWith("/ws") ? wsBase : `${wsBase}/ws`;
  return `${base}?token=${t?.access_token || ""}`;
}
