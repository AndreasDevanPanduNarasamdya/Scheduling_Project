import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar'; 

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg flex overflow-hidden w-full">
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
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