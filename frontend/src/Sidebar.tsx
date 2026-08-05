import { Menu, Home, Calendar, Mail, FileText, Accessibility, Clock, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import LogoImage from '../src/assets/MeruapLogo.png';


const LOGO_URL = LogoImage; 

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  return (
    <>
      <div
        className={`fixed top-0 left-0 h-screen bg-[#23538a] shadow-[4px_0_15px_rgba(0,0,0,0.2)] transition-[width] duration-300 ease-in-out z-50 flex flex-col overflow-visible ${
          isOpen ? 'w-60' : 'w-15'
        }`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-0 -right-12 h-12 w-12 bg-[#23538a] flex items-center justify-center text-white rounded-br-md shadow-[4px_4px_10px_rgba(0,0,0,0.15)] hover:bg-[#1c4575] transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>

        <div className="flex flex-col h-full mt-5 w-full overflow-hidden">
          
          <div className="flex flex-col gap-1 mb-4 px-4 h-20 items-center justify-center">
            <img
              src={LOGO_URL}
              alt="logo meruap"
              className={`w-auto object-contain shrink-0 transition-all duration-300 ${
                isOpen ? 'h-40 opacity-100' : 'h-10 opacity-0 hidden'
              }`}
            />
          </div>
      
          <nav className="flex flex-col flex-grow">
            <SidebarItem icon={<Home size={22} />} text="Dasbor" isOpen={isOpen} path="/dashboard" />
            <SidebarItem icon={<Calendar size={22} />} text="Jadwal" isOpen={isOpen} path="/jadwal" />
            <SidebarItem icon={<Mail size={22} />} text="Inbox" isOpen={isOpen} path="/inbox" />
            <SidebarItem icon={<FileText size={22} />} text="Pengajuan" isOpen={isOpen} path="/form" />
            <SidebarItem icon={<Accessibility size={22} />} text="Management" isOpen={isOpen} path="/management" />
            <SidebarItem icon={<Clock size={22} />} text="Riwayat" isOpen={isOpen} path="/riwayat" />
          </nav>

          <div className="mb-4">
            <button 
              className="flex items-center py-3 text-red-500 hover:text-red-400 transition-colors w-full group whitespace-nowrap overflow-hidden pl-1"
              onClick={() => ''}
            >
              <div className="flex items-center justify-center w-[76px] shrink-0">
                <LogOut size={22} className="transform group-hover:-translate-x-1 transition-transform" />
              </div>
              
              <span className={`font-medium tracking-wide transition-opacity duration-300 ${
                isOpen ? 'opacity-100' : 'opacity-0 hidden'
              }`}>
                Log Out
              </span>
            </button>
          </div>
          
        </div>
      </div>
    </>
  );
}

function SidebarItem({ icon, text, isOpen, path }: { icon: React.ReactNode, text: string, isOpen: boolean, path: string }) {
  return (
    <Link
      to={path}
      className="flex items-center py-4 text-white/90 hover:bg-white/10 transition-colors border-l-4 border-transparent whitespace-nowrap overflow-hidden"
    >
      <div className="flex items-center justify-center w-[76px] shrink-0">
        {icon}
      </div>
      
      <span className={`font-medium tracking-wide transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 hidden'
      }`}>
        {text}
      </span>
    </Link>
  );
}