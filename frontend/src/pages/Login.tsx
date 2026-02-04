import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-garage-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-amber-400 tracking-tight">Garage Fleet</h1>
          <p className="text-garage-600 mt-1 text-sm">garage.hamiltons.cloud</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-garage-900 border border-garage-700 rounded-xl p-6 shadow-xl"
        >
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
              {error}
            </div>
          )}
          <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white placeholder-garage-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 mb-4"
            placeholder="admin"
            autoComplete="username"
            required
          />
          <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-garage-800 border border-garage-600 text-white placeholder-garage-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 mb-6"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-amber-500 text-garage-950 font-semibold hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-garage-900 disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
