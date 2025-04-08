'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import CompanyForm from '@/components/companies/CopmpanyForm';

export default function CreateCompanyPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Only admins can create companies
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('You do not have permission to create companies');
      router.push('/dashboard/companies');
    }
  }, [user, router]);

  // Don't render anything until we've checked permissions
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumbs */}
      <div className="flex flex-col space-y-2">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/dashboard" className="hover:text-primary-600">Dashboard</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/dashboard/companies" className="hover:text-primary-600">Companies</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">Create</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Create New Company</h1>
        <p className="text-gray-600">Add a new company and optionally create a manager for it.</p>
      </div>
      
      {/* Company Form */}
      <CompanyForm />
    </div>
  );
}