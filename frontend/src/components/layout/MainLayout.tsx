import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Navbar */}
        <Navbar />

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-auto mt-[73px]">
          {children}
        </main>
      </div>
    </div>
  );
}
