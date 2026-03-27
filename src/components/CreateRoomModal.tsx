import { useState, useEffect } from 'react';
import * as api from '../services/api';
import { useRoomStore, useAuthStore } from '../stores';
import Avatar from './Avatar';
import type { User } from '../types';

interface Props {
  onClose: () => void;
}

export default function CreateRoomModal({ onClose }: Props) {
  const { addRoom, setActiveRoom } = useRoomStore();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [roomType, setRoomType] = useState<'group' | 'private'>('group');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getUsers(1, 50).then((res) => {
      const data = Array.isArray(res) ? res : [];
      setUsers(data);
    }).catch(() => {});
  }, []);

  // Filter out current user — backend auto-adds creator as admin
  const filtered = users.filter(
    (u) =>
      u.id !== user?.id &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleUser = (id: number) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Add at least one member');
      return;
    }
    setLoading(true);
    setError('');
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
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Create Room</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. general"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this room about?"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setRoomType(roomType === 'group' ? 'private' : 'group')}
              className={`w-10 h-5 rounded-full transition-colors ${
                roomType === 'group' ? 'bg-white' : 'bg-zinc-700'
              } relative`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                  roomType === 'group' ? 'left-5 bg-black' : 'left-0.5 bg-zinc-400'
                }`}
              />
            </div>
            <span className="text-sm text-zinc-300">Group chat</span>
          </label>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Add Members
            </label>

            {/* Selected chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedUsers.map((id) => {
                  const u = users.find((x) => x.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md"
                    >
                      {u?.name || `User ${id}`}
                      <button onClick={() => toggleUser(id)} className="text-zinc-500 hover:text-red-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 mb-2"
            />
            <div className="max-h-32 overflow-y-auto space-y-1">
              {filtered.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="accent-white"
                  />
                  <Avatar name={u.name} avatarUrl={u.avatar} size="sm" />
                  <span className="text-sm text-zinc-300">{u.name}</span>
                  <span className="text-xs text-zinc-600">{u.email}</span>
                </label>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-2">No users found</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}