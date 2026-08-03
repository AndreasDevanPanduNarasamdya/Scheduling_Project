import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar'; 
import Dashboard from './view/homepage/Dashboard'; 

// Add { children } to the props
export default function MainLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#e8f1fc] flex overflow-x-hidden">
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out w-full ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {children}
      </main>

    </div>
  );
}