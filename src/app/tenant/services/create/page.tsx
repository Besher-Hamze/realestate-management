'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ServiceForm from '@/components/services/ServiceForm';

export default function CreateServicePage() {
  const searchParams = useSearchParams();
  const [unitId, setUnitId] = useState<number | undefined>(undefined);
  const [reservationId, setReservationId] = useState<number | undefined>(undefined);

  useEffect(() => {
    // التحقق مما إذا كان معرف الوحدة ومعرف الحجز موجودين في الرابط
    const unitIdParam = searchParams.get('unitId');
    const reservationIdParam = searchParams.get('reservationId');

    if (unitIdParam) {
      setUnitId(parseInt(unitIdParam, 10));
    }

    if (reservationIdParam) {
      setReservationId(parseInt(reservationIdParam, 10));
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* الترويسة مع مسار التنقل */}
      <div className="flex flex-col space-y-2">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/tenant" className="hover:text-primary-600">لوحة التحكم</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/tenant/services" className="hover:text-primary-600">طلبات الخدمة</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">إنشاء</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">تقديم طلب خدمة جديد</h1>
        <p className="text-gray-600">
          املأ النموذج أدناه لتقديم طلب خدمة جديد لعقارك.
        </p>
      </div>

      {/* نموذج الخدمة */}
      <ServiceForm
        preSelectedUnitId={unitId}
        preSelectedReservationId={reservationId}
        isTenant={true}
      />
    </div>
  );
}