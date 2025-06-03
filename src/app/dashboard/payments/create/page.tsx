'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { reservationsApi } from '@/lib/api';
import PaymentForm from '@/components/payments/PaymentFormYup';

export default function CreatePaymentPage() {
  const searchParams = useSearchParams();
  const [reservationId, setReservationId] = useState<number | undefined>(undefined);
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    // التحقق مما إذا كان معرف الحجز مقدمًا في عنوان URL
    const reservationIdParam = searchParams.get('reservationId');
    if (reservationIdParam) {
      setReservationId(parseInt(reservationIdParam, 10));
      if (reservationId) {
        reservationsApi.getById(reservationId).then(res => setReservation(res.data));
      }
    }
    console.log("THIS IS THE RESERVATION ID :", reservationId);

  }, [searchParams]);

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
              <Link href="/dashboard/payments" className="hover:text-primary-600">المدفوعات</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">إنشاء</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">إنشاء مدفوعة جديدة</h1>
        <p className="text-gray-600">
          تسجيل مدفوعة جديدة لحجز. جميع الحقول المميزة بعلامة * مطلوبة.
        </p>
      </div>

      {/* نموذج المدفوعة */}
      <PaymentForm preSelectedReservationId={reservationId} initialData={reservation} />
    </div>
  );
}