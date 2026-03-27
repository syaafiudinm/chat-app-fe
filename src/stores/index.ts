import { create } from "zustand";
import type { User, Room, Message, TypingUser } from "../types";
import * as api from "../services/api";

// ---- Auth Store ----
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!api.loadTokens(),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user } = await api.login(email, password);
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const { user } = await api.register(name, email, password);
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await api.logout();
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const user = await api.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
      api.clearTokens();
    }
  },

  setUser: (user) => set({ user }),
}));

// ---- User Cache Store ----
interface UserCacheState {
  users: Map<number, User>;
  fetchUsers: () => Promise<void>;
  getUser: (id: number) => User | undefined;
  addUser: (user: User) => void;
}

export const useUserCacheStore = create<UserCacheState>((set, get) => ({
  users: new Map(),

  fetchUsers: async () => {
    try {
      const res = await api.getUsers(1, 200);
      const data = Array.isArray(res) ? res : [];
      const map = new Map<number, User>();
      data.forEach((u) => map.set(u.id, u));
      set({ users: map });
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  },

  getUser: (id) => get().users.get(id),

  addUser: (user) =>
    set((s) => {
      const map = new Map(s.users);
      map.set(user.id, user);
      return { users: map };
    }),
}));

// ---- Room Store ----
interface RoomState {
  rooms: Room[];
  activeRoomId: number | null;
  isLoading: boolean;
  fetchRooms: () => Promise<void>;
  setActiveRoom: (id: number | null) => void;
  addRoom: (room: Room) => void;
  updateRoom: (room: Room) => void;
  removeRoom: (id: number) => void;
  updateLastMessage: (roomId: number, message: Message) => void;
  incrementUnread: (roomId: number) => void;
  clearUnread: (roomId: number) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  activeRoomId: null,
  isLoading: false,

  fetchRooms: async () => {
    set({ isLoading: true });
    try {
      const { user } = useAuthStore.getState();
      if (!user) return;
      const res = await api.getUserRooms(user.id, 1, 100);
      const rooms = Array.isArray(res) ? res : [];
      set({ rooms });
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveRoom: (id) => set({ activeRoomId: id }),
  addRoom: (room) => set((s) => ({ rooms: [room, ...s.rooms] })),
  updateRoom: (room) =>
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === room.id ? { ...r, ...room } : r)),
    })),
  removeRoom: (id) =>
    set((s) => ({
      rooms: s.rooms.filter((r) => r.id !== id),
      activeRoomId: s.activeRoomId === id ? null : s.activeRoomId,
    })),
  updateLastMessage: (roomId, message) =>
    set((s) => ({
      rooms: s.rooms
        .map((r) => {
          if (r.id !== roomId) return r;
          return {
            ...r,
            last_message: {
              id: message.id,
              content: message.content,
              type: message.type || message.message_type || "text",
              sender_id: message.sender_id,
              sender_name: message.sender?.name || "",
              created_at: message.created_at,
            },
          };
        })
        .sort((a, b) => {
          const aTime = a.last_message?.created_at || a.created_at;
          const bTime = b.last_message?.created_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }),
    })),
  incrementUnread: (roomId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, unread_count: (r.unread_count || 0) + 1 } : r,
      ),
    })),
  clearUnread: (roomId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, unread_count: 0 } : r,
      ),
    })),
}));

// ---- Message Store ----
interface MessageState {
  messages: Map<number, Message[]>;
  isLoading: boolean;
  hasMore: Map<number, boolean>;
  currentPage: Map<number, number>;
  fetchMessages: (roomId: number, page?: number) => Promise<void>;
  addMessage: (roomId: number, message: Message) => void;
  updateMessage: (roomId: number, message: Message) => void;
  removeMessage: (roomId: number, messageId: number) => void;
  clearMessages: (roomId: number) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: new Map(),
  isLoading: false,
  hasMore: new Map(),
  currentPage: new Map(),

  fetchMessages: async (roomId, page = 1) => {
    set({ isLoading: true });
    try {
      const res = await api.getRoomMessages(roomId, page, 50);
      const data = Array.isArray(res) ? res : [];
      set((s) => {
        const map = new Map(s.messages);
        const existing = page > 1 ? map.get(roomId) || [] : [];
        const newMsgs = [...data].reverse();
        map.set(roomId, page > 1 ? [...newMsgs, ...existing] : newMsgs);
        const hasMoreMap = new Map(s.hasMore);
        hasMoreMap.set(roomId, data.length >= 50);
        const pageMap = new Map(s.currentPage);
        pageMap.set(roomId, page);
        return { messages: map, hasMore: hasMoreMap, currentPage: pageMap };
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addMessage: (roomId, message) =>
    set((s) => {
      const map = new Map(s.messages);
      const existing = map.get(roomId) || [];
      if (existing.some((m) => m.id === message.id)) return s;
      map.set(roomId, [...existing, message]);
      return { messages: map };
    }),

  updateMessage: (roomId, message) =>
    set((s) => {
      const map = new Map(s.messages);
      const existing = map.get(roomId) || [];
      map.set(
        roomId,
        existing.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
      );
      return { messages: map };
    }),

  removeMessage: (roomId, messageId) =>
    set((s) => {
      const map = new Map(s.messages);
      const existing = map.get(roomId) || [];
      map.set(
        roomId,
        existing.filter((m) => m.id !== messageId),
      );
      return { messages: map };
    }),

  clearMessages: (roomId) =>
    set((s) => {
      const map = new Map(s.messages);
      map.delete(roomId);
      return { messages: map };
    }),
}));

// ---- UI Store ----
interface UIState {
  sidebarOpen: boolean;
  membersPanelOpen: boolean;
  typingUsers: TypingUser[];
  onlineUsers: Set<number>;
  wsConnected: boolean;
  replyTo: Message | null;
  profileModalOpen: boolean;
  roomSettingsOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMembersPanel: () => void;
  addTypingUser: (user: TypingUser) => void;
  removeTypingUser: (userId: number, roomId: number) => void;
  setUserOnline: (userId: number) => void;
  setUserOffline: (userId: number) => void;
  setWsConnected: (connected: boolean) => void;
  setReplyTo: (message: Message | null) => void;
  setProfileModalOpen: (open: boolean) => void;
  setRoomSettingsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  membersPanelOpen: false,
  typingUsers: [],
  onlineUsers: new Set(),
  wsConnected: false,
  replyTo: null,
  profileModalOpen: false,
  roomSettingsOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMembersPanel: () =>
    set((s) => ({ membersPanelOpen: !s.membersPanelOpen })),
  addTypingUser: (user) =>
    set((s) => {
      if (
        s.typingUsers.some(
          (t) => t.user_id === user.user_id && t.room_id === user.room_id,
        )
      )
        return s;
      return { typingUsers: [...s.typingUsers, user] };
    }),
  removeTypingUser: (userId, roomId) =>
    set((s) => ({
      typingUsers: s.typingUsers.filter(
        (t) => !(t.user_id === userId && t.room_id === roomId),
      ),
    })),
  setUserOnline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUsers);
      next.add(userId);
      return { onlineUsers: next };
    }),
  setUserOffline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setReplyTo: (message) => set({ replyTo: message }),
  setProfileModalOpen: (open) => set({ profileModalOpen: open }),
  setRoomSettingsOpen: (open) => set({ roomSettingsOpen: open }),
}));
