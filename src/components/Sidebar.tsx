import { useState } from "react";
import {
  useRoomStore,
  useAuthStore,
  useUIStore,
  useMessageStore,
  useUserCacheStore,
} from "../stores";
import Avatar from "./Avatar";
import { formatTime, cn } from "../utils";
import CreateRoomModal from "./CreateRoomModal";
import NewDMModal from "./NewDMModal";
import ProfileModal from "./ProfileModal";

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { rooms, activeRoomId, setActiveRoom } = useRoomStore();
  const {
    sidebarOpen,
    setSidebarOpen,
    wsConnected,
    profileModalOpen,
    setProfileModalOpen,
  } = useUIStore();
  const { messages } = useMessageStore();
  const { getUser } = useUserCacheStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [search, setSearch] = useState("");

  const getDMName = (room: any): string => {
    if (room.type !== "private") return room.name;

    // From room members if available
    if (room.members && room.members.length > 0) {
      const other = room.members.find((m: any) => m.user_id !== user?.id);
      if (other?.user?.name) return other.user.name;
      if (other) {
        const cached = getUser(other.user_id);
        if (cached) return cached.name;
      }
    }

    // From last message sender (if sender is not me, that's the other person)
    const lastMsg = getLastMessage(room);
    if (lastMsg?.sender_name && lastMsg.sender_name !== user?.name) {
      return lastMsg.sender_name;
    }

    return room.name;
  };

  const getLastMessage = (room: any) => {
    if (room.last_message) {
      return {
        content: room.last_message.content,
        sender_name: room.last_message.sender_name || "",
        created_at: room.last_message.created_at,
      };
    }
    const roomMsgs = messages.get(room.id);
    if (roomMsgs && roomMsgs.length > 0) {
      const last = roomMsgs[roomMsgs.length - 1];
      const sender = last.sender?.name || getUser(last.sender_id)?.name || "";
      return {
        content: last.content,
        sender_name: sender,
        created_at: last.created_at,
      };
    }
    return null;
  };

  const filteredRooms = rooms.filter((r) => {
    const name = r.type === "private" ? getDMName(r) : r.name;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:relative z-40 h-full flex flex-col bg-zinc-950 border-r border-zinc-800/50 transition-transform duration-200",
          "w-72 md:w-72 lg:w-80",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
              <span className="text-black font-black text-sm">#</span>
            </div>
            <h1 className="text-white font-bold tracking-tight">Chats</h1>
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                wsConnected ? "bg-emerald-500" : "bg-red-500",
              )}
              title={wsConnected ? "Connected" : "Disconnected"}
            />
          </div>

          {/* New chat dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="New chat"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>

            {showNewMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNewMenu(false)}
                />
                <div className="absolute right-0 top-10 z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 w-44">
                  <button
                    onClick={() => {
                      setShowNewMenu(false);
                      setShowDMModal(true);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Direct Message
                  </button>
                  <button
                    onClick={() => {
                      setShowNewMenu(false);
                      setShowCreateModal(true);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <svg
                      width="16"
                      height="16"
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
                    Group Chat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 shrink-0">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 pl-9 pr-3 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-1">
          {filteredRooms.length === 0 && (
            <div className="text-center py-8 text-zinc-600 text-sm">
              {search ? "No rooms found" : "No conversations yet"}
            </div>
          )}
          {filteredRooms.map((room) => {
            const lastMsg = getLastMessage(room);
            const displayName = getDMName(room);
            return (
              <button
                key={room.id}
                onClick={() => {
                  setActiveRoom(room.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group mb-0.5",
                  activeRoomId === room.id
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
                )}
              >
                <Avatar
                  name={displayName}
                  size="md"
                  showOnline={room.type === "private"}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">
                      {room.type === "group" && (
                        <span className="text-zinc-500 mr-1">#</span>
                      )}
                      {displayName}
                    </span>
                    {lastMsg && (
                      <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                        {formatTime(lastMsg.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-zinc-600 truncate">
                      {lastMsg
                        ? `${lastMsg.sender_name}: ${lastMsg.content}`
                        : "No messages yet"}
                    </p>
                    {(room.unread_count || 0) > 0 && (
                      <span className="shrink-0 ml-2 bg-white text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {room.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="h-14 px-3 flex items-center gap-3 border-t border-zinc-800/50 shrink-0 bg-zinc-950">
          <Avatar
            name={user?.name || "?"}
            avatarUrl={user?.avatar}
            userId={user?.id}
            size="sm"
            showOnline
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => setProfileModalOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
            title="Settings"
          >
            <svg
              width="16"
              height="16"
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
            onClick={logout}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
            title="Log out"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}
      {showDMModal && <NewDMModal onClose={() => setShowDMModal(false)} />}
      {profileModalOpen && <ProfileModal />}
    </>
  );
}
