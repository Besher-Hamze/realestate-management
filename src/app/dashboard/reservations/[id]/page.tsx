'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Reservation, ServiceOrder, Payment } from '@/lib/types';
import { reservationsApi, servicesApi, paymentsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Table, { TableColumn } from '@/components/ui/Table';
import { formatDate, formatCurrency } from '@/lib/utils';
import EnhancedPaymentList from '@/components/payments/EnhancedPaymentList';

interface ReservationDetailPageProps {
  params: Promise<{
    id: string;
  }>;

}

export default function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // جلب تفاصيل الحجز عند تحميل المكون
  useEffect(() => {
    fetchReservation();
  }, [id]);

  // جلب بيانات الحجز
  const fetchReservation = async () => {
    try {
      setIsLoading(true);
      const response = await reservationsApi.getById(id);

      if (response.success) {
        setReservation(response.data);
        fetchServiceOrders(response.data.id);
        fetchPayments(response.data.id);
      } else {
        toast.error(response.message || 'فشل في جلب تفاصيل الحجز');
      }
    } catch (error) {
      console.error('خطأ في جلب الحجز:', error);
      toast.error('حدث خطأ أثناء جلب تفاصيل الحجز');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب طلبات الخدمة لهذا الحجز
  const fetchServiceOrders = async (reservationId: number) => {
    try {
      setIsServicesLoading(true);
      const response = await servicesApi.getByReservationId(reservationId);

      if (response.success) {
        setServiceOrders(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب طلبات الخدمة');
      }
    } catch (error) {
      console.error('خطأ في جلب طلبات الخدمة:', error);
      toast.error('حدث خطأ أثناء جلب طلبات الخدمة');
    } finally {
      setIsServicesLoading(false);
    }
  };

  // جلب المدفوعات لهذا الحجز
  const fetchPayments = async (reservationId: number) => {
    try {
      setIsPaymentsLoading(true);
      const response = await paymentsApi.getByReservationId(reservationId);

      if (response.success) {
        setPayments(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب المدفوعات');
      }
    } catch (error) {
      console.error('خطأ في جلب المدفوعات:', error);
      toast.error('حدث خطأ أثناء جلب المدفوعات');
    } finally {
      setIsPaymentsLoading(false);
    }
  };

  // حذف الحجز
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await reservationsApi.delete(id);

      if (response.success) {
        toast.success('تم حذف الحجز بنجاح');
        router.push('/dashboard/reservations');
      } else {
        toast.error(response.message || 'فشل في حذف الحجز');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('خطأ في حذف الحجز:', error);
      toast.error('حدث خطأ أثناء حذف الحجز');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // فتح نافذة تحديث الحالة
  const openStatusUpdateModal = (status: string) => {
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // تحديث حالة الحجز
  const handleStatusUpdate = async () => {
    if (!reservation || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await reservationsApi.update(reservation.id, {
        ...reservation,
        status: newStatus,
      });

      if (response.success) {
        toast.success(`تم تحديث حالة الحجز إلى ${getStatusName(newStatus)}`);
        setStatusUpdateModalOpen(false);
        setReservation(response.data as any);
      } else {
        toast.error(response.message || 'فشل في تحديث حالة الحجز');
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الحجز:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الحجز');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // الحصول على اسم الحالة بالعربية
  const getStatusName = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'pending': return 'قيد الانتظار';
      case 'expired': return 'منتهي';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  // تعريف أعمدة جدول طلبات الخدمة
  const serviceOrderColumns: TableColumn<ServiceOrder>[] = [
    {
      key: 'type',
      header: 'النوع',
      cell: (service) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 capitalize">{service.serviceType}</span>
          <span className="text-xs text-gray-500 capitalize">{service.serviceSubtype}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'الوصف',
      cell: (service) => (
        <div className="max-w-xs">
          <p className="text-gray-700 truncate">{service.description}</p>
        </div>
      ),
    },
    {
      key: 'created',
      header: 'تاريخ التقديم',
      cell: (service) => <span className="text-gray-700">{formatDate(service.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (service) => {
        let statusText = '';
        switch (service.status) {
          case 'pending': statusText = 'قيد الانتظار'; break;
          case 'in-progress': statusText = 'قيد التنفيذ'; break;
          case 'completed': statusText = 'مكتمل'; break;
          default: statusText = 'ملغي';
        }

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              service.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                service.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
              }`}
          >
            {statusText}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (service) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/services/${service.id}`}>
            <Button size="xs" variant="outline">عرض</Button>
          </Link>
        </div>
      ),
    },
  ];

  // تعريف أعمدة جدول المدفوعات
  const paymentColumns: TableColumn<Payment>[] = [
    {
      key: 'date',
      header: 'تاريخ الاستحقاق',
      cell: (payment) => <span className="text-gray-700">{formatDate(payment.paymentDate)}</span>,
    },
    {
      key: 'amount',
      header: 'المبلغ',
      cell: (payment) => <span className="text-gray-900 font-medium">{formatCurrency(payment.amount)}</span>,
    },
    {
      key: 'method',
      header: 'الطريقة',
      cell: (payment) => {
        let method = payment.paymentMethod.replace('_', ' ');
        switch (method) {
          case 'cash': method = 'نقدًا'; break;
          case 'credit card': method = 'بطاقة ائتمان'; break;
          case 'bank transfer': method = 'تحويل بنكي'; break;
          case 'check': method = 'شيك'; break;
          case 'other': method = 'أخرى'; break;
        }
        return <span className="text-gray-700">{method}</span>;
      },
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (payment) => {
        let statusText = '';
        let statusClass = '';

        switch (payment.status) {
          case 'paid':
            statusText = 'مدفوعة';
            statusClass = 'bg-green-100 text-green-800';
            break;
          case 'pending':
            statusText = 'قيد الانتظار';
            statusClass = 'bg-yellow-100 text-yellow-800';
            break;
          case 'delayed':
            statusText = 'متاخرة';
            statusClass = 'bg-purple-100 text-purple-800';
            break;
          case 'cancelled':
            statusText = 'ملغية';
            statusClass = 'bg-red-100 text-red-800';
            break;
        }

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {statusText}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (payment) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/payments/${payment.id}`}>
            <Button size="xs" variant="outline">عرض</Button>
          </Link>
        </div>
      ),
    },
  ];

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-primary-500 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">جاري تحميل تفاصيل الحجز...</p>
        </div>
      </div>
    );
  }

  // عرض حالة عدم العثور على الحجز
  if (!reservation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">لم يتم العثور على الحجز</h2>
        <p className="text-gray-600 mb-6">الحجز الذي تبحث عنه غير موجود أو ليس لديك صلاحية مشاهدته.</p>
        <Link href="/dashboard/reservations">
          <Button>العودة إلى الحجوزات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان مع مسار التنقل والإجراءات */}
      <div className="flex flex-col space-y-4">
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
              <span className="text-gray-700">#{reservation.id}</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            الحجز #{reservation.id}
          </h1>
          <div className="flex space-x-3">
            <Link href={`/dashboard/reservations/${reservation.id}/edit`}>
              <Button variant="outline">تعديل</Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>حذف</Button>
          </div>
        </div>
      </div>

      {/* تفاصيل الحجز */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المعلومات الرئيسية */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">تفاصيل الحجز</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reservation.status === 'active' ? 'bg-green-100 text-green-800' :
                  reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    reservation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                  }`}
              >
                {getStatusName(reservation.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">تاريخ البدء</h3>
                <p className="mt-1 text-base text-gray-900">
                  {formatDate(reservation.startDate)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">تاريخ الانتهاء</h3>
                <p className="mt-1 text-base text-gray-900">
                  {formatDate(reservation.endDate)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">الحالة</h3>
                <p className="mt-1 text-base text-gray-900">
                  {getStatusName(reservation.status)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">تاريخ الإنشاء</h3>
                <p className="mt-1 text-base text-gray-900">
                  {formatDate(reservation.createdAt)}
                </p>
              </div>
            </div>

            {/* الملاحظات */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">ملاحظات</h3>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-gray-700 whitespace-pre-line">
                  {reservation.notes || 'لا توجد ملاحظات مقدمة'}
                </p>
              </div>
            </div>

            {/* العقد */}
            {reservation.contractImageUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">وثيقة العقد</h3>
                <a
                  href={reservation.contractImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="ml-2 -mr-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  عرض العقد
                </a>
              </div>
            )}

            {/* أزرار تحديث الحالة */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">إجراءات الحجز</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openStatusUpdateModal('active')}
                  disabled={reservation.status === 'active'}
                  className="border-green-500 text-green-700 hover:bg-green-50 disabled:opacity-50"
                >
                  تحديد كنشط
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openStatusUpdateModal('pending')}
                  disabled={reservation.status === 'pending'}
                  className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                >
                  تحديد كقيد الانتظار
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openStatusUpdateModal('expired')}
                  disabled={reservation.status === 'expired'}
                  className="border-gray-500 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  تحديد كمنتهي
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openStatusUpdateModal('cancelled')}
                  disabled={reservation.status === 'cancelled'}
                  className="border-red-500 text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  تحديد كملغي
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* معلومات المستأجر */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات المستأجر</h2>

            {reservation.user ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">الاسم</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {reservation.user.fullName}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">البريد الإلكتروني</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {reservation.user.email}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">الهاتف</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {reservation.user.phone}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">اسم المستخدم</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {reservation.user.username}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500"> كلمة المرور الإبتدائية</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {reservation.user.copassword}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">تاريخ الانضمام</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {formatDate(reservation.user.createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">معلومات المستأجر غير متاحة</p>
            )}
          </div>
        </Card>
      </div>

      {/* المدفوعات */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">سجل المدفوعات</h2>
          <Link href={`/dashboard/payments/create?reservationId=${reservation.id}`}>
            <Button
              variant="primary"
              size="sm"
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

        <Card>
          <EnhancedPaymentList
            payments={payments}
            isLoading={isPaymentsLoading}
            reservationId={reservation.id}
            onRefresh={() => fetchPayments(reservation.id)}
          />
        </Card>
      </div>

      {/* طلبات الخدمة */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">طلبات الخدمة</h2>

        </div>

        <Card>
          <Table
            data={serviceOrders}
            columns={serviceOrderColumns}
            keyExtractor={(service) => service.id}
            isLoading={isServicesLoading}
            emptyMessage="لم يتم العثور على طلبات خدمة لهذا الحجز"
            onRowClick={(service) => router.push(`/dashboard/services/${service.id}`)}
          />
        </Card>
      </div>

      {/* نافذة تأكيد الحذف */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="حذف الحجز"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            هل أنت متأكد أنك تريد حذف هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
            <p className="text-sm font-medium">تحذير</p>
            <p className="text-sm">حذف هذا الحجز سيؤدي إلى إزالة وصول المستأجر إلى هذه الوحدة وأي طلبات خدمة مرتبطة بها.</p>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              disabled={isDeleting}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={statusUpdateModalOpen}
        onClose={() => setStatusUpdateModalOpen(false)}
        title="تحديث حالة الحجز"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            هل أنت متأكد أنك تريد تغيير الحالة إلى{" "}
            <span className="font-medium">{getStatusName(newStatus)}</span>؟
          </p>
          {newStatus === 'cancelled' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
              <p className="text-sm font-medium">تحذير</p>
              <p className="text-sm">إلغاء هذا الحجز سيؤدي إلى إزالة وصول المستأجر إلى هذه الوحدة.</p>
            </div>
          )}
          {newStatus === 'expired' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-700">
              <p className="text-sm font-medium">ملاحظة</p>
              <p className="text-sm">تحديد هذا الحجز كمنتهي سيغير حالة الوحدة إلى متاحة.</p>
            </div>
          )}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setStatusUpdateModalOpen(false)}
              disabled={isUpdatingStatus}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              onClick={handleStatusUpdate}
              isLoading={isUpdatingStatus}
              disabled={isUpdatingStatus}
            >
              تحديث الحالة
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}