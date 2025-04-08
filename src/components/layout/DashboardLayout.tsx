import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';
import Sidebar from '../ui/Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-12 w-12 text-primary-500 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      
      <div className={cn("md:ml-64 min-h-screen flex flex-col")}>
        <Navbar />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
        
        <footer className="border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Real Estate Management System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}