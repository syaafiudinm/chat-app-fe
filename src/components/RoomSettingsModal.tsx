import { useState, useEffect } from "react";
import {
  useRoomStore,
  useAuthStore,
  useUIStore,
  useUserCacheStore,
} from "../stores";
import * as api from "../services/api";
import Avatar from "./Avatar";
import type { RoomMember, User } from "../types";

export default function RoomSettingsModal() {
  const { rooms, activeRoomId, updateRoom, removeRoom } = useRoomStore();
  const { user } = useAuthStore();
  const { setRoomSettingsOpen } = useUIStore();
  const { getUser } = useUserCacheStore();

  const room = rooms.find((r) => r.id === activeRoomId);
  const [tab, setTab] = useState<"general" | "members">("general");
  const [name, setName] = useState(room?.name || "");
  const [description, setDescription] = useState(room?.description || "");
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [addSearch, setAddSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = room?.created_by === user?.id;

  useEffect(() => {
    if (!activeRoomId) return;
    api.getRoomMembers(activeRoomId).then((res) => {
      setMembers(Array.isArray(res) ? res : []);
    });
    api.getUsers(1, 100).then((res) => {
      setAllUsers(Array.isArray(res) ? res : []);
    });
  }, [activeRoomId]);

  const memberIds = members.map((m) => m.user_id);
  const nonMembers = allUsers.filter(
    (u) =>
      !memberIds.includes(u.id) &&
      u.name.toLowerCase().includes(addSearch.toLowerCase()),
  );

  const handleSave = async () => {
    if (!activeRoomId) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const updated = await api.updateRoom(activeRoomId, {
        name: name.trim(),
        description: description.trim(),
      });
      updateRoom(updated);
      setSuccess("Room updated");
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeRoomId || !confirm("Delete this room? This cannot be undone."))
      return;
    try {
      await api.deleteRoom(activeRoomId);
      removeRoom(activeRoomId);
      setRoomSettingsOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    }
  };

  const handleAddMember = async (userId: number) => {
    if (!activeRoomId) return;
    try {
      const member = await api.addRoomMember(activeRoomId, userId);
      setMembers((prev) => [...prev, member]);
      setAddSearch("");
    } catch (err: any) {
      setError(err.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!activeRoomId) return;
    try {
      await api.removeRoomMember(activeRoomId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err: any) {
      setError(err.message || "Failed to remove member");
    }
  };

  if (!room) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={() => setRoomSettingsOpen(false)}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg mx-4 overflow-hidden max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-white">Room Settings</h2>
          <button
            onClick={() => setRoomSettingsOpen(false)}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-zinc-800 shrink-0">
          <button
            onClick={() => {
              setTab("general");
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "general"
                ? "text-white border-b-2 border-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            General
          </button>
          <button
            onClick={() => {
              setTab("members");
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "members"
                ? "text-white border-b-2 border-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Members ({members.length})
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-emerald-400 text-sm">
              {success}
            </div>
          )}

          {tab === "general" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Room Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isOwner}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isOwner}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50 resize-none"
                />
              </div>
              <div className="text-xs text-zinc-600 space-y-1">
                <p>Type: {room.type}</p>
                <p>Created: {new Date(room.created_at).toLocaleDateString()}</p>
                {!isOwner && (
                  <p className="text-zinc-500">
                    Only the room owner can edit settings.
                  </p>
                )}
              </div>
              {isOwner && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-white text-black text-sm font-semibold py-2 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    Delete Room
                  </button>
                </>
              )}
            </>
          )}

          {tab === "members" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Add Member
                </label>
                <input
                  type="text"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                {addSearch && nonMembers.length > 0 && (
                  <div className="mt-1 max-h-32 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-lg">
                    {nonMembers.slice(0, 10).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleAddMember(u.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 text-left transition-colors"
                      >
                        <Avatar name={u.name} avatarUrl={u.avatar} size="sm" />
                        <span className="text-sm text-zinc-300">{u.name}</span>
                        <span className="text-xs text-zinc-600">{u.email}</span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="ml-auto text-zinc-500"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Current Members
                </p>
                {members.map((m) => {
                  const cached = getUser(m.user_id);
                  const memberName =
                    m.user?.name || cached?.name || `User ${m.user_id}`;
                  const memberAvatar = m.user?.avatar || cached?.avatar;
                  const isMe = m.user_id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-zinc-800/50"
                    >
                      <Avatar
                        name={memberName}
                        avatarUrl={memberAvatar}
                        userId={m.user_id}
                        size="sm"
                        showOnline
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate">
                          {memberName}{" "}
                          {isMe && <span className="text-zinc-600">(you)</span>}
                        </p>
                        <p className="text-[10px] text-zinc-600 capitalize">
                          {m.role}
                        </p>
                      </div>
                      {!isMe && isOwner && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                          title="Remove"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
