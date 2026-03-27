import { useState } from "react";
import { useAuthStore } from "../stores";
import { useUIStore } from "../stores";
import * as api from "../services/api";
import Avatar from "./Avatar";

export default function ProfileModal() {
  const { user, setUser } = useAuthStore();
  const { setProfileModalOpen } = useUIStore();
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleProfileSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const updated = await api.updateMe({
        name: name.trim() || undefined,
        avatar: avatar.trim() || undefined,
      });
      setUser(updated);
      setSuccess("Profile updated");
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.updatePassword(oldPassword, newPassword);
      setSuccess(
        "Password changed. You may need to log in again on other devices.",
      );
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={() => setProfileModalOpen(false)}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button
            onClick={() => setProfileModalOpen(false)}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => {
              setTab("profile");
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "profile"
                ? "text-white border-b-2 border-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => {
              setTab("password");
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "password"
                ? "text-white border-b-2 border-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Password
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-emerald-400 text-sm">
              {success}
            </div>
          )}

          {tab === "profile" && (
            <>
              <div className="flex justify-center">
                <Avatar
                  name={name || user?.name || "?"}
                  avatarUrl={avatar || user?.avatar}
                  size="lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Avatar URL
                </label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="text-xs text-zinc-600">Email: {user?.email}</div>

              <button
                onClick={handleProfileSave}
                disabled={loading}
                className="w-full bg-white text-black text-sm font-semibold py-2 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}

          {tab === "password" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={loading || !oldPassword || !newPassword}
                className="w-full bg-white text-black text-sm font-semibold py-2 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {loading ? "Changing..." : "Change Password"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
