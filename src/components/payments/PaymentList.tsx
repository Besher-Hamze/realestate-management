import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Payment } from '@/lib/types';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { paymentsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface PaymentListProps {
  payments: Payment[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
}

export default function PaymentList({
  payments,
  isLoading,
  onDelete,
  refetch,
}: PaymentListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [checkImage, setCheckImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // التعامل مع النقر على الصف
  const handleRowClick = (payment: Payment) => {
    router.push(`/dashboard/payments/${payment.id}`);
  };

  // فتح نافذة تأكيد الحذف
  const openDeleteModal = (payment: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setDeleteModalOpen(true);
  };

  // فتح نافذة تحديث الحالة
  const openStatusUpdateModal = (payment: Payment, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  const openUploadModal = (payment: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setUploadModalOpen(true);
  };
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
        refetch();
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
  // حذف المدفوعة
  const handleDelete = async () => {
    if (!selectedPayment) return;

    try {
      setIsDeleting(true);
      const response = await paymentsApi.delete(selectedPayment.id);

      if (response.success) {
        toast.success('تم حذف المدفوعة بنجاح');
        setDeleteModalOpen(false);

        // استدعاء دالة الحذف أو إعادة جلب البيانات
        if (onDelete) {
          onDelete(selectedPayment.id);
        } else {
          refetch();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCheckImage(e.target.files[0]);
    }
  };
  // تحديث حالة المدفوعة
  const handleStatusUpdate = async () => {
    if (!selectedPayment || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await paymentsApi.update(selectedPayment.id, {
        ...selectedPayment,
        status: newStatus,
      });

      if (response.success) {
        toast.success(`تم تحد"pendingيث حالة المدفوعة إلى ${getStatusName(newStatus)}`);
        setStatusUpdateModalOpen(false);
        refetch();
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

  // الحصول على اسم الحالة بالعربية
  const getStatusName = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'pending': return 'قيد الانتظار';
      case 'delayed': return 'متأخرة';
      case 'cancelled': return 'ملغية';
      default: return status;
    }
  };

  // مكون زر تحديث الحالة
  const StatusButton = ({ payment, status, label, color }: { payment: Payment; status: string; label: string; color: string }) => (
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

  // تعريف أعمدة الجدول
  const columns = [
    {
      key: 'property',
      header: 'العقار',
      cell: (payment: Payment) => {
        const unitNumber = payment.reservation?.unit?.unitNumber || 'غير متوفر';
        const tenantName = payment.reservation?.user?.fullName || 'غير متوفر';
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{unitNumber}</span>
            <span className="text-xs text-gray-500">{tenantName}</span>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'المبلغ',
      cell: (payment: Payment) => <span className="font-medium text-gray-900">{formatCurrency(payment.amount)}</span>,
    },
    {
      key: 'date',
      header: 'التاريخ',
      cell: (payment: Payment) => <span className="text-gray-700">{formatDate(payment.paymentDate)}</span>,
    },
    {
      key: 'method',
      header: 'الطريقة',
      cell: (payment: Payment) => {
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
      key: 'method',
      header: 'الطريقة',
      cell: (payment: Payment) => {
        let method;
        switch (payment.paymentMethod) {
          case 'cash': method = 'نقدًا'; break;
          case 'checks': method = 'شيك'; break;
          default: method = payment.paymentMethod;
        }

        return (
          <div className="flex flex-col">
            <span className="text-gray-700">{method}</span>
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
        );
      },
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (payment: Payment) => {
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
            statusText = 'متأخرة';
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
      cell: (payment: Payment) => (
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/payments/${payment.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">عرض</Button>
          </Link>

          {/* أزرار تحديث الحالة */}
          <div className="flex flex-wrap gap-1">
            <StatusButton payment={payment} status="paid" label="مدفوعة" color="green" />
            <StatusButton payment={payment} status="pending" label="قيد الانتظار" color="yellow" />
            <StatusButton payment={payment} status="delayed" label="متأخرة" color="purple" />
            <StatusButton payment={payment} status="cancelled" label="ملغية" color="red" />
          </div>

          {/* زر الحذف */}
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

  return (
    <>
      <Table
        data={payments}
        columns={columns}
        keyExtractor={(payment) => payment.id}
        isLoading={isLoading}
        emptyMessage="لم يتم العثور على مدفوعات"
        onRowClick={handleRowClick}
      />

      {/* نافذة تأكيد الحذف */}
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

      {/* نافذة تأكيد تحديث الحالة */}
      <Modal
        isOpen={statusUpdateModalOpen}
        onClose={() => setStatusUpdateModalOpen(false)}
        title="تحديث حالة المدفوعة"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            هل أنت متأكد أنك تريد تغيير حالة المدفوعة إلى <span className="font-medium">{getStatusName(newStatus)}</span>؟
          </p>

          {newStatus === 'refunded' && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm mb-4">
              <strong>ملاحظة:</strong> تحديد مدفوعة كمسترجعة قد يؤدي إلى تشغيل سير عمل إضافي في نظامك.
            </div>
          )}

          {newStatus === 'failed' && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">
              <strong>تحذير:</strong> تحديد مدفوعة كفاشلة قد يؤثر على سمعة المستأجر والتقارير.
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