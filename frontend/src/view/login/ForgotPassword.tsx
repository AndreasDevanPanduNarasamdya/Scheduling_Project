import BgImage from "../../assets/background.png";
import LogoImage from "../../assets/MeruapLogo.png";

const BG_IMAGE_URL = BgImage;
const LOGO_URL = LogoImage; 

export default function ForgotPassword() {


  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-gray-900">
      <style>{`
        @keyframes seamlessSlide {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-seamless {
          animation: seamlessSlide 40s linear infinite;
          width: max-content;
        }
      `}</style>

      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-y-0 left-0 flex animate-seamless h-full">
          <img
            src={BG_IMAGE_URL}
            alt="background 1"
            className="h-full w-auto max-w-none shrink-0 select-none block"
          />
          <img
            src={BG_IMAGE_URL}
            alt="background 2"
            className="h-full w-auto max-w-none shrink-0 select-none block"
          />
        </div>
      </div>

      <div
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
          Lupa Password
        </h2>

        <label htmlFor="email" className="text-sm font-medium text-center text-black/90">
          Mohon untuk mengontak administrasi atau IT
        </label>
      </div>
    </div>
  );
}