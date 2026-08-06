import { useState } from "react";
import { Menu } from "lucide-react"; // Assuming you use lucide-react for icons

export default function Activation() {
  // We use this state to track which step of the UI to show (1, 2, or 3)
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: User clicks activate
  const handleActivateClick = () => {
    // Move to step 2 (Create Password)
    setStep(2);
  };

  // Step 2: User submits their new password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Here is where you will call your C# backend!
      // Example:
      // const urlParams = new URLSearchParams(window.location.search);
      // const token = urlParams.get('token');
      // await api.activateAccount(token, password);

      // Simulating a network request for 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Move to step 3 (Success)
      setStep(3);
    } catch (error) {
      console.error("Failed to activate account:", error);
      alert("Terjadi kesalahan saat mengaktifkan akun.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: User goes to login
  const handleGoToLogin = () => {
    // Redirect to your login route
    window.location.href = "/login"; 
  };

  return (
    <div className="min-h-screen bg-[#edf2fa] font-sans flex items-center justify-center relative p-4">
      
      {/* Background Hamburger Menu (to match your mockup) */}
      <div className="absolute top-8 left-8 text-white">
        <Menu size={28} />
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[32px] p-10 sm:p-14 w-full max-w-[500px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col items-center text-center">
        
        {/* ================= STEP 1: AKTIVASI ================= */}
        {step === 1 && (
          <div className="w-full animation-fade-in">
            <h2 className="text-[28px] font-medium text-gray-900 mb-6">
              Aktivasi Akun
            </h2>
            <p className="text-[15px] text-gray-800 leading-relaxed mb-10 max-w-sm mx-auto">
              Halo Staf A! Klik tombol dibawah ini untuk mengaktifkan akun BWP Meruap Anda
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
              <div className="w-full max-w-[260px] text-left mb-8">
                <label className="block text-sm text-gray-800 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="12345"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f4f7fc] border border-[#d2dceb] rounded-xl outline-none focus:border-[#7595c8] text-gray-700 placeholder-gray-400"
                />
              </div>
              
              <div className="w-full max-w-[260px] flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || password.length < 5}
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