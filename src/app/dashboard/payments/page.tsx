'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Payment, Building, RealEstateUnit } from '@/lib/types';
import { paymentsApi, buildingsApi, unitsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { formatCurrency } from '@/lib/utils';
import EnhancedPaymentList from '@/components/payments/EnhancedPaymentList';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<RealEstateUnit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<RealEstateUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');

  // خيارات تصفية الحالة
  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'paid', label: 'مدفوع' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'delayed', label: 'متأخر' },
    { value: 'cancelled', label: 'ملغاة' },
  ];

  // خيارات تصفية طريقة الدفع
  const methodOptions = [
    { value: 'all', label: 'جميع الطرق' },
    { value: 'cash', label: 'نقدًا' },
    { value: 'credit_card', label: 'بطاقة ائتمان' },
    { value: 'bank_transfer', label: 'تحويل بنكي' },
    { value: 'checks', label: 'شيك' },
    { value: 'other', label: 'أخرى' },
  ];

  // خيارات تصفية المباني
  const buildingOptions = [
    { value: 'all', label: 'جميع المباني' },
    ...buildings.map(building => ({
      value: building.id.toString(),
      label: `${building.name} - ${building.buildingNumber}`
    }))
  ];

  // خيارات تصفية الوحدات
  const unitOptions = [
    { value: 'all', label: 'جميع الوحدات' },
    ...filteredUnits.map(unit => ({
      value: unit.id.toString(),
      label: `وحدة ${unit.unitNumber}${unit.building ? ` - ${unit.building.name}` : ''}`
    }))
  ];

  // جلب المدفوعات والمباني والوحدات عند تحميل المكون
  useEffect(() => {
    fetchInitialData();
  }, []);

  // تطبيق التصفية عند تغيير المدفوعات أو المرشحات
  useEffect(() => {
    applyFilters();
  }, [payments, statusFilter, methodFilter, buildingFilter, unitFilter]);

  // تحديث قائمة الوحدات عند تغيير المبنى المحدد
  useEffect(() => {
    filterUnitsByBuilding();
    // إعادة تعيين فلتر الوحدة عند تغيير المبنى
    if (buildingFilter !== 'all') {
      setUnitFilter('all');
    }
  }, [buildingFilter, units]);

  // جلب البيانات الأولية
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchPayments(),
        fetchBuildings(),
        fetchUnits()
      ]);
    } catch (error) {
      console.error('خطأ في جلب البيانات الأولية:', error);
      toast.error('حدث خطأ أثناء جلب البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب بيانات المدفوعات
  const fetchPayments = async () => {
    try {
      const response = await paymentsApi.getAll();
      if (response.success) {
        setPayments(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب المدفوعات');
      }
    } catch (error) {
      console.error('خطأ في جلب المدفوعات:', error);
      toast.error('حدث خطأ أثناء جلب المدفوعات');
    }
  };

  // جلب بيانات المباني
  const fetchBuildings = async () => {
    try {
      const response = await buildingsApi.getAll();
      if (response.success) {
        setBuildings(response.data);
      } else {
        console.error('فشل في جلب المباني:', response.message);
      }
    } catch (error) {
      console.error('خطأ في جلب المباني:', error);
    }
  };

  // جلب بيانات الوحدات
  const fetchUnits = async () => {
    try {
      const response = await unitsApi.getAll();
      if (response.success) {
        setUnits(response.data);
        setFilteredUnits(response.data);
      } else {
        console.error('فشل في جلب الوحدات:', response.message);
      }
    } catch (error) {
      console.error('خطأ في جلب الوحدات:', error);
    }
  };

  // تصفية الوحدات حسب المبنى المحدد
  const filterUnitsByBuilding = () => {
    if (buildingFilter === 'all') {
      setFilteredUnits(units);
    } else {
      const filtered = units.filter(unit => unit.buildingId.toString() === buildingFilter);
      setFilteredUnits(filtered);
    }
  };

  // تطبيق المرشحات على المدفوعات
  const applyFilters = () => {
    let filtered = [...payments];

    // تطبيق مرشح الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // تطبيق مرشح طريقة الدفع
    if (methodFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.paymentMethod === methodFilter);
    }

    // تطبيق مرشح المبنى
    if (buildingFilter !== 'all') {
      filtered = filtered.filter((payment) =>
        payment.reservation?.unit?.buildingId?.toString() === buildingFilter
      );
    }

    // تطبيق مرشح الوحدة
    if (unitFilter !== 'all') {
      filtered = filtered.filter((payment) =>
        payment.reservation?.unit?.id?.toString() === unitFilter
      );
    }

    setFilteredPayments(filtered);
  };

  // التعامل مع تغيير مرشح الحالة
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // التعامل مع تغيير مرشح طريقة الدفع
  const handleMethodFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMethodFilter(e.target.value);
  };

  // التعامل مع تغيير مرشح المبنى
  const handleBuildingFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBuildingFilter(e.target.value);
  };

  // التعامل مع تغيير مرشح الوحدة
  const handleUnitFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUnitFilter(e.target.value);
  };

  // إعادة تعيين جميع المرشحات
  const resetFilters = () => {
    setStatusFilter('all');
    setMethodFilter('all');
    setBuildingFilter('all');
    setUnitFilter('all');
  };

  // التعامل مع حذف المدفوعة
  const handleDelete = (id: number) => {
    setPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== id));
  };

  // حساب المجاميع
  const calculateTotal = (status: string = 'all') => {
    const filtered = status === 'all'
      ? filteredPayments // استخدام المدفوعات المفلترة بدلاً من جميع المدفوعات
      : filteredPayments.filter(payment => payment.status === status);

    return filtered.reduce((sum, payment) => sum + Number(payment.amount) || 0, 0);
  };

  // حساب عدد المدفوعات لكل حالة
  const getPaymentCount = (status: string = 'all') => {
    if (status === 'all') {
      return filteredPayments.length;
    }
    return filteredPayments.filter(payment => payment.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* العنوان مع أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">المدفوعات</h1>
        {/* <Link href="/dashboard/payments/create">
          <Button
            variant="primary"
            leftIcon={
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            إضافة مدفوعة
          </Button>
        </Link> */}
      </div>

      {/* بطاقات ملخص المدفوعات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-blue-800">إجمالي المدفوعات</h3>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(calculateTotal())}</p>
                <p className="text-sm text-blue-600">{getPaymentCount()} مدفوعة</p>
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
                <h3 className="font-medium text-green-800">مدفوعة</h3>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(calculateTotal('paid'))}</p>
                <p className="text-sm text-green-600">{getPaymentCount('paid')} مدفوعة</p>
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
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(calculateTotal('pending'))}</p>
                <p className="text-sm text-yellow-600">{getPaymentCount('pending')} مدفوعة</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-red-800">متأخرة</h3>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(calculateTotal('delayed'))}</p>
                <p className="text-sm text-red-600">{getPaymentCount('delayed')} مدفوعة</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* المرشحات */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col space-y-4">
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
                label="طريقة الدفع"
                id="methodFilter"
                name="methodFilter"
                value={methodFilter}
                onChange={handleMethodFilterChange}
                options={methodOptions}
                fullWidth
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                label="المبنى"
                id="buildingFilter"
                name="buildingFilter"
                value={buildingFilter}
                onChange={handleBuildingFilterChange}
                options={buildingOptions}
                fullWidth
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                label="الوحدة"
                id="unitFilter"
                name="unitFilter"
                value={unitFilter}
                onChange={handleUnitFilterChange}
                options={unitOptions}
                fullWidth
                disabled={buildingFilter === 'all' && filteredUnits.length === units.length}
              />
            </div>
          </div>

          {/* أزرار إعادة التعيين والعدادات */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              إعادة تعيين المرشحات
            </button>

            <div className="text-sm text-gray-600">
              عرض {filteredPayments.length} من أصل {payments.length} مدفوعة
              {(statusFilter !== 'all' || methodFilter !== 'all' || buildingFilter !== 'all' || unitFilter !== 'all') && (
                <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  مفلترة
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* قائمة المدفوعات */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <EnhancedPaymentList
          payments={filteredPayments}
          isLoading={isLoading}
          onRefresh={fetchInitialData}
          reservationId={0}
        />
      </div>
    </div>
  );
}