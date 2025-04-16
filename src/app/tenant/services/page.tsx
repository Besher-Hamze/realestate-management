'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { ServiceOrder } from '@/lib/types';
import { servicesApi, reservationsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import ServiceList from '@/components/services/ServiceList';

export default function TenantServicesPage() {
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [hasReservations, setHasReservations] = useState(true);

  // خيارات تصفية الحالة
  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'in-progress', label: 'قيد التنفيذ' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'rejected', label: 'مرفوض' },
  ];

  // خيارات تصفية نوع الخدمة
  const typeOptions = [
    { value: 'all', label: 'جميع الأنواع' },
    { value: 'maintenance', label: 'صيانة' },
    { value: 'financial', label: 'مالي' },
    { value: 'administrative', label: 'إداري' },
  ];

  useEffect(() => {
    checkReservations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [services, statusFilter, typeFilter]);

  const checkReservations = async () => {
    try {
      const response = await reservationsApi.getMy();

      if (response.success) {
        const activeReservations = response.data.filter(res => res.status === 'active');

        if (activeReservations.length > 0) {
          setHasReservations(true);
          fetchServices();
        } else {
          setHasReservations(false);
          setIsLoading(false);
        }
      } else {
        toast.error(response.message || 'فشل في التحقق من الحجوزات');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('خطأ في التحقق من الحجوزات:', error);
      toast.error('حدث خطأ أثناء التحقق من حجوزاتك');
      setIsLoading(false);
    }
  };

  // جلب بيانات الخدمات
  const fetchServices = async () => {
    try {
      setIsLoading(true);

      // الحصول على حجوزاتي أولاً
      const reservationsResponse = await reservationsApi.getMy();

      if (reservationsResponse.success) {
        const reservationIds = reservationsResponse.data.map(res => res.id);

        // جلب طلبات الخدمة لكل حجز
        if (reservationIds.length > 0) {
          const servicePromises = reservationIds.map(id =>
            servicesApi.getByReservationId(id)
          );

          const serviceResponses = await Promise.all(servicePromises);
          const allServices = serviceResponses.flatMap(res =>
            res.success ? res.data : []
          );

          setServices(allServices);
        } else {
          setServices([]);
        }
      } else {
        toast.error(reservationsResponse.message || 'فشل في جلب الحجوزات');
      }
    } catch (error) {
      console.error('خطأ في جلب الخدمات:', error);
      toast.error('حدث خطأ أثناء جلب طلبات الخدمة');
    } finally {
      setIsLoading(false);
    }
  };

  // تطبيق التصفية على الخدمات
  const applyFilters = () => {
    let filtered = [...services];

    // تطبيق تصفية الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter((service) => service.status === statusFilter);
    }

    // تطبيق تصفية النوع
    if (typeFilter !== 'all') {
      filtered = filtered.filter((service) => service.serviceType === typeFilter);
    }

    setFilteredServices(filtered);
  };

  // التعامل مع تغيير تصفية الحالة
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // التعامل مع تغيير تصفية النوع
  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value);
  };

  // بطاقات الإحصائيات
  const getStatusCount = (status: string) => {
    return services.filter(service => service.status === status).length;
  };

  // عرض حالة "لا توجد حجوزات"
  if (!hasReservations) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold text-gray-900">طلبات الخدمة</h1>
        </div>

        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <h2 className="text-xl font-medium text-gray-900 mb-2">لم يتم العثور على عقود إيجار نشطة</h2>
          <p className="text-gray-600 mb-6">تحتاج إلى عقد إيجار نشط لتقديم طلبات الخدمة.</p>
          <Link href="/tenant/units">
            <Button>عرض وحداتي</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* الترويسة مع أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">طلبات الخدمة</h1>
        <Link href="/tenant/services/create">
          <Button
            variant="primary"
            leftIcon={
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            طلب خدمة جديد
          </Button>
        </Link>
      </div>

      {/* بطاقات ملخص الحالة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-blue-800">قيد التنفيذ</h3>
                <p className="text-2xl font-bold text-blue-900">{getStatusCount('in-progress')}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-green-800">مكتمل</h3>
                <p className="text-2xl font-bold text-green-900">{getStatusCount('completed')}</p>
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
          <div className="w-full sm:w-64">
            <Select
              label="نوع الخدمة"
              id="typeFilter"
              name="typeFilter"
              value={typeFilter}
              onChange={handleTypeFilterChange}
              options={typeOptions}
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* قائمة الخدمات */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <ServiceList
          services={filteredServices}
          isLoading={isLoading}
          refetch={fetchServices}
          forTenant={true}
        />
      </div>
    </div>
  );
}