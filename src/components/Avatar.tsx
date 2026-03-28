import { getInitials, getAvatarColor } from "../utils";
import { useUIStore } from "../stores";

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  userId?: number;
  size?: "sm" | "md" | "lg";
  showOnline?: boolean;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-20 h-20 text-2xl",
};

const borderMap = {
  sm: "border-[1.5px]",
  md: "border-2",
  lg: "border-2",
};

const dotMap = {
  sm: "w-2.5 h-2.5 -bottom-0 -right-0",
  md: "w-3 h-3 -bottom-0.5 -right-0.5",
  lg: "w-5 h-5 bottom-0 right-0",
};

export default function Avatar({
  name,
  avatarUrl,
  userId,
  size = "md",
  showOnline = false,
}: AvatarProps) {
  const { onlineUsers } = useUIStore();
  const isOnline = userId ? onlineUsers.has(userId) : false;

  return (
    <div className="relative shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeMap[size]} ${borderMap[size]} border-gray-800 rounded-full object-cover bg-gray-100`}
        />
      ) : (
        <div
          className={`${sizeMap[size]} ${borderMap[size]} border-gray-800 rounded-full flex items-center justify-center font-black text-white select-none`}
          style={{ backgroundColor: getAvatarColor(name) }}
        >
          {getInitials(name)}
        </div>
      )}
      {showOnline && (
        <span
          className={`absolute ${dotMap[size]} block rounded-full border-2 border-white ${
            isOnline ? "bg-emerald-400" : "bg-gray-300"
          }`}
        />
      )}
    </div>
  );
}
