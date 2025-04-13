'use client';

import Link from 'next/link';
import BuildingForm from '@/components/buildings/BuildingForm';

export default function CreateBuildingPage() {
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
              <span className="text-gray-700">إنشاء</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">إنشاء مبنى جديد</h1>
        <p className="text-gray-600">أضف مبنى جديدًا إلى محفظة العقارات الخاصة بك.</p>
      </div>
      
      {/* نموذج المبنى */}
      <BuildingForm />
    </div>
  );
}