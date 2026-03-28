import { useState, useRef, useCallback } from "react";
import { wsService } from "../services/ws";
import { useTypingIndicator } from "../hooks";
import { useUIStore } from "../stores";

interface Props {
  roomId: number;
}

export default function MessageInput({ roomId }: Props) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<
    {
      file_name: string;
      file_url: string;
      file_type: string;
      file_size: number;
    }[]
  >([]);
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [attUrl, setAttUrl] = useState("");
  const [attName, setAttName] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { startTyping, stopTyping } = useTypingIndicator(roomId);
  const { replyTo, setReplyTo } = useUIStore();

  const handleSend = useCallback(async () => {
    const text = content.trim();
    if (!text && attachmentUrls.length === 0) return;
    if (sending) return;

    setSending(true);
    stopTyping();
    try {
      wsService.send("send_message", {
        room_id: roomId,
        content: text,
        type: attachmentUrls.length > 0 ? "file" : "text",
        reply_to_id: replyTo?.id || null,
        attachments: attachmentUrls,
      });
      setContent("");
      setReplyTo(null);
      setAttachmentUrls([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } finally {
      setSending(false);
    }
  }, [content, roomId, sending, stopTyping, replyTo, attachmentUrls]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && replyTo) setReplyTo(null);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    startTyping();
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const addAttachment = () => {
    if (!attUrl.trim()) return;
    const fileName = attName.trim() || attUrl.split("/").pop() || "file";
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      pdf: "application/pdf",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
    };
    setAttachmentUrls((prev) => [
      ...prev,
      {
        file_name: fileName,
        file_url: attUrl.trim(),
        file_type: mimeMap[ext] || "application/octet-stream",
        file_size: 0,
      },
    ]);
    setAttUrl("");
    setAttName("");
    setShowAttachmentInput(false);
  };

  const removeAttachment = (index: number) =>
    setAttachmentUrls((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="px-4 pb-4 pt-0 shrink-0">
      {/* Reply bar */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-4 py-2 bg-gray-50 border-2 border-b-0 border-gray-800 rounded-t-xl">
          <div className="w-1 h-8 bg-black rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-500">
              Replying to{" "}
              <span className="text-gray-900 font-bold">
                {replyTo.sender?.name || `User ${replyTo.sender_id}`}
              </span>
            </p>
            <p className="text-xs text-gray-400 truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="shrink-0 text-gray-400 hover:text-gray-900 transition-colors"
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
        </div>
      )}

      {/* Attachment previews */}
      {attachmentUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-4 py-2 bg-gray-50 border-2 border-gray-800 rounded-xl">
          {attachmentUrls.map((att, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 bg-white border-2 border-gray-800 rounded-lg px-2 py-1 text-xs font-medium text-gray-700"
            >
              {att.file_name}
              <button
                onClick={() => removeAttachment(i)}
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
          ))}
        </div>
      )}

      {/* Attachment URL input */}
      {showAttachmentInput && (
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={attName}
            onChange={(e) => setAttName(e.target.value)}
            placeholder="File name"
            className="flex-1 bg-white border-2 border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:ring-0"
          />
          <input
            type="text"
            value={attUrl}
            onChange={(e) => setAttUrl(e.target.value)}
            placeholder="File URL"
            onKeyDown={(e) => e.key === "Enter" && addAttachment()}
            className="flex-[2] bg-white border-2 border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:ring-0"
          />
          <button
            onClick={addAttachment}
            className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg border-2 border-black"
          >
            Add
          </button>
          <button
            onClick={() => setShowAttachmentInput(false)}
            className="px-2 text-gray-400 hover:text-gray-900"
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
        </div>
      )}

      <div
        className={`flex items-end gap-2 bg-white border-2 border-gray-800 px-4 py-2.5 shadow-[3px_3px_0px] shadow-gray-800 ${replyTo ? "rounded-b-xl" : "rounded-xl"}`}
      >
        <button
          onClick={() => setShowAttachmentInput(!showAttachmentInput)}
          className="shrink-0 p-1 text-gray-400 hover:text-gray-900 transition-colors mb-0.5"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={replyTo ? "Type your reply..." : "Type a message..."}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none max-h-40 py-1"
        />

        <button
          onClick={handleSend}
          disabled={(!content.trim() && attachmentUrls.length === 0) || sending}
          className="shrink-0 p-1.5 rounded-lg bg-black text-white disabled:opacity-20 hover:bg-gray-800 transition-all mb-0.5 border-2 border-black disabled:border-gray-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
