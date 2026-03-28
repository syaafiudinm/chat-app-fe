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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isOwner = room?.created_by === user?.id;

  useEffect(() => {
    if (!activeRoomId) return;
    api
      .getRoomMembers(activeRoomId)
      .then((res) => setMembers(Array.isArray(res) ? res : []));
    api
      .getUsers(1, 100)
      .then((res) => setAllUsers(Array.isArray(res) ? res : []));
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
    if (!activeRoomId) return;
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
      setMembers((p) => [...p, member]);
      setAddSearch("");
    } catch (err: any) {
      setError(err.message || "Failed to add");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!activeRoomId) return;
    try {
      await api.removeRoomMember(activeRoomId, userId);
      setMembers((p) => p.filter((m) => m.user_id !== userId));
    } catch (err: any) {
      setError(err.message || "Failed to remove");
    }
  };

  if (!room) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={() => setRoomSettingsOpen(false)}
    >
      <div
        className="bg-white border-2 border-gray-800 rounded-xl w-full max-w-lg mx-4 overflow-hidden max-h-[80vh] flex flex-col shadow-[4px_4px_0px] shadow-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b-2 border-gray-800 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-black text-gray-900">Room Settings</h2>
          <button
            onClick={() => setRoomSettingsOpen(false)}
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex border-b-2 border-gray-800 shrink-0">
          {(["general", "members"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-2.5 text-sm font-bold capitalize transition-colors ${tab === t ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400 hover:text-gray-700"}`}
            >
              {t === "members" ? `Members (${members.length})` : t}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg px-4 py-2 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg px-4 py-2 text-emerald-600 text-sm font-medium">
              {success}
            </div>
          )}

          {tab === "general" && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Room Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isOwner}
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-0 focus:border-gray-900 disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isOwner}
                  rows={3}
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-0 focus:border-gray-900 disabled:opacity-50 disabled:bg-gray-50 resize-none"
                />
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  Type: <span className="font-bold">{room.type}</span>
                </p>
                <p>
                  Created:{" "}
                  <span className="font-bold">
                    {new Date(room.created_at).toLocaleDateString()}
                  </span>
                </p>
                {!isOwner && (
                  <p className="text-gray-400">
                    Only the room owner can edit settings.
                  </p>
                )}
              </div>
              {isOwner && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-black text-white text-sm font-bold py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px] shadow-gray-800 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px] active:shadow-gray-800 disabled:opacity-50 transition-all duration-150"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full bg-white text-red-500 text-sm font-bold py-2 rounded-lg border-2 border-red-300 hover:bg-red-50 transition-colors"
                    >
                      Delete Room
                    </button>
                  ) : (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 space-y-3">
                      <p className="text-sm text-red-600 font-bold">
                        Are you sure? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 text-sm font-bold text-gray-700 bg-white border-2 border-gray-800 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          className="flex-1 py-2 text-sm font-bold text-white bg-red-500 border-2 border-red-600 rounded-lg shadow-[2px_2px_0px] shadow-red-700 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all duration-150"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {tab === "members" && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Add Member
                </label>
                <input
                  type="text"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900"
                />
                {addSearch && nonMembers.length > 0 && (
                  <div className="mt-1 max-h-32 overflow-y-auto bg-white border-2 border-gray-800 rounded-lg">
                    {nonMembers.slice(0, 10).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleAddMember(u.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
                      >
                        <Avatar name={u.name} avatarUrl={u.avatar} size="sm" />
                        <span className="text-sm font-medium text-gray-700">
                          {u.name}
                        </span>
                        <span className="text-xs text-gray-400">{u.email}</span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="ml-auto text-gray-400"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
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
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50"
                    >
                      <Avatar
                        name={memberName}
                        avatarUrl={memberAvatar}
                        userId={m.user_id}
                        size="sm"
                        showOnline
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 font-medium truncate">
                          {memberName}{" "}
                          {isMe && <span className="text-gray-400">(you)</span>}
                        </p>
                        <p className="text-[10px] text-gray-400 capitalize font-bold">
                          {m.role}
                        </p>
                      </div>
                      {!isMe && isOwner && (
                        <button
                          onClick={() => handleRemoveMember(m.user_id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
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
