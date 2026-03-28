import { useState, useEffect } from "react";
import * as api from "../services/api";
import { useRoomStore, useAuthStore, useUIStore } from "../stores";
import Avatar from "./Avatar";
import type { User } from "../types";

interface Props {
  onClose: () => void;
}

export default function NewDMModal({ onClose }: Props) {
  const { user } = useAuthStore();
  const { addRoom, setActiveRoom, rooms } = useRoomStore();
  const { setSidebarOpen } = useUIStore();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<number | null>(null);

  useEffect(() => {
    api
      .getUsers(1, 100)
      .then((res) => setUsers(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  const filtered = users.filter(
    (u) =>
      u.id !== user?.id &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  );

  const handleSelectUser = async (targetUserId: number) => {
    setLoading(targetUserId);
    try {
      const room = await api.createOrGetDM(targetUserId);
      if (!rooms.find((r) => r.id === room.id)) addRoom(room);
      setActiveRoom(room.id);
      setSidebarOpen(false);
      onClose();
    } catch (err: any) {
      console.error("Failed to create DM:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-gray-800 rounded-xl w-full max-w-sm mx-4 overflow-hidden shadow-[4px_4px_0px] shadow-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b-2 border-gray-800">
          <h2 className="text-lg font-black text-gray-900">New Message</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Select a user to start a conversation
          </p>
        </div>

        <div className="px-5 py-3">
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
              placeholder="Search users..."
              autoFocus
              className="w-full bg-white border-2 border-gray-800 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto px-3 pb-3">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6 font-medium">
              No users found
            </p>
          )}
          {filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => handleSelectUser(u.id)}
              disabled={loading === u.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left disabled:opacity-50 border-2 border-transparent hover:border-gray-800 mb-1"
            >
              <Avatar
                name={u.name}
                avatarUrl={u.avatar}
                userId={u.id}
                size="md"
                showOnline
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-700 truncate">
                  {u.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              {loading === u.id && (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="px-5 py-3 border-t-2 border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
