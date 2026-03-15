export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  is_online?: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  name: string;
  description?: string;
  type: "private" | "group";
  owner_id: number;
  last_message?: Message;
  unread_count?: number;
  members?: RoomMember[];
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  id: number;
  room_id: number;
  user_id: number;
  role: "admin" | "member";
  user?: User;
  joined_at: string;
}

export interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  content: string;
  type?: string;
  message_type?: string;
  is_edited?: boolean;
  reply_to_id?: number;
  sender?: User;
  attachments?: any[];
  reads?: MessageRead[];
  created_at: string;
  updated_at: string;
}

export interface MessageRead {
  id: number;
  message_id: number;
  user_id: number;
  user?: User;
  read_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export type WSClientEvent =
  | {
      type: "send_message";
      payload: { room_id: number; content: string; type?: string };
    }
  | { type: "typing"; payload: { room_id: number } }
  | { type: "stop_typing"; payload: { room_id: number } }
  | { type: "mark_read"; payload: { room_id: number; message_id?: number } }
  | { type: "join_room"; payload: { room_id: number } }
  | { type: "leave_room"; payload: { room_id: number } }
  | { type: "ping"; payload: null };

export interface WSServerEvent {
  type: string;
  payload: any;
}

export interface TypingUser {
  user_id: number;
  username: string;
  room_id: number;
}
