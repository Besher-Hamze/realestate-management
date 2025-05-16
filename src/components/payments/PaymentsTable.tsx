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
        header: 'الحجز',
        cell: (payment: Payment) => (
          <div className="flex flex-col">
            <Link 
              href={`/dashboard/reservations/${payment.reservationId}`}
              className="text-primary-600 hover:text-primary-800 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              #{payment.reservationId}
            </Link>
            {payment.reservation && (
              <span className="text-xs text-gray-500 mt-1">
                {payment.reservation.unit?.unitNumber || 'وحدة غير معروفة'} - 
                {payment.reservation.user?.fullName || 'مستأجر غير معروف'}
              </span>
            )}
          </div>
        ),
      }
    ]),
    {
      key: 'date',
      header: 'تاريخ الاستحقاق',
      cell: (payment: Payment) => <span className="text-gray-700">{formatDate(payment.paymentDate)}</span>,
    },
    {
      key: 'amount',
      header: 'المبلغ',
      cell: (payment: Payment) => <span className="font-medium text-gray-900">{formatCurrency(payment.amount)}</span>,
    },
    {
      key: 'method',
      header: 'طريقة الدفع',
      cell: (payment: Payment) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{getPaymentMethodName(payment.paymentMethod)}</span>
          {payment.paymentMethod === 'checks' && (
            <div className="mt-1">
              {payment.checkImageUrl ? (
                <a
                  href={payment.checkImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-500 text-xs font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  عرض صورة الشيك
                </a>
              ) : (
                <button
                  className="text-primary-600 hover:text-primary-500 text-xs font-medium"
                  onClick={(e) => openUploadModal(payment, e)}
                >
                  إضافة صورة الشيك
                </button>
              )}
            </div>
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
          case 'delayed': statusClass = 'bg-purple-100 text-purple-800'; break;
          case 'cancelled': statusClass = 'bg-red-100 text-red-800'; break;
        }

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {getStatusName(payment.status)}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'تاريخ الإنشاء',
      cell: (payment: Payment) => <span className="text-gray-700">{formatDate(payment.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (payment: Payment) => (
        <div className="flex flex-wrap gap-1">
          {/* Quick status update buttons */}
          <StatusButton payment={payment} status="paid" label="تم الدفع" color="green" />
          <StatusButton payment={payment} status="pending" label="قيد الانتظار" color="yellow" />
          <StatusButton payment={payment} status="delayed" label="متأخر" color="purple" />
          <StatusButton payment={payment} status="cancelled" label="إلغاء" color="red" />

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
            <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md text-purple-700 text-sm mb-4">
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
    </>
  );
}