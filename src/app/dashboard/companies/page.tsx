'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Company } from '@/lib/types';
import { companiesApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import CompanyList from '@/components/companies/CopmpanyList';

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // جلب الشركات عند تحميل المكون
  useEffect(() => {
    fetchCompanies();
  }, []);

  // جلب بيانات الشركات
  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const response = await companiesApi.getAll();
      
      if (response.success) {
        setCompanies(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب الشركات');
      }
    } catch (error) {
      console.error('خطأ في جلب الشركات:', error);
      toast.error('حدث خطأ أثناء جلب الشركات');
    } finally {
      setIsLoading(false);
    }
  };

  // التعامل مع حذف الشركة
  const handleDelete = (id: number) => {
    setCompanies((prevCompanies) => prevCompanies.filter((company) => company.id !== id));
  };

  // فقط المدير يمكنه إنشاء شركات
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* العنوان مع أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">الشركات</h1>
        {isAdmin && (
          <Link href="/dashboard/companies/create">
            <Button
              variant="primary"
              leftIcon={
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              إضافة شركة
            </Button>
          </Link>
        )}
      </div>
      
      {/* بطاقة معلومات للمدراء */}
      {!isAdmin && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">معلومات</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>بصفتك مديرًا، يمكنك عرض معلومات الشركة ولكن يمكن للمسؤولين فقط إنشاء أو تعديل الشركات.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* قائمة الشركات */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <CompanyList
          companies={companies}
          isLoading={isLoading}
          onDelete={handleDelete}
          refetch={fetchCompanies}
        />
      </div>
    </div>
  );
}