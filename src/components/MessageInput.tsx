import { useState, useRef, useCallback } from "react";
import { wsService } from "../services/ws";
import { useTypingIndicator } from "../hooks";

interface Props {
  roomId: number;
}

export default function MessageInput({ roomId }: Props) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { startTyping, stopTyping } = useTypingIndicator(roomId);

  const handleSend = useCallback(async () => {
    const text = content.trim();
    if (!text || sending) return;

    setSending(true);
    stopTyping();
    try {
      // Backend expects { type: "send_message", payload: { room_id, content, type } }
      wsService.send("send_message", {
        room_id: roomId,
        content: text,
        type: "text",
      });
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setSending(false);
    }
  }, [content, roomId, sending, stopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    startTyping();

    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <div className="px-4 pb-4 pt-0 shrink-0">
      <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 focus-within:border-zinc-600 transition-colors">
        <button className="shrink-0 p-1 text-zinc-500 hover:text-zinc-300 transition-colors mb-0.5">
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
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 resize-none focus:outline-none max-h-40 py-1"
        />

        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="shrink-0 p-1.5 rounded-lg bg-white text-black disabled:opacity-20 disabled:bg-zinc-700 disabled:text-zinc-500 hover:bg-zinc-200 transition-all mb-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
