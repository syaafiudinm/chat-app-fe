import { useEffect, useState } from "react";
import { useAuthStore, useRoomStore, useUserCacheStore } from "../src/stores";
import { useWebSocket } from "../src/hooks";
import Sidebar from "../src/components/Sidebar";
import ChatArea from "../src/components/ChatArea";
import { LoginPage, RegisterPage } from "../src/pages/AuthPages";

export default function App() {
  const { isAuthenticated, fetchMe, user } = useAuthStore();
  const { fetchRooms } = useRoomStore();
  const { fetchUsers } = useUserCacheStore();
  const [authView, setAuthView] = useState<"login" | "register">("login");

  useWebSocket();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchUsers(); // Cache all users for name resolution
      // Fix URL - push to / if stuck on /login
      if (window.location.pathname === "/login") {
        window.history.replaceState(null, "", "/");
      }
    }
  }, [user?.id]);

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
