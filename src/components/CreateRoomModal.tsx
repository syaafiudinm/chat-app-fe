import { useState, useEffect } from "react";
import * as api from "../services/api";
import { useRoomStore, useAuthStore } from "../stores";
import Avatar from "./Avatar";
import type { User } from "../types";

interface Props {
  onClose: () => void;
}

export default function CreateRoomModal({ onClose }: Props) {
  const { addRoom, setActiveRoom } = useRoomStore();
  const { user } = useAuthStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState<"group" | "private">("group");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getUsers(1, 50)
      .then((res) => setUsers(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  const filtered = users.filter(
    (u) =>
      u.id !== user?.id &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  );
  const toggleUser = (id: number) =>
    setSelectedUsers((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Room name is required");
      return;
    }
    if (selectedUsers.length === 0) {
      setError("Add at least one member");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const room = await api.createRoom({
        name: name.trim(),
        description: description.trim() || undefined,
        type: roomType,
        member_ids: selectedUsers,
      });
      addRoom(room);
      setActiveRoom(room.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-gray-800 rounded-xl w-full max-w-md mx-4 overflow-hidden shadow-[4px_4px_0px] shadow-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b-2 border-gray-800">
          <h2 className="text-lg font-black text-gray-900">Create Room</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg px-4 py-2 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. general"
              autoFocus
              className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this room about?"
              className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() =>
                setRoomType(roomType === "group" ? "private" : "group")
              }
              className={`w-10 h-5 rounded-full border-2 border-gray-800 transition-colors ${roomType === "group" ? "bg-black" : "bg-gray-200"} relative`}
            >
              <div
                className={`absolute top-0 w-4 h-4 rounded-full transition-all border border-gray-800 ${roomType === "group" ? "left-5 bg-white" : "left-0 bg-white"}`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              Group chat
            </span>
          </label>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Add Members
            </label>
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedUsers.map((id) => {
                  const u = users.find((x) => x.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 bg-gray-100 border-2 border-gray-800 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-lg"
                    >
                      {u?.name || `User ${id}`}
                      <button
                        onClick={() => toggleUser(id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900 mb-2"
            />
            <div className="max-h-32 overflow-y-auto space-y-1">
              {filtered.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="accent-black w-4 h-4"
                  />
                  <Avatar name={u.name} avatarUrl={u.avatar} size="sm" />
                  <span className="text-sm font-medium text-gray-700">
                    {u.name}
                  </span>
                  <span className="text-xs text-gray-400">{u.email}</span>
                </label>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  No users found
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t-2 border-gray-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-black text-white text-sm font-bold rounded-lg border-2 border-black shadow-[3px_3px_0px] shadow-gray-800 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px] active:shadow-gray-800 disabled:opacity-50 transition-all duration-150"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
