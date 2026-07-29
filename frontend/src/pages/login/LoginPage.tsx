import { useState } from "react";

// Swap this for your own background image path (e.g. import from ../assets)
const BG_IMAGE_URL = "/background.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5096/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();
      console.log("Logged in:", data);
      // TODO: store token/session, redirect to dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Scrolling background layer */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 flex animate-scroll-bg"
          style={{ width: "200%" }}
        >
          <div
            className="h-full w-1/2 bg-cover bg-center"
            style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
          />
          <div
            className="h-full w-1/2 bg-cover bg-center"
            style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
          />
        </div>
        {/* Dark overlay so the glass card reads clearly against any image */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Glass login card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/30
                   bg-white/10 backdrop-blur-xl shadow-2xl p-8
                   flex flex-col gap-5"
      >
        <h1 className="text-2xl font-semibold text-white text-center mb-2 drop-shadow">
          Login
        </h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-white/90">
            Email:
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-lg bg-white/20 border border-white/30 px-4 py-2.5
                       text-white placeholder-white/60 outline-none
                       focus:ring-2 focus:ring-white/70 transition"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-white/90">
            Password:
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            className="rounded-lg bg-white/20 border border-white/30 px-4 py-2.5
                       text-white placeholder-white/60 outline-none
                       focus:ring-2 focus:ring-white/70 transition"
          />
        </div>

        {error && (
          <p className="text-sm text-red-200 bg-red-900/30 border border-red-300/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 rounded-lg bg-blue-600/90 hover:bg-blue-600 disabled:opacity-60
                     text-white font-semibold tracking-wide py-2.5 transition
                     shadow-lg shadow-blue-900/30"
        >
          {isLoading ? "LOGGING IN..." : "LOGIN"}
        </button>

        <a
          href="/forgot-password"
          className="text-center text-sm text-white/80 underline underline-offset-2 hover:text-white transition"
        >
          Lupa Password
        </a>
      </form>
    </div>
  );
}