'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useForm, Controller } from 'react-hook-form';
import { Reservation, ServiceOrder, Payment } from '@/lib/types';
import { reservationsApi, servicesApi, paymentsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Table, { TableColumn } from '@/components/ui/Table';
import { FormInput, FormTextArea, FormSelect, FormFileInput } from '@/components/ui/FormInputs';
import { formatDate, formatCurrency } from '@/lib/utils';
import EnhancedPaymentList from '@/components/payments/EnhancedPaymentList';
import { useAuth } from '@/contexts/AuthContext';

interface ReservationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface DepositFormData {
  includesDeposit: boolean;
  depositAmount?: number;
  depositPaymentMethod?: 'cash' | 'check';
  depositStatus?: 'unpaid' | 'paid' | 'returned';
  depositPaidDate?: string;
  depositReturnedDate?: string;
  depositNotes?: string;
  depositCheckImage?: File | null;
}

const DEPOSIT_PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'نقدي' },
  { value: 'check', label: 'شيك' },
];

const DEPOSIT_STATUS_OPTIONS = [
  { value: 'unpaid', label: 'غير مدفوع' },
  { value: 'paid', label: 'مدفوع' },
  { value: 'returned', label: 'مسترجع' },
];

export default function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
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

  // Quick edit deposit modal state
  const [depositEditModalOpen, setDepositEditModalOpen] = useState(false);
  const [isUpdatingDeposit, setIsUpdatingDeposit] = useState(false);

  // Deposit form
  const {
    register: registerDeposit,
    handleSubmit: handleSubmitDeposit,
    control: controlDeposit,
    formState: { errors: errorsDeposit },
    reset: resetDeposit,
    watch: watchDeposit,
    setValue: setValueDeposit,
  } = useForm<DepositFormData>();

  const watchedIncludesDeposit = watchDeposit('includesDeposit');
  const watchedDepositPaymentMethod = watchDeposit('depositPaymentMethod');
  const watchedDepositStatus = watchDeposit('depositStatus');

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

  // Open deposit edit modal and populate form
  const openDepositEditModal = () => {
    if (!reservation) return;

    resetDeposit({
      includesDeposit: reservation.includesDeposit || false,
      depositAmount: reservation.depositAmount || undefined,
      depositPaymentMethod: reservation.depositPaymentMethod || 'cash',
      depositStatus: reservation.depositStatus || 'unpaid',
      depositPaidDate: reservation.depositPaidDate ? reservation.depositPaidDate.split('T')[0] : undefined,
      depositReturnedDate: reservation.depositReturnedDate ? reservation.depositReturnedDate.split('T')[0] : undefined,
      depositNotes: reservation.depositNotes || '',
      depositCheckImage: null,
    });
    setDepositEditModalOpen(true);
  };

  // Handle deposit update
  const handleDepositUpdate = async (data: DepositFormData) => {
    if (!reservation) return;

    try {
      setIsUpdatingDeposit(true);

      // Prepare form data for file upload
      const formData = new FormData();

      // Add deposit fields
      formData.append('includesDeposit', data.includesDeposit.toString());
      if (data.includesDeposit) {
        if (data.depositAmount) formData.append('depositAmount', data.depositAmount.toString());
        if (data.depositPaymentMethod) formData.append('depositPaymentMethod', data.depositPaymentMethod);
        if (data.depositStatus) formData.append('depositStatus', data.depositStatus);
        if (data.depositPaidDate) formData.append('depositPaidDate', data.depositPaidDate);
        if (data.depositReturnedDate) formData.append('depositReturnedDate', data.depositReturnedDate);
        if (data.depositNotes) formData.append('depositNotes', data.depositNotes);
        if (data.depositCheckImage) formData.append('depositCheckImage', data.depositCheckImage);
      }

      // Add existing reservation data to maintain other fields
      formData.append('unitId', reservation.unitId.toString());
      formData.append('contractType', reservation.contractType);
      formData.append('startDate', reservation.startDate);
      formData.append('endDate', reservation.endDate);
      formData.append('paymentMethod', reservation.paymentMethod);
      formData.append('paymentSchedule', reservation.paymentSchedule);
      if (reservation.notes) formData.append('notes', reservation.notes);

      const response = await reservationsApi.update(reservation.id, data);

      if (response.success) {
        toast.success('تم تحديث معلومات التأمين بنجاح');
        setDepositEditModalOpen(false);
        // Refresh reservation data
        await fetchReservation();
      } else {
        toast.error(response.message || 'فشل في تحديث معلومات التأمين');
      }
    } catch (error) {
      console.error('خطأ في تحديث معلومات التأمين:', error);
      toast.error('حدث خطأ أثناء تحديث معلومات التأمين');
    } finally {
      setIsUpdatingDeposit(false);
    }
  };

  // Handle file change for deposit check image
  const handleDepositFileChange = (files: FileList | null) => {
    const file = files?.[0] || null;
    setValueDeposit('depositCheckImage', file);
  };

  // جلب طلبات الخدمة لهذا الحجز
  const fetchServiceOrders = async (reservationId: number) => {
    try {
      setIsServicesLoading(true);
      const response = await servicesApi.getByReservationId(reservationId);
      if (response.success) {
        console.log(response.data);

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
          <Button>العودة إلى المستأجرين </Button>
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
              <Link href="/dashboard/reservations" className="hover:text-primary-600">المستأجرين </Link>
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
          <div className="flex space-x-3 ">
            {user && user.role == "manager" && <>
              <Link href={`/dashboard/reservations/${reservation.id}/edit`}>
                <Button variant="outline" className='mx-4'>تعديل</Button>
              </Link>
              <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>حذف</Button></>}
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
                  reservation.status === 'cancelled' ? 'bg-yellow-100 text-yellow-800' :
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

            {/* Enhanced Deposit Section with Quick Edit */}
            {reservation.includesDeposit && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-500">معلومات التأمين</h3>
                  {user && user.role === "manager" && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={openDepositEditModal}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      تعديل سريع
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                  {reservation.depositAmount && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">مبلغ التأمين</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {formatCurrency(reservation.depositAmount)}
                      </p>
                    </div>
                  )}

                  {reservation.depositPaymentMethod && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">طريقة دفع التأمين</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {reservation.depositPaymentMethod === 'cash' ? 'نقدًا' : 'شيك'}
                      </p>
                    </div>
                  )}

                  {reservation.depositStatus && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">حالة التأمين</h3>
                      <p className="mt-1 text-base text-gray-900">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${reservation.depositStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          reservation.depositStatus === 'returned' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {reservation.depositStatus === 'unpaid' ? 'غير مدفوع' :
                            reservation.depositStatus === 'paid' ? 'مدفوع' : 'مسترجع'}
                        </span>
                      </p>
                    </div>
                  )}

                  {reservation.depositPaidDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">تاريخ دفع التأمين</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {formatDate(reservation.depositPaidDate)}
                      </p>
                    </div>
                  )}

                  {reservation.depositReturnedDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">تاريخ استرجاع التأمين</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {formatDate(reservation.depositReturnedDate)}
                      </p>
                    </div>
                  )}

                  {reservation.depositCheckImageUrl && (
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">صورة شيك التأمين</h3>
                      <a
                        href={reservation.depositCheckImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="ml-2 -mr-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        عرض صورة الشيك
                      </a>
                    </div>
                  )}

                  {reservation.depositNotes && (
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">ملاحظات التأمين</h3>
                      <p className="text-gray-700 whitespace-pre-line">
                        {reservation.depositNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* الملاحظات */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">ملاحظات</h3>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-gray-700 whitespace-pre-line">
                  {reservation.notes || 'لا توجد ملاحظات مقدمة'}
                </p>
              </div>
            </div>

            {/* العقد والوثائق */}
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

            {reservation.contractPdfUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2"> PDF وثيقة العقد</h3>
                <a
                  href={reservation.contractPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="ml-2 -mr-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  عرض
                </a>
              </div>
            )}

            {/* Identity Documents */}
            {reservation.user && reservation.user.identityImageFrontUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2"> الوجه الأمامي للهوية</h3>
                <a
                  href={reservation.user.identityImageFrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="ml-2 -mr-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  عرض
                </a>
              </div>
            )}

            {reservation.user && reservation.user.identityImageBackUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2"> الوجه الخلفي للهوية</h3>
                <a
                  href={reservation.user.identityImageBackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="ml-2 -mr-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  عرض
                </a>
              </div>
            )}

            {reservation.commercialRegisterImageUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2"> صورة السجل التجاري</h3>
                <a
                  href={reservation.commercialRegisterImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="ml-2 -mr-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  عرض
                </a>
              </div>
            )}

            {/* أزرار تحديث الحالة */}
            {user && user.role === "manager" && (
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
            )}
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
                  <h3 className="text-sm font-medium text-gray-500"> كلمة المرور </h3>
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
                {reservation.user.tenantInfo &&
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500"> نوع المستأجر </h3>
                      <p className="mt-1 text-base text-gray-900">
                        {reservation.user.tenantInfo.tenantType}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500"> المنصب </h3>
                      <p className="mt-1 text-base text-gray-900">
                        {reservation.user.tenantInfo.contactPosition}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500"> نشاطات تجارية </h3>
                      <p className="mt-1 text-base text-gray-900">
                        {reservation.user.tenantInfo.businessActivities}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500"> رقم التواصل </h3>
                      <p className="mt-1 text-base text-gray-900">
                        {reservation.user.tenantInfo.contactPerson}
                      </p>
                    </div>

                  </>
                }

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
      {user && (user.role == "manager" || user.role == "tenant" || user.role == "maintenance" || user.role == "admin") &&
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
      }

      {/* Quick Edit Deposit Modal */}
      <Modal
        isOpen={depositEditModalOpen}
        onClose={() => setDepositEditModalOpen(false)}
        title="تعديل سريع لمعلومات التأمين"
        size="lg"
      >
        <div className="p-6">
          <form onSubmit={handleSubmitDeposit(handleDepositUpdate)} className="space-y-6">
            {/* Include Deposit Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                {...registerDeposit('includesDeposit')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="mr-2 block text-sm text-gray-700">يتضمن مبلغ تأمين</label>
            </div>

            {/* Deposit Fields */}
            {watchedIncludesDeposit && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="مبلغ التأمين"
                    register={registerDeposit}
                    name="depositAmount"
                    type="number"
                    error={errorsDeposit.depositAmount}
                    helpText="مبلغ التأمين بالريال العماني"
                    startIcon={<span className="text-gray-500">OMR</span>}
                  />

                  <FormSelect
                    label="طريقة دفع التأمين"
                    register={registerDeposit}
                    name="depositPaymentMethod"
                    error={errorsDeposit.depositPaymentMethod}
                    options={DEPOSIT_PAYMENT_METHOD_OPTIONS}
                    placeholder="اختر طريقة دفع التأمين"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    label="حالة التأمين"
                    register={registerDeposit}
                    name="depositStatus"
                    error={errorsDeposit.depositStatus}
                    options={DEPOSIT_STATUS_OPTIONS}
                    placeholder="اختر حالة التأمين"
                  />

                  {watchedDepositStatus === 'paid' && (
                    <FormInput
                      label="تاريخ دفع التأمين"
                      register={registerDeposit}
                      name="depositPaidDate"
                      type="date"
                      error={errorsDeposit.depositPaidDate}
                    />
                  )}

                  {watchedDepositStatus === 'returned' && (
                    <FormInput
                      label="تاريخ استرجاع التأمين"
                      register={registerDeposit}
                      name="depositReturnedDate"
                      type="date"
                      error={errorsDeposit.depositReturnedDate}
                    />
                  )}
                </div>

                {watchedDepositPaymentMethod === 'check' && (
                  <Controller
                    name="depositCheckImage"
                    control={controlDeposit}
                    render={({ field, fieldState }) => (
                      <FormFileInput
                        label="صورة شيك التأمين"
                        name="depositCheckImage"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleDepositFileChange}
                        error={fieldState.error}
                        helpText="صورة واضحة لشيك التأمين"
                        currentFile={reservation.depositCheckImageUrl}
                      />
                    )}
                  />
                )}

                <FormTextArea
                  label="ملاحظات التأمين"
                  register={registerDeposit}
                  name="depositNotes"
                  error={errorsDeposit.depositNotes}
                  rows={3}
                  helpText="أي ملاحظات خاصة بالتأمين"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDepositEditModalOpen(false)}
                disabled={isUpdatingDeposit}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                isLoading={isUpdatingDeposit}
                disabled={isUpdatingDeposit}
              >
                حفظ التغييرات
              </Button>
            </div>
          </form>
        </div>
      </Modal>

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