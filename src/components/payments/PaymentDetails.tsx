import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Payment } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { paymentsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface PaymentDetailsProps {
  payment: Payment;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function PaymentDetails({
  payment,
  isLoading,
  onRefresh,
}: PaymentDetailsProps) {
  const router = useRouter();
  
  // State for modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [checkImage, setCheckImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Open status update modal
  const openStatusUpdateModal = (status: string) => {
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // Delete payment
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await paymentsApi.delete(payment.id);

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

  // Update payment status
  const handleStatusUpdate = async () => {
    if (!newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await paymentsApi.update(payment.id, {
        status: newStatus
      });

      if (response.success) {
        toast.success(`تم تحديث حالة المدفوعة إلى ${getStatusName(newStatus)}`);
        setStatusUpdateModalOpen(false);
        onRefresh();
      } else {
        toast.error(response.message || 'فشل في تحديث حالة المدفوعة');
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة المدفوعة:', error);
      toast.error('حدث خطأ أثناء تحديث حالة المدفوعة');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Upload check image
  const handleUploadCheckImage = async () => {
    if (!checkImage) return;

    try {
      setIsUploading(true);
      const response = await paymentsApi.update(
        payment.id,
        {},
        { checkImage }
      );

      if (response.success) {
        toast.success('تم تحديث صورة الشيك بنجاح');
        setUploadModalOpen(false);
        onRefresh();
      } else {
        toast.error(response.message || 'فشل في تحديث صورة الشيك');
      }
    } catch (error) {
      console.error('خطأ في تحديث صورة الشيك:', error);
      toast.error('حدث خطأ أثناء تحديث صورة الشيك');
    } finally {
      setIsUploading(false);
      setCheckImage(null);
    }
  };

  // Handle file upload change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCheckImage(e.target.files[0]);
    }
  };

  // Get translated status name
  const getStatusName = (status: string): string => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'pending': return 'قيد الانتظار';
      case 'delayed': return 'متأخرة';
      case 'cancelled': return 'ملغية';
      default: return status;
    }
  };
  
  // Get translated payment method
  const getPaymentMethodName = (method: string): string => {
    switch (method) {
      case 'cash': return 'نقدًا';
      case 'credit_card': return 'بطاقة ائتمان';
      case 'bank_transfer': return 'تحويل بنكي';
      case 'checks': return 'شيك';
      case 'other': return 'أخرى';
      default: return method;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'delayed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  return (
    <>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            تفاصيل المدفوعة #{payment.id}
          </h1>
          <div className="flex space-x-3 rtl:space-x-reverse">
            <Link href={`/dashboard/payments/${payment.id}/edit`}>
              <Button variant="outline">تعديل</Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>حذف</Button>
          </div>
        </div>

        {/* Payment details card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">معلومات المدفوعة</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                  {getStatusName(payment.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">المبلغ</h3>
                  <p className="mt-1 text-base text-gray-900 font-medium">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">تاريخ الاستحقاق</h3>
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
                  <h3 className="text-sm font-medium text-gray-500">الحالة</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {getStatusName(payment.status)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">تاريخ الإنشاء</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">آخر تحديث</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {formatDate(payment.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">ملاحظات</h3>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-line">
                    {payment.notes || 'لا توجد ملاحظات مقدمة'}
                  </p>
                </div>
              </div>

              {/* Check image */}
              {payment.paymentMethod === 'checks' && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">صورة الشيك</h3>
                  {payment.checkImageUrl ? (
                    <div>
                      <a
                        href={payment.checkImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="ml-2 -mr-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        عرض صورة الشيك
                      </a>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 mb-2">لم يتم تحميل صورة للشيك حتى الآن.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadModalOpen(true)}
                      >
                        إضافة صورة الشيك
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Status update buttons */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">تحديث الحالة</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openStatusUpdateModal('paid')}
                    disabled={payment.status === 'paid'}
                    className="border-green-500 text-green-700 hover:bg-green-50 disabled:opacity-50"
                  >
                    تحديد كمدفوعة
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openStatusUpdateModal('pending')}
                    disabled={payment.status === 'pending'}
                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                  >
                    تحديد كقيد الانتظار
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openStatusUpdateModal('delayed')}
                    disabled={payment.status === 'delayed'}
                    className="border-purple-500 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                  >
                    تحديد كمتأخرة
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openStatusUpdateModal('cancelled')}
                    disabled={payment.status === 'cancelled'}
                    className="border-red-500 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    تحديد كملغية
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Reservation details card */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الحجز</h2>

              {payment.reservation ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">رقم الحجز</h3>
                    <Link
                      href={`/dashboard/reservations/${payment.reservationId}`}
                      className="mt-1 text-base text-primary-600 hover:text-primary-700 font-medium"
                    >
                      #{payment.reservationId}
                    </Link>
                  </div>

                  {payment.reservation.unit && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">الوحدة</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {payment.reservation.unit.unitNumber}
                        {payment.reservation.unit.building && (
                          <span className="text-sm text-gray-500 mr-1">
                            ({payment.reservation.unit.building.name})
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {payment.reservation.user && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">المستأجر</h3>
                      <p className="mt-1 text-base text-gray-900">
                        {payment.reservation.user.fullName}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">مدة الحجز</h3>
                    <p className="mt-1 text-base text-gray-900">
                      {formatDate(payment.reservation.startDate)} - {formatDate(payment.reservation.endDate)}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">حالة الحجز</h3>
                    <p className="mt-1 text-base text-gray-900">
                      {payment.reservation.status === 'active' ? 'نشط' :
                        payment.reservation.status === 'pending' ? 'قيد الانتظار' :
                          payment.reservation.status === 'expired' ? 'منتهي' : 'ملغي'}
                    </p>
                  </div>

                  <div className="pt-4">
                    <Link href={`/dashboard/reservations/${payment.reservationId}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        عرض تفاصيل الحجز
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">معلومات الحجز غير متاحة</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="حذف المدفوعة"
      >
        <div className="p-6">
          <p className="text-gray-600">
            هل أنت متأكد أنك تريد حذف هذه المدفوعة؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
            <strong>ملاحظة:</strong> حذف سجل المدفوعات قد يؤثر على سجلاتك المالية والتقارير.
          </div>
          <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
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

      {/* Status update modal */}
      <Modal
        isOpen={statusUpdateModalOpen}
        onClose={() => setStatusUpdateModalOpen(false)}
        title="تحديث حالة المدفوعة"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            هل أنت متأكد أنك تريد تغيير حالة المدفوعة إلى <span className="font-medium">{getStatusName(newStatus)}</span>؟
          </p>

          {newStatus === 'paid' && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm mb-4">
              <strong>ملاحظة:</strong> سيتم تحديث حالة هذه المدفوعة إلى "مدفوعة" مما يعني أنه تم استلام المبلغ بالكامل.
            </div>
          )}

          {newStatus === 'delayed' && (
            <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md text-purple-700 text-sm mb-4">
              <strong>ملاحظة:</strong> تحديد هذه المدفوعة كمتأخرة قد يؤثر على سجل المستأجر.
            </div>
          )}

          {newStatus === 'cancelled' && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">
              <strong>تحذير:</strong> إلغاء هذه المدفوعة سيؤدي إلى إزالتها من السجلات المالية النشطة.
            </div>
          )}

          <div className="flex justify-end space-x-3 rtl:space-x-reverse">
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

      {/* Upload check image modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="إضافة صورة الشيك"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            يرجى تحميل صورة واضحة للشيك المستخدم في هذه المدفوعة.
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              صورة الشيك
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              يرجى التأكد من أن الصورة واضحة وتظهر جميع تفاصيل الشيك بما في ذلك المبلغ والتاريخ والتوقيع.
            </p>
          </div>

          <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-6">
            <Button
              variant="outline"
              onClick={() => setUploadModalOpen(false)}
              disabled={isUploading}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              onClick={handleUploadCheckImage}
              isLoading={isUploading}
              disabled={isUploading || !checkImage}
            >
              تحميل الصورة
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}