import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar'; 

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg flex overflow-hidden w-full">
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* 
        THE FIX: 
        1. Changed 'ml-64' to 'pl-64' (Padding Left). Because Tailwind uses box-border, 
           padding forces the inside content to squash rather than pushing the box off-screen!
        2. Added 'min-w-0 h-screen flex flex-col' so the children perfectly conform to the squashed size.
      */}
      <main 
        className={`flex-1 min-w-0 h-screen flex flex-col transition-[padding] duration-300 ease-in-out w-full ${
          isSidebarOpen ? 'pl-64' : 'pl-0'
        }`}
      >
        {children}
      </main>

    </div>
  );
}