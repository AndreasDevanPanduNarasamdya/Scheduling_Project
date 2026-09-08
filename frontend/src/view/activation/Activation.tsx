import { useState, useEffect } from "react";
import { Menu, Eye, EyeOff, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { activateAccount, validateActivationToken } from "../../api";
import { useAlert } from '../../view/messagebox/AlertProvider';

type TokenStatus = "checking" | "valid" | "invalid" | "expired" | "used";

export default function Activation() {
  const { showAlert } = useAlert();
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("checking");
  const [staffName, setStaffName] = useState<string>("");
  
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
        
        const actualStatus = result.status;
        const actualName = result.name;
        
        setTokenStatus(actualStatus); 
        
        if (actualStatus === "valid" && actualName) {
          setStaffName(actualName);
        }
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

    if (!token) {
      showAlert({ 
        type: 'error', 
        title: 'Akses Ditolak', 
        message: 'Token aktivasi tidak valid atau hilang.' 
      });
      return;
    }

    const validationError = validatePassword();
    if (validationError) {
      showAlert({ 
        type: 'warning', 
        title: 'Validasi Password', 
        message: validationError 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await activateAccount(token, password);
      setStep(3); // Moves to the success screen!
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan saat mengaktifkan akun.";
      showAlert({ 
        type: 'error', 
        title: 'Gagal Aktivasi', 
        message: message 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    window.location.href = "/";
  };

  if (tokenStatus === "checking") {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="card p-8 w-full max-w-md flex flex-col items-center text-center gap-3">
          <Loader2 className="animate-spin text-brand-primary" size={28} />
          <p className="text-black/60 text-sm">Memeriksa link aktivasi...</p>
        </div>
      </div>
    );
  }

  if (tokenStatus !== "valid") {
    const messages: Record<Exclude<TokenStatus, "checking" | "valid">, { title: string; body: string }> = {
      invalid: {
        title: "Akses Ditolak",
        body: "Link aktivasi tidak valid atau token hilang dari URL. ",
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
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="card p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-state-error mb-2">{title}</h2>
          <p className="text-black/60">{body}</p>
          {tokenStatus === "used" && (
            <button
              onClick={handleGoToLogin}
              className="btn-primary mt-6 justify-center w-full"
            >
              Pergi ke Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg font-sans flex items-center justify-center relative p-4">

      <div className="card p-10 sm:p-14 w-full max-w-[500px] flex flex-col items-center text-center">
        
        {step === 1 && (
          <div className="w-full animation-fade-in">
            <h2 className="text-[28px] font-medium text-brand-dark mb-6">
              Aktivasi Akun
            </h2>
            <p className="text-[15px] text-black/80 leading-relaxed mb-10 max-w-sm mx-auto">
              Halo <strong className="font-semibold">{staffName || "Staf"}</strong>! Klik tombol dibawah ini untuk mengaktifkan akun Anda
            </p>
            <button
              onClick={handleActivateClick}
              className="mt-5 btn-primary justify-center w-full"
            >
              Aktivasi akun sekarang
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full animation-fade-in">
            <h2 className="text-[28px] font-medium text-brand-dark mb-6">
              Buat Password
            </h2>
            <p className="text-[15px] text-black/80 mb-8">
              Buat password baru untuk akun anda
            </p>

            <form onSubmit={handlePasswordSubmit} className="flex flex-col items-center w-full">
              <div className="flex flex-col gap-1 mb-4">
                <label htmlFor="password" className="form-label">
                  Password:
                </label>
                <div className="relative">
                  <input
                    id="password"
                    // 🟢 This ternary operator is the key!
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukan password Anda"
                    className="input-field pr-10" // 🟢 Added padding so text doesn't hide behind the icon
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/60 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="w-full max-w-[280px] text-left mb-3">
                <label className="form-label">Konfirmasi Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="w-full max-w-[280px] flex justify-end mt-5">
                <button
                  type="submit"
                  disabled={isSubmitting || password.length < 8 || confirmPassword.length < 8}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? "Memproses..." : "Buat Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="w-full animation-fade-in">
            <h2 className="text-[28px] font-medium text-brand-dark mb-6">
              Akun Diaktifkan
            </h2>
            <p className="text-[15px] text-black/80 mb-10">
              Akun telah berhasil diaktifkan
            </p>
            <button
              onClick={handleGoToLogin}
              className="mt-5 btn-primary justify-center w-full"
            >
              Pergi ke Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}