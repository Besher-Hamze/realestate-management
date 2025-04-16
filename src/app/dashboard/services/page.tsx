'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { ServiceOrder } from '@/lib/types';
import { servicesApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import ServiceList from '@/components/services/ServiceList';

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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

  // جلب الخدمات عند تحميل المكون
  useEffect(() => {
    fetchServices();
  }, []);

  // تطبيق التصفية عند تغير الخدمات أو تصفية الحالة أو تصفية النوع
  useEffect(() => {
    applyFilters();
  }, [services, statusFilter, typeFilter]);

  // جلب بيانات الخدمات
  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await servicesApi.getAll();

      if (response.success) {
        setServices(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب طلبات الخدمة');
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

  // التعامل مع حذف الخدمة
  const handleDelete = (id: number) => {
    setServices((prevServices) => prevServices.filter((service) => service.id !== id));
  };

  // بطاقات الإحصائيات
  const getStatusCount = (status: string) => {
    return services.filter(service => service.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* الترويسة مع أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">طلبات الخدمة</h1>
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
          onDelete={handleDelete}
          refetch={fetchServices}
        />
      </div>
    </div>
  );
}