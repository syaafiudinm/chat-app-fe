// ============================================
// WebSocket Service
// ============================================

import { getWsUrl } from "./api";

type EventHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private _isConnected = false;

  get isConnected() {
    return this._isConnected;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      const url = getWsUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this._isConnected = true;
        this.reconnectDelay = 1000;
        this.emit("connection_status", { connected: true });
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          // Backend uses { type, payload } format
          const eventType = parsed.type;
          const payload = parsed.payload;
          this.emit(eventType, payload);
        } catch (err) {
          console.error("[WS] Failed to parse message:", err);
        }
      };

      this.ws.onclose = (event) => {
        this._isConnected = false;
        this.stopPing();
        this.emit("connection_status", { connected: false });

        if (!event.wasClean) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this._isConnected = false;
      };
    } catch (err) {
      console.error("[WS] Connection error:", err);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, "User disconnect");
      this.ws = null;
    }
    this._isConnected = false;
  }

  // Backend expects { type, payload } format
  send(type: string, payload?: any) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, payload: payload || null }));
  }

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  private emit(event: string, data: any) {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`[WS] Handler error for "${event}":`, err);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay,
      );
      this.connect();
    }, this.reconnectDelay);
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      this.send("ping");
    }, 25000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const wsService = new WebSocketService();
