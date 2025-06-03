'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RealEstateUnit, Reservation } from '@/lib/types';
import { reservationsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import UnitList from '@/components/units/UnitList';

export default function TenantUnitsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [units, setUnits] = useState<RealEstateUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // جلب حجوزات المستأجر عند تحميل المكون
  useEffect(() => {
    fetchReservations();
  }, []);

  // جلب بيانات المستأجرين 
  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const response = await reservationsApi.getMy();

      if (response.success) {
        setReservations(response.data);

        // استخراج الوحدات من المستأجرين 
        const extractedUnits = response.data
          .filter(reservation => reservation.unit) // تصفية المستأجرين  التي لا تحتوي على بيانات الوحدة
          .map(reservation => reservation.unit as any); // استخراج بيانات الوحدة

        setUnits(extractedUnits);
      } else {
        toast.error(response.message || 'فشل في جلب الوحدات الخاصة بك');
      }
    } catch (error) {
      console.error('خطأ في جلب المستأجرين :', error);
      toast.error('حدث خطأ أثناء جلب الوحدات الخاصة بك');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">وحداتي المستأجرة</h1>
      </div>

      {/* ملخص المستأجرين  النشطة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-blue-800">عقود الإيجار </h3>
                <p className="text-2xl font-bold text-blue-900">
                  {reservations.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-gray-800">إجمالي الوحدات</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {units.length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* قائمة الوحدات */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <UnitList
          units={units}
          isLoading={isLoading}
          refetch={fetchReservations}
          forTenant={true}
        />
      </div>

    </div>
  );
}
