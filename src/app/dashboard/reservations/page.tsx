'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Reservation } from '@/lib/types';
import { reservationsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import ReservationList from '@/components/reservations/ReservationList';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // خيارات تصفية الحالة
  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'active', label: 'نشط' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'expired', label: 'منتهي' },
    { value: 'cancelled', label: 'ملغي' },
  ];

  // جلب الحجوزات عند تحميل المكون
  useEffect(() => {
    fetchReservations();
  }, []);

  // تطبيق التصفية عند تغيير الحجوزات أو مرشح الحالة
  useEffect(() => {
    applyFilters();
  }, [reservations, statusFilter]);

  // جلب بيانات الحجوزات
  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const response = await reservationsApi.getAll();
      
      if (response.success) {
        setReservations(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب الحجوزات');
      }
    } catch (error) {
      console.error('خطأ في جلب الحجوزات:', error);
      toast.error('حدث خطأ أثناء جلب الحجوزات');
    } finally {
      setIsLoading(false);
    }
  };

  // تطبيق المرشحات على الحجوزات
  const applyFilters = () => {
    let filtered = [...reservations];
    
    // تطبيق مرشح الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter((reservation) => reservation.status === statusFilter);
    }
    
    setFilteredReservations(filtered);
  };

  // التعامل مع تغيير مرشح الحالة
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // التعامل مع حذف الحجز
  const handleDelete = (id: number) => {
    setReservations((prevReservations) => prevReservations.filter((reservation) => reservation.id !== id));
  };

  // بطاقات الإحصائيات
  const getStatusCount = (status: string) => {
    return reservations.filter(reservation => reservation.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* العنوان مع أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">الحجوزات</h1>
        <Link href="/dashboard/reservations/create">
          <Button
            variant="primary"
            leftIcon={
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            إنشاء حجز
          </Button>
        </Link>
      </div>
      
      {/* بطاقات ملخص الحالة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-green-800">نشط</h3>
                <p className="text-2xl font-bold text-green-900">{getStatusCount('active')}</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-yellow-800">قيد الانتظار</h3>
                <p className="text-2xl font-bold text-yellow-900">{getStatusCount('pending')}</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gray-50 border-gray-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-gray-800">منتهي</h3>
                <p className="text-2xl font-bold text-gray-900">{getStatusCount('expired')}</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-red-50 border-red-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-red-800">ملغي</h3>
                <p className="text-2xl font-bold text-red-900">{getStatusCount('cancelled')}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* المرشحات */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-64">
            <Select
              label="الحالة"
              id="statusFilter"
              name="statusFilter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              options={statusOptions}
              fullWidth
            />
          </div>
        </div>
      </div>
      
      {/* قائمة الحجوزات */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <ReservationList
          reservations={filteredReservations}
          isLoading={isLoading}
          onDelete={handleDelete}
          refetch={fetchReservations}
        />
      </div>
    </div>
  );
}