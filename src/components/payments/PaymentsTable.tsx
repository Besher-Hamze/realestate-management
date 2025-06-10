import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Payment } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { paymentsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
  onRefresh: () => void;
  reservationId?: number; // Optional reservation ID for filtering
  singlePayment?: boolean; // Flag for single payment view
}

export default function PaymentsTable({
  payments,
  isLoading,
  onRefresh,
  reservationId,
  singlePayment = false
}: PaymentsTableProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status update modal state
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Check image modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [checkImage, setCheckImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Image preview modal state
  const [imagePreviewModalOpen, setImagePreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  // Handle row click - navigate to payment detail
  const handleRowClick = (payment: Payment) => {
    if (!singlePayment) {
      router.push(`/dashboard/payments/${payment.id}`);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (payment: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setDeleteModalOpen(true);
  };

  // Open status update modal
  const openStatusUpdateModal = (payment: Payment, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // Open upload check image modal
  const openUploadModal = (payment: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setUploadModalOpen(true);
  };

  // Open image preview modal
  const openImagePreview = (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImageUrl(imageUrl);
    setImagePreviewModalOpen(true);
  };

  // Delete payment
  const handleDelete = async () => {
    if (!selectedPayment) return;

    try {
      setIsDeleting(true);
      const response = await paymentsApi.delete(selectedPayment.id);

      if (response.success) {
        toast.success('تم حذف المدفوعة بنجاح');
        setDeleteModalOpen(false);
        onRefresh();

        // If we're on a single payment page, navigate back to the payments list
        if (singlePayment) {
          router.push('/dashboard/payments');
        }
      } else {
        toast.error(response.message || 'فشل في حذف المدفوعة');
      }
    } catch (error) {
      console.error('خطأ في حذف المدفوعة:', error);
      toast.error('حدث خطأ أثناء حذف المدفوعة');
    } finally {
      setIsDeleting(false);
    }
  };

  // Update payment status
  const handleStatusUpdate = async () => {
    if (!selectedPayment || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await paymentsApi.update(selectedPayment.id, {
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
    if (!selectedPayment || !checkImage) return;

    try {
      setIsUploading(true);
      const response = await paymentsApi.update(
        selectedPayment.id,
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

  // Get contract type name
  const getContractTypeName = (type: string): string => {
    switch (type) {
      case 'residential': return 'سكني';
      case 'commercial': return 'تجاري';
      default: return type;
    }
  };

  // Get payment schedule name
  const getPaymentScheduleName = (schedule: string): string => {
    switch (schedule) {
      case 'monthly': return 'شهري';
      case 'quarterly': return 'ربع سنوي';
      case 'triannual': return 'كل 4 أشهر';
      case 'biannual': return 'نصف سنوي';
      case 'annual': return 'سنوي';
      default: return schedule;
    }
  };

  // Calculate days overdue for delayed payments
  const getDaysOverdue = (paymentDate: string): number => {
    const today = new Date();
    const dueDate = new Date(paymentDate);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Status action button component
  const StatusButton = ({ payment, status, label, color }: {
    payment: Payment;
    status: string;
    label: string;
    color: string;
  }) => (
    <Button
      size="xs"
      variant="outline"
      className={`border-${color}-500 text-${color}-700 hover:bg-${color}-50`}
      onClick={(e) => openStatusUpdateModal(payment, status, e)}
      disabled={payment.status === status}
    >
      {label}
    </Button>
  );

  // Define columns for the payments table
  const columns: TableColumn<Payment>[] = [
    // Only show reservation information if we're on the general payments page
    ...(singlePayment || !!reservationId ? [] : [
      {
        key: 'reservation',
        header: 'معلومات الحجز',
        cell: (payment: Payment) => (
          <div className="flex flex-col space-y-1">
            <Link
              href={`/dashboard/reservations/${payment.reservationId}`}
              className="text-primary-600 hover:text-primary-800 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              #{payment.reservationId}
            </Link>
            {payment.reservation && (
              <>
                {/* Unit Information */}
                <div className="text-xs text-gray-600">
                  <span className="font-medium">الوحدة:</span> {payment.reservation.unit?.unitNumber || 'غير معروفة'}
                  {payment.reservation.unit?.building?.name && (
                    <span className="text-gray-500"> - {payment.reservation.unit.building.name}</span>
                  )}
                </div>

                {/* Tenant Information */}
                <div className="text-xs text-gray-600">
                  <span className="font-medium">المستأجر:</span> {payment.reservation.user?.fullName || 'غير معروف'}
                </div>

                {/* Contract Information */}
                <div className="text-xs text-gray-500">
                  <span className="font-medium">النوع:</span> {getContractTypeName(payment.reservation.contractType)}
                  {payment.reservation.paymentSchedule && (
                    <span> | <span className="font-medium">الدفع:</span> {getPaymentScheduleName(payment.reservation.paymentSchedule)}</span>
                  )}
                </div>

                {/* Contract Period */}
                <div className="text-xs text-gray-500">
                  <span className="font-medium">الفترة:</span> {formatDate(payment.reservation.startDate)} - {formatDate(payment.reservation.endDate)}
                </div>
              </>
            )}
          </div>
        ),
      }
    ]),
    {
      key: 'date',
      header: 'تاريخ الاستحقاق',
      cell: (payment: Payment) => (
        <div className="flex flex-col">
          <span className="text-gray-700 font-medium">{formatDate(payment.paymentDate)}</span>
          {payment.status === 'delayed' && (
            <span className="text-xs text-red-600 font-medium">
              متأخر {getDaysOverdue(payment.paymentDate)} يوم
            </span>
          )}
          {payment.status === 'pending' && new Date(payment.paymentDate) < new Date() && (
            <span className="text-xs text-orange-600 font-medium">
              مستحق منذ {getDaysOverdue(payment.paymentDate)} يوم
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'المبلغ',
      cell: (payment: Payment) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{formatCurrency(payment.amount)}</span>
          {/* Show deposit information if available */}
          {payment.reservation?.includesDeposit && payment.reservation.depositAmount && (
            <span className="text-xs text-blue-600">
              + {formatCurrency(payment.reservation.depositAmount)} تأمين
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'method',
      header: 'طريقة الدفع',
      cell: (payment: Payment) => (
        <div className="flex flex-col space-y-1">
          <span className="text-gray-700 font-medium">{getPaymentMethodName(payment.paymentMethod)}</span>
          {payment.paymentMethod === 'checks' && (
            <div>
              {payment.checkImageUrl ? (
                <button
                  className="text-primary-600 hover:text-primary-500 text-xs font-medium underline"
                  onClick={(e) => openImagePreview(payment.checkImageUrl!, e)}
                >
                  عرض صورة الشيك
                </button>
              ) : (
                <button
                  className="text-orange-600 hover:text-orange-500 text-xs font-medium"
                  onClick={(e) => openUploadModal(payment, e)}
                >
                  إضافة صورة الشيك
                </button>
              )}
            </div>
          )}
          {/* Show reservation payment method for context */}
          {payment.reservation?.paymentMethod && payment.reservation.paymentMethod !== payment.paymentMethod && (
            <span className="text-xs text-gray-500">
              (الطريقة المتفق عليها: {getPaymentMethodName(payment.reservation.paymentMethod)})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (payment: Payment) => {
        let statusClass = '';
        switch (payment.status) {
          case 'paid': statusClass = 'bg-green-100 text-green-800'; break;
          case 'pending': statusClass = 'bg-yellow-100 text-yellow-800'; break;
          case 'delayed': statusClass = 'bg-red-100 text-red-800'; break;
          case 'cancelled': statusClass = 'bg-gray-100 text-gray-800'; break;
        }

        return (
          <div className="flex flex-col space-y-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
              {getStatusName(payment.status)}
            </span>
            {/* Show reservation status for context */}
            {payment.reservation?.status && (
              <span className="text-xs text-gray-500">
                الحجز: {payment.reservation.status === 'active' ? 'نشط' :
                  payment.reservation.status === 'expired' ? 'منتهي' : 'ملغي'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'notes',
      header: 'ملاحظات',
      cell: (payment: Payment) => (
        <div className="max-w-xs">
          {payment.notes ? (
            <div className="text-xs text-gray-600 truncate" title={payment.notes}>
              {payment.notes}
            </div>
          ) : (
            <span className="text-xs text-gray-400">لا توجد ملاحظات</span>
          )}
          {/* Show reservation notes if payment notes are empty */}
          {!payment.notes && payment.reservation?.notes && (
            <div className="text-xs text-gray-500 truncate" title={`ملاحظات الحجز: ${payment.reservation.notes}`}>
              حجز: {payment.reservation.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'تاريخ الإنشاء',
      cell: (payment: Payment) => (
        <div className="flex flex-col">
          <span className="text-gray-700 text-sm">{formatDate(payment.createdAt)}</span>
          {payment.updatedAt !== payment.createdAt && (
            <span className="text-xs text-gray-500">
              آخر تحديث: {formatDate(payment.updatedAt)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (payment: Payment) => (
        <div className="flex flex-wrap gap-1">
          {/* Quick status update buttons */}
          <StatusButton payment={payment} status="paid" label="تم الدفع" color="green" />
          <StatusButton payment={payment} status="pending" label="قيد الانتظار" color="yellow" />
          <StatusButton payment={payment} status="delayed" label="متأخر" color="red" />
          <StatusButton payment={payment} status="cancelled" label="إلغاء" color="gray" />

          {/* Check image upload button (only for check payments without image) */}
          {payment.paymentMethod === 'checks' && !payment.checkImageUrl && (
            <Button
              size="xs"
              variant="outline"
              className="border-blue-500 text-blue-700 hover:bg-blue-50"
              onClick={(e) => openUploadModal(payment, e)}
            >
              إضافة صورة الشيك
            </Button>
          )}

          {/* Edit and delete buttons */}
          <Link href={`/dashboard/payments/${payment.id}/edit`} onClick={(e) => e.stopPropagation()}>
            <Button
              size="xs"
              variant="outline"
              className="border-gray-500 text-gray-700 hover:bg-gray-50"
            >
              تعديل
            </Button>
          </Link>

          <Button
            size="xs"
            variant="danger"
            onClick={(e) => openDeleteModal(payment, e)}
          >
            حذف
          </Button>
        </div>
      ),
    },
  ];

  // If it's a single payment view, we might want to show different columns or add more details
  const singlePaymentColumns = columns.filter(col => col.key !== 'actions');

  return (
    <>
      <Table
        data={payments}
        columns={singlePayment ? singlePaymentColumns : columns}
        keyExtractor={(payment) => payment.id}
        isLoading={isLoading}
        emptyMessage="لم يتم العثور على مدفوعات"
        onRowClick={singlePayment ? undefined : handleRowClick}
      />

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
          <div className="mt-6 flex justify-end space-x-3">
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
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">
              <strong>ملاحظة:</strong> تحديد هذه المدفوعة كمتأخرة قد يؤثر على سجل المستأجر.
            </div>
          )}

          {newStatus === 'cancelled' && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">
              <strong>تحذير:</strong> إلغاء هذه المدفوعة سيؤدي إلى إزالتها من السجلات المالية النشطة.
            </div>
          )}

          <div className="flex justify-end space-x-3">
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

          <div className="flex justify-end space-x-3 mt-6">
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

      {/* Image preview modal */}
      <Modal
        isOpen={imagePreviewModalOpen}
        onClose={() => setImagePreviewModalOpen(false)}
        title="معاينة صورة الشيك"
        size="lg"
      >
        <div className="p-6">
          <div className="flex justify-center">
            <img
              src={previewImageUrl}
              alt="صورة الشيك"
              className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
            />
          </div>
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setImagePreviewModalOpen(false)}
            >
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}