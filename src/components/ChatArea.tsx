import { useEffect, useRef, useState, useCallback } from "react";
import {
  useRoomStore,
  useMessageStore,
  useUIStore,
  useAuthStore,
  useUserCacheStore,
} from "../stores";
import { wsService } from "../services/ws";
import * as api from "../services/api";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import MembersPanel from "./MembersPanel";
import RoomSettingsModal from "./RoomSettingsModal";
import { groupMessagesByDate } from "../utils";

export default function ChatArea() {
  const { activeRoomId, rooms, clearUnread } = useRoomStore();
  const { messages, fetchMessages, isLoading, hasMore } = useMessageStore();
  const {
    typingUsers,
    toggleSidebar,
    toggleMembersPanel,
    roomSettingsOpen,
    setRoomSettingsOpen,
  } = useUIStore();
  const { user } = useAuthStore();
  const { getUser } = useUserCacheStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [initialLoad, setInitialLoad] = useState(true);

  const room = rooms.find((r) => r.id === activeRoomId);
  const roomMessages = activeRoomId ? messages.get(activeRoomId) || [] : [];
  const roomTyping = typingUsers.filter(
    (t) => t.room_id === activeRoomId && t.user_id !== user?.id,
  );

  // Resolve DM display name
  const getRoomDisplayName = (): string => {
    if (!room) return "";
    if (room.type !== "private") return room.name;

    if (room.members && room.members.length > 0) {
      const other = room.members.find((m: any) => m.user_id !== user?.id);
      if (other?.user?.name) return other.user.name;
      if (other) {
        const cached = getUser(other.user_id);
        if (cached) return cached.name;
      }
    }

    // Fallback: check messages for the other sender
    if (roomMessages.length > 0) {
      const otherMsg = roomMessages.find((m) => m.sender_id !== user?.id);
      if (otherMsg) {
        const cached = getUser(otherMsg.sender_id);
        if (cached) return cached.name;
        if (otherMsg.sender?.name) return otherMsg.sender.name;
      }
    }

    return room.name;
  };

  const displayName = getRoomDisplayName();

  useEffect(() => {
    if (!activeRoomId) return;
    setPage(1);
    setInitialLoad(true);
    fetchMessages(activeRoomId, 1).then(() => setInitialLoad(false));

    wsService.send("join_room", { room_id: activeRoomId });
    api.markAllRoomMessagesRead(activeRoomId).catch(() => {});
    clearUnread(activeRoomId);

    return () => {
      if (activeRoomId) wsService.send("leave_room", { room_id: activeRoomId });
    };
  }, [activeRoomId]);

  useEffect(() => {
    if (initialLoad || !containerRef.current) return;
    const el = containerRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (
      isNearBottom ||
      roomMessages[roomMessages.length - 1]?.sender_id === user?.id
    ) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [roomMessages.length]);

  useEffect(() => {
    if (!initialLoad) messagesEndRef.current?.scrollIntoView();
  }, [initialLoad]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !activeRoomId || isLoading) return;
    if (containerRef.current.scrollTop < 100 && hasMore.get(activeRoomId)) {
      const nextPage = page + 1;
      setPage(nextPage);
      const prevHeight = containerRef.current.scrollHeight;
      fetchMessages(activeRoomId, nextPage).then(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop =
            containerRef.current.scrollHeight - prevHeight;
        }
      });
    }
  }, [activeRoomId, page, isLoading, hasMore]);

  if (!activeRoomId || !room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-zinc-600"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-400 mb-1">
            No chat selected
          </h3>
          <p className="text-sm text-zinc-600">
            Choose a conversation to start messaging
          </p>
        </div>
      </div>
    );
  }

  const grouped = groupMessagesByDate(roomMessages);

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-1 text-zinc-400 hover:text-white"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
                {room.type === "group" && (
                  <span className="text-zinc-500">#</span>
                )}
                {displayName}
              </h2>
              {room.description && (
                <p className="text-[11px] text-zinc-600 truncate max-w-xs">
                  {room.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setRoomSettingsOpen(true)}
              className="p-2 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors"
              title="Room settings"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button
              onClick={toggleMembersPanel}
              className="p-2 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors"
              title="Members"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-thin py-4"
        >
          {isLoading && page === 1 && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
            </div>
          )}
          {isLoading && page > 1 && (
            <div className="flex justify-center py-2">
              <div className="w-4 h-4 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
            </div>
          )}
          {!isLoading && roomMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                <span className="text-2xl">👋</span>
              </div>
              <p className="text-sm text-zinc-400 font-medium">
                This is the beginning of{" "}
                <span className="text-white">{displayName}</span>
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Send a message to start the conversation
              </p>
            </div>
          )}

          {Array.from(grouped.entries()).map(([dateLabel, msgs]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-4 px-4 my-4">
                <div className="flex-1 h-px bg-zinc-800/50" />
                <span className="text-[11px] text-zinc-600 font-medium shrink-0">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-zinc-800/50" />
              </div>
              {msgs.map((msg: any, i: number) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  prevMessage={i > 0 ? msgs[i - 1] : undefined}
                />
              ))}
            </div>
          ))}

          {roomTyping.length > 0 && (
            <div className="px-4 py-2 flex items-center gap-2">
              <div className="flex gap-0.5">
                <span
                  className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span className="text-xs text-zinc-600">
                {roomTyping.map((t) => t.username).join(", ")}{" "}
                {roomTyping.length > 1 ? "are" : "is"} typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <MessageInput roomId={activeRoomId} />
      </div>

      <MembersPanel roomId={activeRoomId} />
      {roomSettingsOpen && <RoomSettingsModal />}
    </div>
  );
}
