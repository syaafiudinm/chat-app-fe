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
      .then((res) => {
        const data = Array.isArray(res) ? res : [];
        setMembers(data);
      })
      .finally(() => setLoading(false));
  }, [roomId, membersPanelOpen]);

  if (!membersPanelOpen) return null;

  const online = members.filter((m) => onlineUsers.has(m.user_id));
  const offline = members.filter((m) => !onlineUsers.has(m.user_id));

  return (
    <aside className="w-60 h-full border-l border-zinc-800/50 bg-zinc-950 flex flex-col shrink-0">
      <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <h3 className="text-sm font-semibold text-white">Members</h3>
        <button
          onClick={toggleMembersPanel}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <svg
            width="16"
            height="16"
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

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {loading && (
          <div className="text-zinc-600 text-sm text-center py-4">
            Loading...
          </div>
        )}

        {online.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">
              Online — {online.length}
            </p>
            {online.map((m) => (
              <MemberItem key={m.id} member={m} getUser={getUser} />
            ))}
          </div>
        )}

        {offline.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">
              Offline — {offline.length}
            </p>
            {offline.map((m) => (
              <MemberItem key={m.id} member={m} getUser={getUser} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function MemberItem({
  member,
  getUser,
}: {
  member: RoomMember;
  getUser: (id: number) => any;
}) {
  const cached = getUser(member.user_id);
  const name = member.user?.name || cached?.name || `User ${member.user_id}`;
  const avatar = member.user?.avatar || cached?.avatar;

  return (
    <div className="flex items-center gap-2.5 px-1 py-1.5 rounded-md hover:bg-zinc-900 transition-colors">
      <Avatar
        name={name}
        avatarUrl={avatar}
        userId={member.user_id}
        size="sm"
        showOnline
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 truncate">{name}</p>
        {member.role !== "member" && (
          <p className="text-[10px] text-zinc-600 capitalize">{member.role}</p>
        )}
      </div>
    </div>
  );
}
