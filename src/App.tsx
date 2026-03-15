import { useEffect, useState } from "react";
import { useAuthStore, useRoomStore } from "../src/stores";
import { useWebSocket } from "../src/hooks";
import Sidebar from "../src/components/Sidebar";
import ChatArea from "../src/components/ChatArea";
import { LoginPage, RegisterPage } from "../src/pages/AuthPages";

export default function App() {
  const { isAuthenticated, fetchMe, user } = useAuthStore();
  const { fetchRooms } = useRoomStore();
  const [authView, setAuthView] = useState<"login" | "register">("login");

  // Connect WS when authenticated
  useWebSocket();

  // Fetch user data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
  }, []);

  // Fetch rooms when user loads
  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user?.id]);

  // Auth screens
  if (!isAuthenticated) {
    if (authView === "register") {
      return <RegisterPage onSwitchToLogin={() => setAuthView("login")} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView("register")} />;
  }

  return (
    <div className="h-screen w-screen flex bg-zinc-950 text-zinc-100 overflow-hidden">
      <Sidebar />
      <ChatArea />
    </div>
  );
}
