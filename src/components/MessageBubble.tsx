import { useState } from "react";
import type { Message } from "../types";
import {
  useAuthStore,
  useMessageStore,
  useUIStore,
  useUserCacheStore,
} from "../stores";
import Avatar from "./Avatar";
import AttachmentPreview from "./AttachmentPreview";
import ReadReceipts from "./ReadReceipts";
import { formatMessageTime, shouldGroupMessages } from "../utils";
import * as api from "../services/api";

interface Props {
  message: Message;
  prevMessage?: Message;
  isLastOwnMessage?: boolean;
}

export default function MessageBubble({
  message,
  prevMessage,
  isLastOwnMessage,
}: Props) {
  const { user } = useAuthStore();
  const { updateMessage, removeMessage } = useMessageStore();
  const { setReplyTo } = useUIStore();
  const { getUser } = useUserCacheStore();
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showReads, setShowReads] = useState(false);

  const isOwn = message.sender_id === user?.id;
  const isGrouped = shouldGroupMessages(prevMessage, message);

  const cachedSender = getUser(message.sender_id);
  const senderName =
    message.sender?.name || cachedSender?.name || `User ${message.sender_id}`;
  const senderAvatar = message.sender?.avatar || cachedSender?.avatar;

  // Read receipts — exclude self
  const reads = (message.reads || []).filter(
    (r) => r.user_id !== message.sender_id,
  );
  const readCount = reads.length;

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

  const replySenderName =
    message.reply_to?.sender?.name ||
    (message.reply_to?.sender_id
      ? getUser(message.reply_to.sender_id)?.name ||
        `User ${message.reply_to.sender_id}`
      : "");

  return (
    <>
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
              avatarUrl={senderAvatar}
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

          {/* Reply reference */}
          {message.reply_to && (
            <div className="flex items-center gap-2 mb-1 pl-2 border-l-2 border-zinc-700">
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500 font-medium">
                  {replySenderName}
                </p>
                <p className="text-xs text-zinc-600 truncate max-w-md">
                  {message.reply_to.content}
                </p>
              </div>
            </div>
          )}

          {message.reply_to_id && !message.reply_to && (
            <div className="flex items-center gap-2 mb-1 pl-2 border-l-2 border-zinc-700">
              <p className="text-[11px] text-zinc-600 italic">
                Replying to a message
              </p>
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
              <div className="text-[11px] text-zinc-500">
                escape to{" "}
                <button
                  onClick={() => setEditing(false)}
                  className="text-zinc-300 hover:underline"
                >
                  cancel
                </button>
                {" · "}enter to{" "}
                <button
                  onClick={handleEdit}
                  className="text-zinc-300 hover:underline"
                >
                  save
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.content && (
                <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </p>
              )}
              <AttachmentPreview attachments={message.attachments || []} />
            </>
          )}

          {/* Seen indicator — only show on own messages */}
          {isOwn && !editing && (
            <div className="flex items-center gap-1 mt-0.5">
              {readCount > 0 ? (
                <button
                  onClick={() => setShowReads(true)}
                  className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  {/* Double check icon */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-emerald-500"
                  >
                    <polyline points="18 7 9.5 15.5 6 12" />
                    <polyline points="22 7 13.5 15.5 12 14" />
                  </svg>
                  <span>Seen by {readCount}</span>
                </button>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-zinc-700">
                  {/* Single check icon */}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Sent
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hover time for grouped */}
        {isGrouped && showActions && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-700 pointer-events-none">
            {formatMessageTime(message.created_at)}
          </span>
        )}

        {/* Action buttons */}
        {showActions && !editing && (
          <div className="absolute -top-3 right-4 flex items-center bg-zinc-900 border border-zinc-800 rounded-md shadow-lg overflow-hidden">
            <button
              onClick={() => setReplyTo(message)}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Reply"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
            </button>
            <button
              onClick={() => setShowReads(true)}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Read by"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
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

      {showReads && (
        <ReadReceipts
          messageId={message.id}
          onClose={() => setShowReads(false)}
        />
      )}
    </>
  );
}
