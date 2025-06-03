'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { companiesApi } from '@/lib/api';
import { Company } from '@/lib/types';
import CompanyForm from '@/components/companies/CompanyFormYup';

export default function CreateCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<Company | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Determine if we're in edit mode based on the presence of an ID in the URL
  const isEditMode = !!params.id;

  // Fetch company data for edit mode
  useEffect(() => {
    const fetchCompanyData = async () => {
      // Only fetch if in edit mode and user is an admin
      if (isEditMode && user?.role === 'admin') {
        try {
          const companyId = Number(params.id);
          const data = await companiesApi.getById(companyId) as any;
          setInitialData(data);
        } catch (error) {
          toast.error('فشل في جلب بيانات الشركة');
          router.push('/dashboard/companies');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [isEditMode, user, params.id, router]);

  // Check user permissions
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('ليس لديك صلاحية إدارة الشركات');
      router.push('/dashboard/companies');
    }
  }, [user, router]);

  // Don't render anything until permissions and data are checked
  if (!user || user.role !== 'admin' || isLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Navigation and Title */}
      <div className="flex flex-col space-y-2">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/dashboard" className="hover:text-primary-600">لوحة التحكم</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/dashboard/companies" className="hover:text-primary-600">الشركات</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">{isEditMode ? 'تعديل' : 'إنشاء'}</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'تعديل الشركة' : 'إنشاء شركة جديدة'}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? 'قم بتحديث معلومات الشركة'
            : 'أضف شركة جديدة وقم بإنشاء مدير لها اختياريًا.'}
        </p>
      </div>

      {/* Company Form */}
      <CompanyForm
        isEdit={isEditMode}
        initialData={initialData}
        onSuccess={() => router.push('/dashboard/companies')}
      />
    </div>
  );
}