'use client';

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

interface EnhancedPaymentListProps {
  payments: Payment[];
  isLoading: boolean;
  reservationId?: number; // Optional for tenants
  onRefresh: () => void;
  tenant?: boolean; // Optional, defaults to false (manager mode)
}

export default function EnhancedPaymentList({
  payments,
  isLoading,
  reservationId,
  onRefresh,
  tenant = false,
}: EnhancedPaymentListProps) {
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

  // Handle row click (only for managers)
  const handleRowClick = (payment: Payment) => {
    if (!tenant) {
      router.push(`/dashboard/payments/${payment.id}`);
    }
  };

  // Open delete confirmation modal (manager only)
  const openDeleteModal = (payment: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setDeleteModalOpen(true);
  };

  // Open status update modal (manager only)
  const openStatusUpdateModal = (payment: Payment, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // Open upload check image modal (manager only)
  const openUploadModal = (payment: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPayment(payment);
    setUploadModalOpen(true);
  };

  // Delete payment (manager only)
  const handleDelete = async () => {
    if (!selectedPayment) return;

    try {
      setIsDeleting(true);
      const response = await paymentsApi.delete(selectedPayment.id);

      if (response.success) {
        toast.success('تم حذف المدفوعة بنجاح');
        setDeleteModalOpen(false);
        onRefresh();
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

  // Update payment status (manager only)
  const handleStatusUpdate = async () => {
    if (!selectedPayment || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await paymentsApi.update(selectedPayment.id, {
        status: newStatus,
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

  // Upload check image (manager only)
  const handleUploadCheckImage = async () => {
    if (!selectedPayment || !checkImage) return;

    try {
      setIsUploading(true);
      const response = await paymentsApi.update(selectedPayment.id, {}, { checkImage });

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
      case 'paid':
        return 'مدفوعة';
      case 'pending':
        return 'قيد الانتظار';
      case 'delayed':
        return 'متأخرة';
      case 'cancelled':
        return 'ملغية';
      default:
        return status;
    }
  };

  // Status action button component (manager only)
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

  // Table columns definition
  const columns: TableColumn<Payment>[] = [
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
      header: 'الطريقة',
      cell: (payment: Payment) => {
        let method;
        switch (payment.paymentMethod) {
          case 'cash':
            method = 'نقدًا';
            break;
          case 'checks':
            method = 'شيك';
            break;
          default:
            method = payment.paymentMethod;
        }

        return (
          <div className="flex flex-col">
            <span className="text-gray-700">{method}</span>
            {payment.paymentMethod === 'checks' && payment.checkImageUrl && (
              <div className="mt-1">
                <a
                  href={payment.checkImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-500 text-xs font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  عرض صورة الشيك
                </a>
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
        let statusClass = '';
        switch (payment.status) {
          case 'paid':
            statusClass = 'bg-green-100 text-green-800';
            break;
          case 'pending':
            statusClass = 'bg-yellow-100 text-yellow-800';
            break;
          case 'delayed':
            statusClass = 'bg-purple-100 text-purple-800';
            break;
          case 'cancelled':
            statusClass = 'bg-red-100 text-red-800';
            break;
        }

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
            {getStatusName(payment.status)}
          </span>
        );
      },
    },
    // Actions column (manager only)
    ...(!tenant
      ? [
        {
          key: 'actions',
          header: 'الإجراءات',
          cell: (payment: Payment) => (
            <div className="flex flex-wrap gap-1">
              <StatusButton payment={payment} status="paid" label="تم الدفع" color="green" />
              <StatusButton payment={payment} status="pending" label="قيد الانتظار" color="yellow" />
              <StatusButton payment={payment} status="delayed" label="متأخر" color="purple" />
              <StatusButton payment={payment} status="cancelled" label="إلغاء" color="red" />
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
      ]
      : []),
  ];

  return (
    <>
      <Table
        data={payments}
        columns={columns}
        keyExtractor={(payment) => payment.id}
        isLoading={isLoading}
        emptyMessage="لم يتم العثور على مدفوعات لهذا الحجز"
        onRowClick={tenant ? undefined : handleRowClick} // Disable row click for tenants
      />

      {/* Modals (manager only) */}
      {!tenant && (
        <>
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
                هل أنت متأكد أنك تريد تغيير حالة المدفوعة إلى{' '}
                <span className="font-medium">{getStatusName(newStatus)}</span>؟
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
      )}
    </>
  );
}