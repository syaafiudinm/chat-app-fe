import { useEffect, useRef, useCallback, useState } from "react";
import { wsService } from "../services/ws";
import {
  useAuthStore,
  useRoomStore,
  useMessageStore,
  useUIStore,
  useUserCacheStore,
} from "../stores";
import type { Message } from "../types";

// ---- useWebSocket ----
export function useWebSocket() {
  const { user } = useAuthStore();
  const { activeRoomId, updateLastMessage, incrementUnread } = useRoomStore();
  const { addMessage, updateMessage, removeMessage } = useMessageStore();
  const {
    addTypingUser,
    removeTypingUser,
    setUserOnline,
    setUserOffline,
    setWsConnected,
  } = useUIStore();
  const { getUser } = useUserCacheStore();

  useEffect(() => {
    if (!user) return;

    wsService.connect();

    const unsubs = [
      wsService.on(
        "connection_status",
        ({ connected }: { connected: boolean }) => {
          setWsConnected(connected);
        },
      ),

      wsService.on("new_message", (payload: any) => {
        // Enrich with cached user data if sender object is missing
        const cachedSender = getUser(payload.sender_id);
        const msg: Message = {
          id: payload.id,
          room_id: payload.room_id,
          sender_id: payload.sender_id,
          content: payload.content,
          message_type: payload.type || "text",
          type: payload.type || "text",
          is_edited: payload.is_edited || false,
          reply_to_id: payload.reply_to_id || null,
          reply_to: payload.reply_to || null,
          attachments: payload.attachments || [],
          sender: payload.sender || (cachedSender ? cachedSender : undefined),
          created_at: payload.created_at,
          updated_at: payload.updated_at || payload.created_at,
        };
        addMessage(msg.room_id, msg);
        updateLastMessage(msg.room_id, msg);
        if (msg.sender_id !== user.id && msg.room_id !== activeRoomId) {
          incrementUnread(msg.room_id);
        }
      }),

      wsService.on("message_updated", (payload: any) => {
        const cachedSender = getUser(payload.sender_id);
        const msg: Message = {
          id: payload.id,
          room_id: payload.room_id,
          sender_id: payload.sender_id,
          content: payload.content,
          message_type: payload.type || "text",
          type: payload.type || "text",
          is_edited: payload.is_edited || true,
          sender: payload.sender || (cachedSender ? cachedSender : undefined),
          created_at: payload.created_at,
          updated_at: payload.updated_at || payload.created_at,
        };
        updateMessage(msg.room_id, msg);
      }),

      wsService.on(
        "message_deleted",
        (payload: { room_id: number; message_id: number }) => {
          removeMessage(payload.room_id, payload.message_id);
        },
      ),

      wsService.on(
        "user_typing",
        (payload: { user_id: number; room_id: number }) => {
          if (payload.user_id !== user.id) {
            const cached = getUser(payload.user_id);
            addTypingUser({
              user_id: payload.user_id,
              username: cached?.name || `User ${payload.user_id}`,
              room_id: payload.room_id,
            });
            setTimeout(
              () => removeTypingUser(payload.user_id, payload.room_id),
              3000,
            );
          }
        },
      ),

      wsService.on(
        "user_stop_typing",
        (payload: { user_id: number; room_id: number }) => {
          removeTypingUser(payload.user_id, payload.room_id);
        },
      ),

      wsService.on("user_online", (payload: { user_id: number }) => {
        setUserOnline(payload.user_id);
      }),

      wsService.on("user_offline", (payload: { user_id: number }) => {
        setUserOffline(payload.user_id);
      }),

      wsService.on(
        "message_read",
        (payload: {
          room_id: number;
          message_id: number;
          user_id: number;
          read_at: string;
        }) => {
          // message_id === 0 means "all read" — refetch jika perlu
          if (payload.message_id === 0) return;

          // Update the specific message's reads array
          const roomMsgs = useMessageStore
            .getState()
            .messages.get(payload.room_id);
          if (!roomMsgs) return;

          const msg = roomMsgs.find((m) => m.id === payload.message_id);
          if (!msg) return;

          const alreadyRead = msg.reads?.some(
            (r) => r.user_id === payload.user_id,
          );
          if (alreadyRead) return;

          const cachedUser = getUser(payload.user_id);
          const newRead = {
            id: Date.now(), // temp id
            message_id: payload.message_id,
            user_id: payload.user_id,
            user: cachedUser || undefined,
            read_at: payload.read_at,
          };

          const updated = {
            ...msg,
            reads: [...(msg.reads || []), newRead],
          };

          updateMessage(payload.room_id, updated as any);
        },
      ),

      wsService.on("error", (payload: any) => {
        console.error("[WS] Server error:", payload);
      }),

      wsService.on("pong", () => {
        // Heartbeat acknowledged
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
      wsService.disconnect();
    };
  }, [user?.id]);
}

// ---- useTypingIndicator ----
export function useTypingIndicator(roomId: number | null) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const startTyping = useCallback(() => {
    if (!roomId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      wsService.send("typing", { room_id: roomId });
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      wsService.send("stop_typing", { room_id: roomId });
    }, 2000);
  }, [roomId]);

  const stopTyping = useCallback(() => {
    if (!roomId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      wsService.send("stop_typing", { room_id: roomId });
    }
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { startTyping, stopTyping };
}

// ---- useDebounce ----
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
