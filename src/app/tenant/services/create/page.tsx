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
    // Check if unitId and reservationId are provided in URL
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
      {/* Header with breadcrumbs */}
      <div className="flex flex-col space-y-2">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/tenant" className="hover:text-primary-600">Dashboard</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/tenant/services" className="hover:text-primary-600">Service Requests</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">Create</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Submit New Service Request</h1>
        <p className="text-gray-600">
          Fill out the form below to submit a new service request for your property.
        </p>
      </div>
      
      {/* Service Form */}
      <ServiceForm 
        preSelectedUnitId={unitId} 
        preSelectedReservationId={reservationId}
        isTenant={true}
      />
    </div>
  );
}