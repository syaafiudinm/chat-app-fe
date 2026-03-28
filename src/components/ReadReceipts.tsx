import { useState, useEffect } from "react";
import * as api from "../services/api";
import { useUserCacheStore } from "../stores";
import type { MessageRead } from "../types";
import Avatar from "./Avatar";

interface Props {
  messageId: number;
  onClose: () => void;
}

export default function ReadReceipts({ messageId, onClose }: Props) {
  const [reads, setReads] = useState<MessageRead[]>([]);
  const [loading, setLoading] = useState(true);
  const { getUser } = useUserCacheStore();

  useEffect(() => {
    api
      .getMessageReads(messageId)
      .then((res) => setReads(Array.isArray(res) ? res : []))
      .finally(() => setLoading(false));
  }, [messageId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-gray-800 rounded-xl w-full max-w-sm mx-4 overflow-hidden shadow-[4px_4px_0px] shadow-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b-2 border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900">Read by</h3>
          <button
            onClick={onClose}
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
        <div className="max-h-64 overflow-y-auto p-3">
          {loading && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            </div>
          )}
          {!loading && reads.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6 font-medium">
              No one has read this yet
            </p>
          )}
          {reads.map((read) => {
            const cached = getUser(read.user_id);
            const name =
              read.user?.name || cached?.name || `User ${read.user_id}`;
            const avatar = read.user?.avatar || cached?.avatar;
            return (
              <div
                key={read.id}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50"
              >
                <Avatar
                  name={name}
                  avatarUrl={avatar}
                  userId={read.user_id}
                  size="sm"
                  showOnline
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 font-medium truncate">
                    {name}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 font-bold">
                  {new Date(read.read_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
