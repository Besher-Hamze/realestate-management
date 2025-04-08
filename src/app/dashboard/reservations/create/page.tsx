'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReservationForm from '@/components/reservations/ReservationForm';

export default function CreateReservationPage() {
  const searchParams = useSearchParams();
  const [unitId, setUnitId] = useState<number | undefined>(undefined);
  const [userId, setUserId] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    // Check if unitId and userId are provided in URL
    const unitIdParam = searchParams.get('unitId');
    const userIdParam = searchParams.get('userId');
    
    if (unitIdParam) {
      setUnitId(parseInt(unitIdParam, 10));
    }
    
    if (userIdParam) {
      setUserId(parseInt(userIdParam, 10));
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
              <Link href="/dashboard/reservations" className="hover:text-primary-600">Reservations</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">Create</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Create New Reservation</h1>
        <p className="text-gray-600">
          Create a new reservation for a tenant. You can either select an existing tenant or create a new one.
        </p>
      </div>
      
      {/* Reservation Form */}
      <ReservationForm 
        preSelectedUnitId={unitId} 
        preSelectedUserId={userId}
      />
    </div>
  );
}