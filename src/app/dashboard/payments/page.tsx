'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Payment } from '@/lib/types';
import { paymentsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import PaymentList from '@/components/payments/PaymentList';
import { formatCurrency } from '@/lib/utils';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // خيارات تصفية الحالة
  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'paid', label: 'مدفوع' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'refunded', label: 'مسترجع' },
    { value: 'failed', label: 'فاشل' },
  ];

  // خيارات تصفية طريقة الدفع
  const methodOptions = [
    { value: 'all', label: 'جميع الطرق' },
    { value: 'cash', label: 'نقدًا' },
    { value: 'credit_card', label: 'بطاقة ائتمان' },
    { value: 'bank_transfer', label: 'تحويل بنكي' },
    { value: 'check', label: 'شيك' },
    { value: 'other', label: 'أخرى' },
  ];

  // جلب المدفوعات عند تحميل المكون
  useEffect(() => {
    fetchPayments();
  }, []);

  // تطبيق التصفية عند تغيير المدفوعات أو مرشحات الحالة أو طريقة الدفع
  useEffect(() => {
    applyFilters();
  }, [payments, statusFilter, methodFilter]);

  // جلب بيانات المدفوعات
  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await paymentsApi.getAll();

      if (response.success) {
        setPayments(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب المدفوعات');
      }
    } catch (error) {
      console.error('خطأ في جلب المدفوعات:', error);
      toast.error('حدث خطأ أثناء جلب المدفوعات');
    } finally {
      setIsLoading(false);
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

  // التعامل مع حذف المدفوعة
  const handleDelete = (id: number) => {
    setPayments((prevPayments) => prevPayments.filter((payment) => payment.id !== id));
  };

  // حساب المجاميع
  const calculateTotal = (status: string = 'all') => {
    const filtered = status === 'all'
      ? payments
      : payments.filter(payment => payment.status === status);

    return filtered.reduce((sum, payment) => sum + Number(payment.amount) || 0, 0);
  };

  return (
    <div className="space-y-6">
      {/* العنوان مع أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">المدفوعات</h1>
        <Link href="/dashboard/payments/create">
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
        </Link>
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
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-purple-800">متأخرة</h3>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(calculateTotal('delayed'))}</p>
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
              label="طريقة الدفع"
              id="methodFilter"
              name="methodFilter"
              value={methodFilter}
              onChange={handleMethodFilterChange}
              options={methodOptions}
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* قائمة المدفوعات */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <PaymentList
          payments={filteredPayments}
          isLoading={isLoading}
          onDelete={handleDelete}
          refetch={fetchPayments}
        />
      </div>
    </div>
  );
}