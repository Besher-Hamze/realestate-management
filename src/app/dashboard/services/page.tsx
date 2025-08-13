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
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

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

  // استخراج أسماء المباني الفريدة من البيانات
  const getBuildingOptions = () => {
    const buildings = services
      .map(service => service.reservation?.unit?.building)
      .filter((building, index, self) =>
        building && self.findIndex(b => b?.id === building.id) === index
      )
      .map(building => ({
        value: building!.id.toString(),
        label: building!.name
      }));

    return [
      { value: 'all', label: 'جميع المباني' },
      ...buildings
    ];
  };

  // جلب الخدمات عند تحميل المكون
  useEffect(() => {
    fetchServices();
  }, []);

  // تطبيق التصفية عند تغير الخدمات أو أي من الفلاتر
  useEffect(() => {
    applyFilters();
  }, [services, statusFilter, typeFilter, buildingFilter, dateFromFilter, dateToFilter]);

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

    // تطبيق تصفية المبنى
    if (buildingFilter !== 'all') {
      filtered = filtered.filter((service) =>
        service.reservation?.unit?.building?.id === parseInt(buildingFilter)
      );
    }

    // تطبيق تصفية التاريخ من
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      filtered = filtered.filter((service) => {
        const serviceDate = new Date(service.createdAt);
        return serviceDate >= fromDate;
      });
    }

    // تطبيق تصفية التاريخ إلى
    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      // إضافة يوم واحد للتاريخ النهائي لتشمل نهاية اليوم
      toDate.setDate(toDate.getDate() + 1);
      filtered = filtered.filter((service) => {
        const serviceDate = new Date(service.createdAt);
        return serviceDate < toDate;
      });
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

  // التعامل مع تغيير تصفية المبنى
  const handleBuildingFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBuildingFilter(e.target.value);
  };

  // التعامل مع تغيير تاريخ البداية
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFromFilter(e.target.value);
  };

  // التعامل مع تغيير تاريخ النهاية
  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateToFilter(e.target.value);
  };

  // التعامل مع حذف الخدمة
  const handleDelete = (id: number) => {
    setServices((prevServices) => prevServices.filter((service) => service.id !== id));
  };

  // بطاقات الإحصائيات (بناءً على البيانات المفلترة)
  const getStatusCount = (status: string) => {
    return filteredServices.filter(service => service.status === status).length;
  };

  // إعادة تعيين جميع الفلاتر
  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setBuildingFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  };

  // تحقق من وجود فلاتر نشطة
  const hasActiveFilters = () => {
    return statusFilter !== 'all' ||
      typeFilter !== 'all' ||
      buildingFilter !== 'all' ||
      dateFromFilter !== '' ||
      dateToFilter !== '';
  };

  return (
    <div className="space-y-6">
      {/* الترويسة مع أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">طلبات الخدمة</h1>
      </div>

      {/* بطاقات ملخص الحالة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <h3 className="font-medium text-red-800">مرفوض</h3>
                <p className="text-2xl font-bold text-red-900">{getStatusCount('rejected')}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-gray-800">المجموع</h3>
                <p className="text-2xl font-bold text-gray-900">{filteredServices.length}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* قسم الفلاتر */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* فلتر الحالة */}
          <div>
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

          {/* فلتر نوع الخدمة */}
          <div>
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

          {/* فلتر المبنى */}
          <div>
            <Select
              label="المبنى"
              id="buildingFilter"
              name="buildingFilter"
              value={buildingFilter}
              onChange={handleBuildingFilterChange}
              options={getBuildingOptions()}
              fullWidth
            />
          </div>

          {/* فلتر التاريخ من */}
          <div>
            <label htmlFor="dateFromFilter" className="block text-sm font-medium text-gray-700 mb-1">
              من تاريخ
            </label>
            <input
              type="date"
              id="dateFromFilter"
              name="dateFromFilter"
              value={dateFromFilter}
              onChange={handleDateFromChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* فلتر التاريخ إلى */}
          <div>
            <label htmlFor="dateToFilter" className="block text-sm font-medium text-gray-700 mb-1">
              إلى تاريخ
            </label>
            <input
              type="date"
              id="dateToFilter"
              name="dateToFilter"
              value={dateToFilter}
              onChange={handleDateToChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* زر إعادة تعيين الفلاتر */}
        {hasActiveFilters() && (
          <div className="mt-4 flex justify-start">
            <Button
              variant="secondary"
              onClick={resetFilters}
              leftIcon={
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              إعادة تعيين الفلاتر
            </Button>
          </div>
        )}

        {/* عرض الفلاتر النشطة */}
        {hasActiveFilters() && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">الفلاتر النشطة:</span>

              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  الحالة: {statusOptions.find(opt => opt.value === statusFilter)?.label}
                </span>
              )}

              {typeFilter !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  النوع: {typeOptions.find(opt => opt.value === typeFilter)?.label}
                </span>
              )}

              {buildingFilter !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  المبنى: {getBuildingOptions().find(opt => opt.value === buildingFilter)?.label}
                </span>
              )}

              {dateFromFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  من: {new Date(dateFromFilter).toLocaleDateString('ar-SA')}
                </span>
              )}

              {dateToFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  إلى: {new Date(dateToFilter).toLocaleDateString('ar-SA')}
                </span>
              )}
            </div>
          </div>
        )}
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