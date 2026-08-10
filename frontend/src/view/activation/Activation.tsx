import { useState, useEffect } from "react";
import { Menu, Eye, EyeOff, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { activateAccount, validateActivationToken } from "../../api";

type TokenStatus = "checking" | "valid" | "invalid" | "expired" | "used";

export default function Activation() {
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("checking");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await validateActivationToken(token);
        if (cancelled) return;
        setTokenStatus(result.status); // "valid" | "expired" | "used" | "invalid"
      } catch {
        if (!cancelled) setTokenStatus("invalid");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleActivateClick = () => {
    setStep(2);
  };

  const validatePassword = (): string | null => {
    if (password.length < 8) {
      return "Password minimal 8 karakter.";
    }
    if (password !== confirmPassword) {
      return "Konfirmasi password tidak cocok.";
    }
    return null;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!token) {
      setFormError("Token tidak valid.");
      return;
    }

    const validationError = validatePassword();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await activateAccount(token, password);
      setStep(3);
    } catch (error: unknown) {
      console.error("Failed to activate account:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengaktifkan akun.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    window.location.href = "/login";
  };

  // ---- Token gate: still checking with the backend ----
  if (tokenStatus === "checking") {
    return (
      <div className="min-h-screen bg-[#edf2fa] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm p-8 w-full max-w-md flex flex-col items-center text-center gap-3">
          <Loader2 className="animate-spin text-[#7595c8]" size={28} />
          <p className="text-gray-600 text-sm">Memeriksa link aktivasi...</p>
        </div>
      </div>
    );
  }

  // ---- Token gate: missing/invalid/expired/already used ----
  if (tokenStatus !== "valid") {
    const messages: Record<Exclude<TokenStatus, "checking" | "valid">, { title: string; body: string }> = {
      invalid: {
        title: "Akses Ditolak",
        body: "Link aktivasi tidak valid atau token hilang dari URL.",
      },
      expired: {
        title: "Link Kedaluwarsa",
        body: "Link aktivasi ini sudah tidak berlaku. Silakan minta link aktivasi baru.",
      },
      used: {
        title: "Akun Sudah Aktif",
        body: "Link ini sudah pernah digunakan. Silakan masuk dengan akun Anda.",
      },
    };
    const { title, body } = messages[tokenStatus as Exclude<TokenStatus, "checking" | "valid">];

    return (
      <div className="min-h-screen bg-[#f0f4fa] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">{title}</h2>
          <p className="text-gray-600">{body}</p>
          {tokenStatus === "used" && (
            <button
              onClick={handleGoToLogin}
              className="mt-6 px-6 py-2.5 bg-[#7595c8] hover:bg-[#6282b5] text-white text-[15px] font-medium rounded-lg shadow-sm transition-colors"
            >
              Pergi ke Login
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---- Token is valid: normal 3-step flow ----
  return (
    <div className="min-h-screen bg-[#edf2fa] font-sans flex items-center justify-center relative p-4">
      <div className="absolute top-8 left-8 text-white">
        <Menu size={28} />
      </div>

      <div className="bg-white rounded-[32px] p-10 sm:p-14 w-full max-w-[500px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col items-center text-center">
        {/* ================= STEP 1: AKTIVASI ================= */}
        {step === 1 && (
          <div className="w-full animation-fade-in">
            <h2 className="text-[28px] font-medium text-gray-900 mb-6">
              Aktivasi Akun
            </h2>
            <p className="text-[15px] text-gray-800 leading-relaxed mb-10 max-w-sm mx-auto">
              Halo Staf A! Klik tombol dibawah ini untuk mengaktifkan akun Anda
            </p>
            <button
              onClick={handleActivateClick}
              className="px-6 py-2.5 bg-[#7595c8] hover:bg-[#6282b5] text-white text-[15px] font-medium rounded-lg shadow-sm transition-colors"
            >
              Aktivasi akun sekarang
            </button>
          </div>
        )}

        {/* ================= STEP 2: PASSWORD ================= */}
        {step === 2 && (
          <div className="w-full animation-fade-in">
            <h2 className="text-[28px] font-medium text-gray-900 mb-6">
              Buat Password
            </h2>
            <p className="text-[15px] text-gray-800 mb-8">
              Buat password baru untuk akun anda
            </p>

            <form onSubmit={handlePasswordSubmit} className="flex flex-col items-center w-full">
              <div className="w-full max-w-[260px] text-left mb-4">
                <label className="block text-sm text-gray-800 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-[#f4f7fc] border border-[#d2dceb] rounded-xl outline-none focus:border-[#7595c8] text-gray-700 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="w-full max-w-[260px] text-left mb-3">
                <label className="block text-sm text-gray-800 mb-2">Konfirmasi Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f4f7fc] border border-[#d2dceb] rounded-xl outline-none focus:border-[#7595c8] text-gray-700 placeholder-gray-400"
                />
              </div>

              {formError && (
                <p className="w-full max-w-[260px] text-left text-sm text-red-600 mb-5">
                  {formError}
                </p>
              )}

              <div className={`w-full max-w-[260px] flex justify-end ${formError ? "" : "mt-5"}`}>
                <button
                  type="submit"
                  disabled={isSubmitting || password.length < 8 || confirmPassword.length < 8}
                  className="px-6 py-2 bg-[#7595c8] hover:bg-[#6282b5] text-white text-[14px] font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Memproses..." : "Buat Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 3: SUCCESS ================= */}
        {step === 3 && (
          <div className="w-full animation-fade-in">
            <h2 className="text-[28px] font-medium text-gray-900 mb-6">
              Akun Diaktifkan
            </h2>
            <p className="text-[15px] text-gray-800 mb-10">
              Akun telah berhasil diaktifkan
            </p>
            <button
              onClick={handleGoToLogin}
              className="px-8 py-2.5 bg-[#7595c8] hover:bg-[#6282b5] text-white text-[15px] font-medium rounded-lg shadow-sm transition-colors"
            >
              Pergi ke Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}