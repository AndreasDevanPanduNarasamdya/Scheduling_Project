import { useState } from "react";
import { Link } from "react-router-dom";
import BgImage from "../../assets/background.png";
import LogoImage from "../../assets/MeruapLogo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


const BG_IMAGE_URL = BgImage;
const LOGO_URL = LogoImage; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5096/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Email atau password salah");
      }

      const data = await response.json();

      // console.log("LOGIN RESPONSE:", data);
      // console.log("TOKEN RECEIVED:", !!data.token);

      login(
        {
          userId: data.userId,
          email: data.email,
          staff: {
            staffId: data.staffId,
            firstName: data.firstName,
            lastName: data.lastName,
            position: data.position,
          },
        },
        data.token
      );

      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-gray-900">
      {/* <style>{`
        @keyframes seamlessSlide {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-seamless {
          animation: seamlessSlide 40s linear infinite;
          width: max-content;
        }
      `}</style> */}

      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={BG_IMAGE_URL}
          alt="background"
          className="h-full w-full object-cover select-none block"
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/30
                   bg-white/10 backdrop-blur-sm shadow-2xl p-8
                   flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <img
            src={LOGO_URL}
            alt="logo meruap"
            className="h-20 w-auto object-contain shrink-0 block"
          />
        </div>
        
        <h2 className="text-md font-semibold text-[#000000] text-center mb-2">
          Login
        </h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="form-label">
            Email:
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukan email Anda"
            className="input-field"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="form-label">
            Password:
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukan password Anda"
            className="input-field"
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
          className="mt-2 self-center w-30 rounded-lg bg-blue-600/90 hover:bg-blue-600 disabled:opacity-60
                     text-white font-semibold tracking-wide py-2 transition
                     shadow-lg shadow-blue-900/30"
        >
          {isLoading ? "LOGGING IN..." : "LOGIN"}
        </button>

        <Link
          to="/ForgotPassword"
          className="text-center text-sm text-black/80 underline underline-offset-2 hover:text-white transition"
        >
          Lupa Password
        </Link>
      </form>
    </div>
  );
}