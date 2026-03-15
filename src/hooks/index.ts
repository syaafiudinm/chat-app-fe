// ============================================
// Custom Hooks
// ============================================

import { useEffect, useRef, useCallback, useState } from "react";
import { wsService } from "../services/ws";
import {
  useAuthStore,
  useRoomStore,
  useMessageStore,
  useUIStore,
} from "../stores";
import type { Message } from "../types";

// ---- useWebSocket: Connect + handle all WS events ----
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

      // Backend payload: { id, room_id, sender_id, content, type, ... }
      wsService.on("new_message", (payload: any) => {
        const msg: Message = {
          id: payload.id,
          room_id: payload.room_id,
          sender_id: payload.sender_id,
          content: payload.content,
          message_type: payload.type || "text",
          sender: payload.sender,
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
        const msg: Message = {
          id: payload.id,
          room_id: payload.room_id,
          sender_id: payload.sender_id,
          content: payload.content,
          message_type: payload.type || "text",
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

      // Backend payload: { room_id, user_id }
      wsService.on(
        "user_typing",
        (payload: { user_id: number; room_id: number }) => {
          if (payload.user_id !== user.id) {
            addTypingUser({
              user_id: payload.user_id,
              username: `User ${payload.user_id}`,
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
