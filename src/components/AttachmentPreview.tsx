import type { Attachment } from '../types';
import { formatFileSize, isImageFile, isVideoFile, getFileIcon } from '../utils';

interface Props {
  attachments: Attachment[];
}

export default function AttachmentPreview({ attachments }: Props) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      {attachments.map((att) => {
        if (isImageFile(att.file_type)) {
          return (
            <a
              key={att.id}
              href={att.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-xs rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              <img
                src={att.file_url}
                alt={att.file_name}
                className="max-w-xs max-h-64 object-cover bg-zinc-900"
                loading="lazy"
              />
              <div className="px-2 py-1 bg-zinc-900/80 text-[10px] text-zinc-500 truncate">
                {att.file_name} · {formatFileSize(att.file_size)}
              </div>
            </a>
          );
        }

        if (isVideoFile(att.file_type)) {
          return (
            <div key={att.id} className="max-w-xs rounded-lg overflow-hidden border border-zinc-800">
              <video
                src={att.file_url}
                controls
                className="max-w-xs max-h-64 bg-black"
                preload="metadata"
              />
              <div className="px-2 py-1 bg-zinc-900/80 text-[10px] text-zinc-500 truncate">
                {att.file_name} · {formatFileSize(att.file_size)}
              </div>
            </div>
          );
        }

        // Generic file
        return (
          <a
            key={att.id}
            href={att.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors max-w-xs"
          >
            <span className="text-xl shrink-0">{getFileIcon(att.file_type)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-200 truncate">{att.file_name}</p>
              <p className="text-[10px] text-zinc-500">{formatFileSize(att.file_size)}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 shrink-0">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
        );
      })}
    </div>
  );
}