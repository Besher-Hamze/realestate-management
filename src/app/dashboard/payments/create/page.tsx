'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PaymentForm from '@/components/payments/PaymentForm';

export default function CreatePaymentPage() {
  const searchParams = useSearchParams();
  const [reservationId, setReservationId] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    // Check if reservationId is provided in URL
    const reservationIdParam = searchParams.get('reservationId');
    
    if (reservationIdParam) {
      setReservationId(parseInt(reservationIdParam, 10));
    }
  }, [searchParams]);

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
              <Link href="/dashboard/payments" className="hover:text-primary-600">Payments</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">Create</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Create New Payment</h1>
        <p className="text-gray-600">
          Record a new payment for a reservation. All fields marked with * are required.
        </p>
      </div>
      
      {/* Payment Form */}
      <PaymentForm preSelectedReservationId={reservationId} />
    </div>
  );
}