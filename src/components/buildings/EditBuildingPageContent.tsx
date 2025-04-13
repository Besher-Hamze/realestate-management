// components/buildings/EditBuildingPageContent.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Building } from '@/lib/types';
import { buildingsApi } from '@/lib/api';
import BuildingForm from '@/components/buildings/BuildingForm';

interface EditBuildingProps {
  id: string;
}

export default function EditBuildingPageContent({ id }: EditBuildingProps) {
  const router = useRouter();
  
  const [building, setBuilding] = useState<Building | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // جلب تفاصيل المبنى عند تحميل المكون
  useEffect(() => {
    fetchBuilding();
  }, [id]);

  // جلب بيانات المبنى
  const fetchBuilding = async () => {
    try {
      setIsLoading(true);
      const response = await buildingsApi.getById(id);
      
      if (response.success) {
        setBuilding(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب تفاصيل المبنى');
        router.push('/dashboard/buildings');
      }
    } catch (error) {
      console.error('خطأ في جلب المبنى:', error);
      toast.error('حدث خطأ أثناء جلب تفاصيل المبنى');
      router.push('/dashboard/buildings');
    } finally {
      setIsLoading(false);
    }
  };

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-primary-500 mb-4"
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
          <p className="text-gray-600">جاري تحميل تفاصيل المبنى...</p>
        </div>
      </div>
    );
  }

  // عرض حالة عدم العثور على المبنى
  if (!building) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">لم يتم العثور على المبنى</h2>
        <p className="text-gray-600 mb-6">المبنى الذي تبحث عنه غير موجود أو ليس لديك صلاحية تعديله.</p>
        <Link href="/dashboard/buildings">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            العودة إلى المباني
          </button>
        </Link>
      </div>
    );
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
              <Link href="/dashboard/buildings" className="hover:text-primary-600">المباني</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href={`/dashboard/buildings/${id}`} className="hover:text-primary-600">{building.name}</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">تعديل</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">تعديل المبنى</h1>
        <p className="text-gray-600">تحديث تفاصيل {building.name}.</p>
      </div>
      
      {/* نموذج المبنى */}
      <BuildingForm
        isEdit
        initialData={building}
        onSuccess={(updatedBuilding) => {
          router.push(`/dashboard/buildings/${updatedBuilding.id}`);
        }}
      />
    </div>
  );
}