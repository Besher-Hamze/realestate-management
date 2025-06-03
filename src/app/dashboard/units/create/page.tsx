'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import UnitForm from '@/components/units/UnitFormYup';

export default function CreateUnitPage() {
  const searchParams = useSearchParams();
  const [buildingId, setBuildingId] = useState<number | undefined>(undefined);

  useEffect(() => {
    // التحقق مما إذا كان معرف المبنى موجودًا في الرابط
    const buildingIdParam = searchParams.get('buildingId');
    if (buildingIdParam) {
      setBuildingId(parseInt(buildingIdParam, 10));
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* الترويسة مع مسار التنقل */}
      <div className="flex flex-col space-y-2">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/dashboard" className="hover:text-primary-600">لوحة التحكم</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/dashboard/units" className="hover:text-primary-600">الوحدات</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">إنشاء</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">إنشاء وحدة جديدة</h1>
        <p className="text-gray-600">إضافة وحدة جديدة إلى مبنى.</p>
      </div>

      {/* نموذج الوحدة */}
      <UnitForm preSelectedBuildingId={buildingId} />
    </div>
  );
}