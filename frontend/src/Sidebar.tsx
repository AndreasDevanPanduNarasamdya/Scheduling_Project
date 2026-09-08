import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { Menu, Home, Calendar, Mail, FileText, Accessibility, Clock, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import LogoImage from '../src/assets/MeruapLogo.png';
import { getUserClearance } from "./api";
import { Clearance } from "./types";

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const { logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const userClearance = getUserClearance(); // 🔥 NEW: Grab the clearance
  return (
    <>
      {/* The Sidebar - Slides off-screen, pulling the button with it */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-brand-dark shadow-[4px_0_15px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Toggle Button - Sticks out the right side so it's always visible */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-0 -right-12 h-12 w-12 bg-brand-dark flex items-center justify-center text-white rounded-br-xl shadow-[4px_4px_10px_rgba(0,0,0,0.15)] hover:brightness-110 transition-all cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>

        <div className="flex flex-col h-full mt-5 w-full overflow-y-auto overflow-x-hidden scrollbar-thin">
          
          <div className="flex flex-col gap-1 mb-4 px-4 h-20 items-center justify-center shrink-0">
            <img
              src={LogoImage}
              alt="logo meruap"
              className="w-auto h-28 object-contain shrink-0"
            />
          </div>
      
          <nav className="flex flex-col flex-grow mt-4">
            <SidebarItem icon={<Home size={22} />} text="Dasbor" path="/dashboard" />
            <SidebarItem icon={<Calendar size={22} />} text="Jadwal" path="/timeline" />
            
            {userClearance !== Clearance.Staff && (
              <SidebarItem icon={<Mail size={22} />} text="Inbox" path="/inbox" />
            )}
            
            <SidebarItem icon={<FileText size={22} />} text="Pengajuan" path="/form" />
            
            {userClearance !== Clearance.Staff && (
              <SidebarItem icon={<Accessibility size={22} />} text="Management" path="/management" />
            )}
            
            {userClearance !== Clearance.Staff && (
              <SidebarItem icon={<Clock size={22} />} text="Riwayat" path="/history" />
            )}
          </nav>

          <div className="mb-8 mt-4">
            <button 
              className="flex items-center py-3 px-6 text-red-500 hover:text-red-400..."
              onClick={() => setIsLogoutModalOpen(true)} // <-- CHANGE THIS LINE
            >
              <LogOut size={22} className="transform group-hover:-translate-x-1 transition-transform mr-4 shrink-0" />
              <span className="font-medium tracking-wide">
                Log Out
              </span>
            </button>
          </div>
          
        </div>
      </div>
      {/* PASTE THIS ENTIRE BLOCK HERE */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="card w-full max-w-sm p-6 shadow-2xl flex flex-col items-center">
            
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <LogOut size={24} className="text-red-500" />
            </div>
            
            <h2 className="text-xl font-semibold text-black mb-2">Logout</h2>
            <p className="text-black/60 text-sm mb-6 text-center">
              Apakah Anda yakin ingin keluar dari aplikasi? Anda harus login kembali untuk masuk.
            </p>
            
            <div className="flex gap-3 w-full justify-center">
              <button 
                type="button" 
                onClick={() => setIsLogoutModalOpen(false)} 
                className="px-5 py-2 text-sm font-medium text-black/60 hover:bg-brand-bg rounded-xl transition cursor-pointer w-full"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={logout} 
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm transition cursor-pointer w-full"
              >
                Ya, Keluar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

// Cleaned up SidebarItem
function SidebarItem({ icon, text, path }: { icon: React.ReactNode, text: string, path: string }) {
  return (
    <Link
      to={path}
      className="flex items-center px-6 py-3.5 text-white/90 hover:bg-white/10 transition-colors border-l-4 border-transparent hover:border-brand-light w-full"
    >
      <div className="flex items-center justify-center shrink-0 mr-4">
        {icon}
      </div>
      <span className="font-medium tracking-wide">
        {text}
      </span>
    </Link>
  );
}