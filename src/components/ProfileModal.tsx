import { useState } from "react";
import { useAuthStore, useUIStore } from "../stores";
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
      setSuccess("Password changed");
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={() => setProfileModalOpen(false)}
    >
      <div
        className="bg-white border-2 border-gray-800 rounded-xl w-full max-w-md mx-4 overflow-hidden shadow-[4px_4px_0px] shadow-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b-2 border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">Settings</h2>
          <button
            onClick={() => setProfileModalOpen(false)}
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            <svg
              width="18"
              height="18"
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

        <div className="flex border-b-2 border-gray-800">
          {(["profile", "password"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError("");
                setSuccess("");
              }}
              className={`flex-1 py-2.5 text-sm font-bold capitalize transition-colors ${tab === t ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400 hover:text-gray-700"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg px-4 py-2 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg px-4 py-2 text-emerald-600 text-sm font-medium">
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
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-0 focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Avatar URL
                </label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900"
                />
              </div>
              <p className="text-xs text-gray-500">Email: {user?.email}</p>
              <button
                onClick={handleProfileSave}
                disabled={loading}
                className="w-full bg-black text-white text-sm font-bold py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px] shadow-gray-800 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px] active:shadow-gray-800 disabled:opacity-50 transition-all duration-150"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}

          {tab === "password" && (
            <>
              {["Current Password", "New Password", "Confirm Password"].map(
                (label, i) => {
                  const vals = [oldPassword, newPassword, confirmPassword];
                  const setters = [
                    setOldPassword,
                    setNewPassword,
                    setConfirmPassword,
                  ];
                  return (
                    <div key={label}>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        {label}
                      </label>
                      <input
                        type="password"
                        value={vals[i]}
                        onChange={(e) => setters[i](e.target.value)}
                        className="w-full bg-white border-2 border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-0 focus:border-gray-900"
                      />
                    </div>
                  );
                },
              )}
              <button
                onClick={handlePasswordChange}
                disabled={loading || !oldPassword || !newPassword}
                className="w-full bg-black text-white text-sm font-bold py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px] shadow-gray-800 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px] active:shadow-gray-800 disabled:opacity-50 transition-all duration-150"
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
