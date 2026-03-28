import { useState, useEffect } from "react";
import { useUIStore, useUserCacheStore } from "../stores";
import Avatar from "./Avatar";
import * as api from "../services/api";
import type { RoomMember } from "../types";

interface Props {
  roomId: number;
}

export default function MembersPanel({ roomId }: Props) {
  const { membersPanelOpen, toggleMembersPanel, onlineUsers } = useUIStore();
  const { getUser } = useUserCacheStore();
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!membersPanelOpen) return;
    setLoading(true);
    api
      .getRoomMembers(roomId)
      .then((res) => setMembers(Array.isArray(res) ? res : []))
      .finally(() => setLoading(false));
  }, [roomId, membersPanelOpen]);

  if (!membersPanelOpen) return null;

  const online = members.filter((m) => onlineUsers.has(m.user_id));
  const offline = members.filter((m) => !onlineUsers.has(m.user_id));

  return (
    <aside className="w-60 h-full border-l-2 border-gray-800 bg-white flex flex-col shrink-0">
      <div className="h-14 px-4 flex items-center justify-between border-b-2 border-gray-800 shrink-0">
        <h3 className="text-sm font-black text-gray-900">Members</h3>
        <button
          onClick={toggleMembersPanel}
          className="text-gray-400 hover:text-gray-900 transition-colors"
        >
          <svg
            width="16"
            height="16"
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
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {loading && (
          <div className="text-gray-400 text-sm text-center py-4">
            Loading...
          </div>
        )}
        {[
          { label: "Online", list: online },
          { label: "Offline", list: offline },
        ].map(
          ({ label, list }) =>
            list.length > 0 && (
              <div key={label}>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 px-1">
                  {label} — {list.length}
                </p>
                {list.map((m) => {
                  const cached = getUser(m.user_id);
                  const name =
                    m.user?.name || cached?.name || `User ${m.user_id}`;
                  const avatar = m.user?.avatar || cached?.avatar;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Avatar
                        name={name}
                        avatarUrl={avatar}
                        userId={m.user_id}
                        size="sm"
                        showOnline
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 font-medium truncate">
                          {name}
                        </p>
                        {m.role !== "member" && (
                          <p className="text-[10px] text-gray-400 capitalize font-bold">
                            {m.role}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ),
        )}
      </div>
    </aside>
  );
}
