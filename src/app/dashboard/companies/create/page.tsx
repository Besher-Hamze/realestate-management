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
  
  // فقط المسؤولين يمكنهم إنشاء شركات
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('ليس لديك صلاحية إنشاء شركات');
      router.push('/dashboard/companies');
    }
  }, [user, router]);

  // لا تعرض أي شيء حتى نتحقق من الصلاحيات
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* العنوان مع مسار التنقل */}
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
              <span className="text-gray-700">إنشاء</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">إنشاء شركة جديدة</h1>
        <p className="text-gray-600">أضف شركة جديدة وقم بإنشاء مدير لها اختياريًا.</p>
      </div>
      
      {/* نموذج الشركة */}
      <CompanyForm />
    </div>
  );
}