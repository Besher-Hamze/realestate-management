'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Payment, Reservation } from '@/lib/types';
import { paymentsApi, reservationsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, formatCurrency } from '@/lib/utils';

interface PaymentDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const [payment, setPayment] = useState<Payment | null>(null);
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // جلب تفاصيل المدفوعة عند تحميل المكون
    useEffect(() => {
        fetchPayment();
    }, [id]);

    // جلب بيانات المدفوعة
    const fetchPayment = async () => {
        try {
            setIsLoading(true);
            const response = await paymentsApi.getById(id);

            if (response.success) {
                setPayment(response.data);
                // جلب تفاصيل الحجز المرتبط
                if (response.data.reservationId) {
                    fetchReservation(response.data.reservationId);
                }
            } else {
                toast.error(response.message || 'فشل في جلب تفاصيل المدفوعة');
            }
        } catch (error) {
            console.error('خطأ في جلب المدفوعة:', error);
            toast.error('حدث خطأ أثناء جلب تفاصيل المدفوعة');
        } finally {
            setIsLoading(false);
        }
    };

    // جلب بيانات الحجز
    const fetchReservation = async (reservationId: number) => {
        try {
            const response = await reservationsApi.getById(reservationId.toString());

            if (response.success) {
                setReservation(response.data);
            } else {
                toast.error(response.message || 'فشل في جلب تفاصيل الحجز');
            }
        } catch (error) {
            console.error('خطأ في جلب الحجز:', error);
            toast.error('حدث خطأ أثناء جلب تفاصيل الحجز');
        }
    };

    // حذف المدفوعة
    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const response = await paymentsApi.delete(id);

            if (response.success) {
                toast.success('تم حذف المدفوعة بنجاح');
                router.push('/dashboard/payments');
            } else {
                toast.error(response.message || 'فشل في حذف المدفوعة');
                setDeleteModalOpen(false);
            }
        } catch (error) {
            console.error('خطأ في حذف المدفوعة:', error);
            toast.error('حدث خطأ أثناء حذف المدفوعة');
            setDeleteModalOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    // الحصول على اسم طريقة الدفع بالعربية
    const getPaymentMethodName = (method: string) => {
        switch (method) {
            case 'cash': return 'نقدًا';
            case 'credit_card': return 'بطاقة ائتمان';
            case 'bank_transfer': return 'تحويل بنكي';
            case 'check': return 'شيك';
            case 'other': return 'أخرى';
            default: return method;
        }
    };

    // الحصول على اسم حالة المدفوعة بالعربية
    const getPaymentStatusName = (status: string) => {
        switch (status) {
            case 'pending': return 'قيد الانتظار';
            case 'paid': return 'مدفوعة';
            case 'delayed': return 'متأخرة';
            case 'cancelled': return 'ملغية';
            default: return status;
        }
    };

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
                    <p className="text-gray-600">جاري تحميل تفاصيل المدفوعة...</p>
                </div>
            </div>
        );
    }

    // عرض حالة عدم العثور على المدفوعة
    if (!payment) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">لم يتم العثور على المدفوعة</h2>
                <p className="text-gray-600 mb-6">المدفوعة التي تبحث عنها غير موجودة أو ليس لديك صلاحية مشاهدتها.</p>
                <Link href="/dashboard/payments">
                    <Button>العودة إلى المدفوعات</Button>
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
                            <Link href="/dashboard/payments" className="hover:text-primary-600">المدفوعات</Link>
                        </li>
                        <li>
                            <span className="mx-1">/</span>
                            <span className="text-gray-700">#{payment.id}</span>
                        </li>
                    </ol>
                </nav>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        المدفوعة #{payment.id}
                    </h1>
                    <div className="flex space-x-3">
                        <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>حذف</Button>
                    </div>
                </div>
            </div>

            {/* تفاصيل المدفوعة */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* المعلومات الرئيسية */}
                <Card className="lg:col-span-2">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">تفاصيل المدفوعة</h2>
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        payment.status === 'delayed' ? 'bg-orange-100 text-orange-800' :
                                            'bg-red-100 text-red-800'
                                    }`}
                            >
                                {getPaymentStatusName(payment.status)}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">المبلغ</h3>
                                <p className="mt-1 text-base text-gray-900 font-bold">
                                    {formatCurrency(payment.amount)}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500">تاريخ الدفع</h3>
                                <p className="mt-1 text-base text-gray-900">
                                    {formatDate(payment.paymentDate)}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500">طريقة الدفع</h3>
                                <p className="mt-1 text-base text-gray-900">
                                    {getPaymentMethodName(payment.paymentMethod)}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500">تاريخ الإنشاء</h3>
                                <p className="mt-1 text-base text-gray-900">
                                    {formatDate(payment.createdAt)}
                                </p>
                            </div>
                        </div>

                        {/* الملاحظات */}
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">ملاحظات</h3>
                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                <p className="text-gray-700 whitespace-pre-line">
                                    {payment.notes || 'لا توجد ملاحظات مقدمة'}
                                </p>
                            </div>
                        </div>

                        {/* صورة الشيك */}
                        {payment.paymentMethod === 'check' && payment.checkImageUrl && (
                            <div className="mt-6">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">صورة الشيك</h3>
                                <a
                                    href={payment.checkImageUrl}
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
                    </div>
                </Card>

                {/* معلومات الحجز */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الحجز</h2>

                        {reservation ? (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">رقم الحجز</h3>
                                    <p className="mt-1 text-base text-gray-900">
                                        #{reservation.id}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">الوحدة</h3>
                                    <p className="mt-1 text-base text-gray-900">
                                        {reservation.unit?.unitNumber || 'غير متوفر'}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">المستأجر</h3>
                                    <p className="mt-1 text-base text-gray-900">
                                        {reservation.user?.fullName || 'غير متوفر'}
                                    </p>
                                </div>

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

                                <Link href={`/dashboard/reservations/${reservation.id}`}>
                                    <Button variant="outline" size="sm" className="mt-2">
                                        عرض تفاصيل الحجز
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <p className="text-gray-500">معلومات الحجز غير متاحة</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* نافذة تأكيد الحذف */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="حذف المدفوعة"
            >
                <div className="p-6">
                    <p className="text-gray-600 mb-4">
                        هل أنت متأكد أنك تريد حذف هذه المدفوعة؟ لا يمكن التراجع عن هذا الإجراء.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
                        <p className="text-sm font-medium">تحذير</p>
                        <p className="text-sm">حذف هذه المدفوعة سيؤدي إلى إزالتها نهائيًا من سجلات الحجز.</p>
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
        </div>
    );
}