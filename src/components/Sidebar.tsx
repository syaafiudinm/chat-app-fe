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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getDMName = (room: any): string => {
    if (room.type !== "private") return room.name;
    if (room.members && room.members.length > 0) {
      const other = room.members.find((m: any) => m.user_id !== user?.id);
      if (other?.user?.name) return other.user.name;
      if (other) {
        const cached = getUser(other.user_id);
        if (cached) return cached.name;
      }
    }
    const lastMsg = getLastMessage(room);
    if (lastMsg?.sender_name && lastMsg.sender_name !== user?.name)
      return lastMsg.sender_name;
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
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:relative z-40 h-full flex flex-col bg-white border-r-2 border-gray-800 transition-transform duration-200",
          "w-72 md:w-72 lg:w-80",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b-2 border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center">
              <span className="text-white font-black text-sm">#</span>
            </div>
            <h1 className="text-gray-900 font-black tracking-tight">Chats</h1>
            <span
              className={cn(
                "w-2 h-2 rounded-full border border-gray-800",
                wsConnected ? "bg-emerald-400" : "bg-red-400",
              )}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-800 bg-white hover:bg-gray-100 text-gray-800 shadow-[2px_2px_0px] shadow-gray-800 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px] active:shadow-gray-800 transition-all duration-150"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
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
                <div className="absolute right-0 top-10 z-50 bg-white border-2 border-gray-800 rounded-xl shadow-[3px_3px_0px] shadow-gray-800 py-1 w-48">
                  <button
                    onClick={() => {
                      setShowNewMenu(false);
                      setShowDMModal(true);
                    }}
                    className="w-full px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
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
                    className="w-full px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
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
        <div className="px-3 py-2.5 shrink-0">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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
              placeholder="Search..."
              className="w-full bg-white border-2 border-gray-800 rounded-lg py-1.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900 transition-colors"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1">
          {filteredRooms.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm font-medium">
              {search ? "No results found" : "No conversations yet"}
            </div>
          )}
          {filteredRooms.map((room) => {
            const lastMsg = getLastMessage(room);
            const displayName = getDMName(room);
            const isActive = activeRoomId === room.id;
            return (
              <button
                key={room.id}
                onClick={() => {
                  setActiveRoom(room.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 mb-1",
                  isActive
                    ? "bg-black text-white shadow-none translate-x-0"
                    : "bg-white text-gray-700 border-2 border-transparent hover:border-gray-800 hover:shadow-[2px_2px_0px] hover:shadow-gray-800",
                )}
              >
                <Avatar
                  name={displayName}
                  size="md"
                  showOnline={room.type === "private"}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm truncate">
                      {room.type === "group" && (
                        <span
                          className={
                            isActive ? "text-gray-400" : "text-gray-400"
                          }
                        >
                          #{" "}
                        </span>
                      )}
                      {displayName}
                    </span>
                    {lastMsg && (
                      <span
                        className={cn(
                          "text-[10px] shrink-0 ml-2",
                          isActive ? "text-gray-400" : "text-gray-400",
                        )}
                      >
                        {formatTime(lastMsg.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p
                      className={cn(
                        "text-xs truncate",
                        isActive ? "text-gray-400" : "text-gray-500",
                      )}
                    >
                      {lastMsg
                        ? `${lastMsg.sender_name}: ${lastMsg.content}`
                        : "No messages yet"}
                    </p>
                    {(room.unread_count || 0) > 0 && (
                      <span
                        className={cn(
                          "shrink-0 ml-2 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2",
                          isActive
                            ? "bg-white text-black border-white"
                            : "bg-black text-white border-black",
                        )}
                      >
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
        <div className="h-14 px-3 flex items-center gap-3 border-t-2 border-gray-800 shrink-0 bg-white">
          <Avatar
            name={user?.name || "?"}
            avatarUrl={user?.avatar}
            userId={user?.id}
            size="sm"
            showOnline
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => setProfileModalOpen(true)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            title="Settings"
          >
            <svg
              width="15"
              height="15"
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
            onClick={() => setShowLogoutConfirm(true)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
            title="Log out"
          >
            <svg
              width="15"
              height="15"
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

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white border-2 border-gray-800 rounded-xl w-full max-w-xs mx-4 overflow-hidden shadow-[4px_4px_0px] shadow-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-red-50 border-2 border-red-300 rounded-xl flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-red-500"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-1">
                Log out?
              </h3>
              <p className="text-sm text-gray-500">
                You'll need to sign in again to continue.
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-sm font-bold text-gray-700 bg-white border-2 border-gray-800 rounded-lg shadow-[2px_2px_0px] shadow-gray-800 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px] active:shadow-gray-800 transition-all duration-150"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 border-2 border-red-600 rounded-lg shadow-[2px_2px_0px] shadow-red-700 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px] active:shadow-red-700 transition-all duration-150"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
