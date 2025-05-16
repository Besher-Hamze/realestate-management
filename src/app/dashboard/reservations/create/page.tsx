'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReservationForm from '@/components/reservations/ReservationForm';
import BuildingUnitSelector from '@/components/reservations/BuildingUnitSelector';

export default function CreateReservationPage() {
  const searchParams = useSearchParams();
  const [unitId, setUnitId] = useState<number | undefined>(undefined);
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [step, setStep] = useState<'select-unit' | 'reservation-details'>('select-unit');
  
  useEffect(() => {
    const unitIdParam = searchParams.get('unitId');
    const userIdParam = searchParams.get('userId');
    
    if (unitIdParam) {
      const parsedUnitId = parseInt(unitIdParam, 10);
      setUnitId(parsedUnitId);
      // If unit is already selected from URL param, go directly to reservation details
      setStep('reservation-details');
    }
    
    if (userIdParam) {
      setUserId(parseInt(userIdParam, 10));
    }
  }, [searchParams]);

  const handleUnitSelected = (selectedUnitId: number) => {
    setUnitId(selectedUnitId);
    setStep('reservation-details');
  };

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
              <Link href="/dashboard/reservations" className="hover:text-primary-600">الحجوزات</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">إنشاء</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">إنشاء حجز جديد</h1>
        <p className="text-gray-600">
          {step === 'select-unit' 
            ? 'اختر المبنى والوحدة التي ترغب في حجزها.'
            : 'أكمل تفاصيل الحجز للوحدة المختارة.'}
        </p>
      </div>
      
      {/* خطوات الحجز */}
      <div className="mb-8">
        <ol className="flex items-center">
          <li className={`flex items-center ${step === 'select-unit' ? 'text-primary-600' : 'text-gray-500'}`}>
            <span className={`flex items-center justify-center w-8 h-8 border ${step === 'select-unit' ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-300 bg-white'} rounded-full mr-2`}>
              1
            </span>
            <span className="font-medium">اختيار الوحدة</span>
          </li>
          <li className="flex-1 h-px bg-gray-300 mx-4"></li>
          <li className={`flex items-center ${step === 'reservation-details' ? 'text-primary-600' : 'text-gray-500'}`}>
            <span className={`flex items-center justify-center w-8 h-8 border ${step === 'reservation-details' ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-300 bg-white'} rounded-full mr-2`}>
              2
            </span>
            <span className="font-medium">تفاصيل الحجز</span>
          </li>
        </ol>
      </div>
      
      {/* Step 1: Building and Unit Selection */}
      {step === 'select-unit' && (
        <BuildingUnitSelector 
          onUnitSelected={handleUnitSelected}
          preSelectedUnitId={unitId}
        />
      )}
      
      {/* Step 2: Reservation Form */}
      {step === 'reservation-details' && unitId && (
        <ReservationForm 
          preSelectedUnitId={unitId} 
          preSelectedUserId={userId}
        />
      )}
    </div>
  );
}