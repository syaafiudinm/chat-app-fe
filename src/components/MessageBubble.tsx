import { useState } from "react";
import type { Message } from "../types";
import { useAuthStore, useMessageStore } from "../stores";
import Avatar from "./Avatar";
import { formatMessageTime, shouldGroupMessages } from "../utils";
import * as api from "../services/api";

interface Props {
  message: Message;
  prevMessage?: Message;
}

export default function MessageBubble({ message, prevMessage }: Props) {
  const { user } = useAuthStore();
  const { updateMessage, removeMessage } = useMessageStore();
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isOwn = message.sender_id === user?.id;
  const isGrouped = shouldGroupMessages(prevMessage, message);

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setEditing(false);
      return;
    }
    try {
      const updated = await api.updateMessage(message.id, editContent.trim());
      updateMessage(message.room_id, updated);
      setEditing(false);
    } catch (err) {
      console.error("Failed to edit:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteMessage(message.id);
      removeMessage(message.room_id, message.id);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const senderName = message.sender?.name || `User ${message.sender_id}`;

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-0.5 hover:bg-zinc-900/50 transition-colors relative ${
        isGrouped ? "" : "mt-3"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="w-10 shrink-0 flex justify-center">
        {!isGrouped && (
          <Avatar
            name={senderName}
            avatarUrl={message.sender?.avatar}
            userId={message.sender_id}
            size="sm"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span
              className={`text-sm font-semibold ${isOwn ? "text-white" : "text-zinc-300"}`}
            >
              {senderName}
            </span>
            <span className="text-[10px] text-zinc-600">
              {formatMessageTime(message.created_at)}
            </span>
            {message.is_edited && (
              <span className="text-[10px] text-zinc-700">(edited)</span>
            )}
          </div>
        )}

        {editing ? (
          <div className="space-y-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEdit();
                }
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-500"
              autoFocus
            />
            <div className="flex gap-2 text-[11px]">
              <span className="text-zinc-500">
                escape to{" "}
                <button
                  onClick={() => setEditing(false)}
                  className="text-zinc-300 hover:underline"
                >
                  cancel
                </button>
                {" · "}
                enter to{" "}
                <button
                  onClick={handleEdit}
                  className="text-zinc-300 hover:underline"
                >
                  save
                </button>
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        )}
      </div>

      {isGrouped && showActions && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-700 pointer-events-none">
          {formatMessageTime(message.created_at)}
        </span>
      )}

      {showActions && !editing && (
        <div className="absolute -top-3 right-4 flex items-center bg-zinc-900 border border-zinc-800 rounded-md shadow-lg overflow-hidden">
          {isOwn && (
            <>
              <button
                onClick={() => {
                  setEditContent(message.content);
                  setEditing(true);
                }}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Edit"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                title="Delete"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
