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
      .then((res) => {
        const data = Array.isArray(res) ? res : [];
        setUsers(data);
      })
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
      // Add to room list if not already there
      if (!rooms.find((r) => r.id === room.id)) {
        addRoom(room);
      }
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">New Message</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Select a user to start a conversation
          </p>
        </div>

        <div className="px-5 py-3">
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
              placeholder="Search users..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto px-3 pb-3">
          {filtered.length === 0 && (
            <p className="text-sm text-zinc-600 text-center py-6">
              No users found
            </p>
          )}
          {filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => handleSelectUser(u.id)}
              disabled={loading === u.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left disabled:opacity-50"
            >
              <Avatar
                name={u.name}
                avatarUrl={u.avatar}
                userId={u.id}
                size="md"
                showOnline
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {u.name}
                </p>
                <p className="text-xs text-zinc-600 truncate">{u.email}</p>
              </div>
              {loading === u.id && (
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-white rounded-full animate-spin shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
