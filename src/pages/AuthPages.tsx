import { useState } from "react";
import { useAuthStore } from "../stores";

interface Props {
  onSwitchToRegister?: () => void;
  onSwitchToLogin?: () => void;
}

export function LoginPage({ onSwitchToRegister }: Props) {
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 bg-black rounded-xl border-2 border-black shadow-[3px_3px_0px] shadow-black flex items-center justify-center">
            <span className="text-white font-black text-2xl">#</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white border-2 border-gray-800 rounded-xl p-6 shadow-[4px_4px_0px] shadow-gray-800"
        >
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg px-4 py-2.5 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border-2 border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border-2 border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white font-bold py-2.5 rounded-lg border-2 border-black shadow-[3px_3px_0px] shadow-gray-800 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px] active:shadow-gray-800 disabled:opacity-50 transition-all duration-150 text-sm"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-gray-900 font-bold hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage({ onSwitchToLogin }: Props) {
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      await register(name, email, password);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 bg-black rounded-xl border-2 border-black shadow-[3px_3px_0px] shadow-black flex items-center justify-center">
            <span className="text-white font-black text-2xl">#</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Create account
          </h1>
          <p className="text-sm text-gray-500 mt-1">Join the conversation</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white border-2 border-gray-800 rounded-xl p-6 shadow-[4px_4px_0px] shadow-gray-800"
        >
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg px-4 py-2.5 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-white border-2 border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border-2 border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-white border-2 border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-0 focus:border-gray-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white font-bold py-2.5 rounded-lg border-2 border-black shadow-[3px_3px_0px] shadow-gray-800 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px] active:shadow-gray-800 disabled:opacity-50 transition-all duration-150 text-sm"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-gray-900 font-bold hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
