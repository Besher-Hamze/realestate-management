import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Reservation } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { reservationsApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ReservationListProps {
  reservations: Reservation[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
}

export default function ReservationList({
  reservations,
  isLoading,
  onDelete,
  refetch,
}: ReservationListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // التعامل مع النقر على الصف
  const handleRowClick = (reservation: Reservation) => {
    router.push(`/dashboard/reservations/${reservation.id}`);
  };

  // فتح نافذة تأكيد الحذف
  const openDeleteModal = (reservation: Reservation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReservation(reservation);
    setDeleteModalOpen(true);
  };

  // فتح نافذة تحديث الحالة
  const openStatusUpdateModal = (reservation: Reservation, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReservation(reservation);
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // حذف الحجز
  const handleDelete = async () => {
    if (!selectedReservation) return;

    try {
      setIsDeleting(true);
      const response = await reservationsApi.delete(selectedReservation.id);

      if (response.success) {
        toast.success('تم حذف الحجز بنجاح');
        setDeleteModalOpen(false);

        // استدعاء دالة الحذف أو إعادة جلب البيانات
        if (onDelete) {
          onDelete(selectedReservation.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'فشل في حذف الحجز');
      }
    } catch (error) {
      console.error('خطأ في حذف الحجز:', error);
      toast.error('حدث خطأ أثناء حذف الحجز');
    } finally {
      setIsDeleting(false);
    }
  };

  // تحديث حالة الحجز
  const handleStatusUpdate = async () => {
    if (!selectedReservation || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await reservationsApi.update(selectedReservation.id, {
        ...selectedReservation,
        status: newStatus,
      });

      if (response.success) {
        toast.success(`تم تحديث حالة الحجز إلى ${getStatusLabel(newStatus)}`);
        setStatusUpdateModalOpen(false);
        refetch();
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

  // الحصول على تسمية الحالة بالعربية
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'expired': return 'منتهي';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  // مكون زر تحديث الحالة
  const StatusButton = ({ reservation, status, label, color }: { reservation: Reservation; status: string; label: string; color: string }) => (
    <Button
      size="xs"
      variant="outline"
      className={`border-${color}-500 text-${color}-700 hover:bg-${color}-50`}
      onClick={(e) => openStatusUpdateModal(reservation, status, e)}
      disabled={reservation.status === status}
    >
      {label}
    </Button>
  );

  // تعريف أعمدة الجدول
  const columns: TableColumn<Reservation>[] = [
    {
      key: 'unit',
      header: 'الوحدة',
      cell: (reservation) => {
        const unitNumber = reservation.unit?.unitNumber || 'غير متوفر';
        const buildingName = reservation.unit?.building?.name || 'غير متوفر';
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{unitNumber}</span>
            <span className="text-xs text-gray-500">{buildingName}</span>
          </div>
        );
      },
    },
    {
      key: 'tenant',
      header: 'المستأجر',
      cell: (reservation) => {
        const tenantName = reservation.user?.fullName || 'غير متوفر';
        const tenantEmail = reservation.user?.email || '';
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{tenantName}</span>
            {tenantEmail && <span className="text-xs text-gray-500">{tenantEmail}</span>}
          </div>
        );
      },
    },
    {
      key: 'period',
      header: 'الفترة',
      cell: (reservation) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}</span>
          <span className="text-xs text-gray-500">
            {reservation.unit ? `${formatCurrency(reservation.unit.price)}/شهر` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (reservation) => {
        let statusText = '';
        let statusClass = '';

        switch (reservation.status) {
          case 'active':
            statusText = 'نشط';
            statusClass = 'bg-green-100 text-green-800';
            break;
          case 'pending':
            statusText = 'قيد الانتظار';
            statusClass = 'bg-yellow-100 text-yellow-800';
            break;
          case 'expired':
            statusText = 'منتهي';
            statusClass = 'bg-gray-100 text-gray-800';
            break;
          case 'cancelled':
            statusText = 'ملغي';
            statusClass = 'bg-red-100 text-red-800';
            break;
        }

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
          >
            {statusText}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (reservation) => (
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/reservations/${reservation.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">عرض</Button>
          </Link>

          {/* أزرار تحديث الحالة */}
          <div className="flex flex-wrap gap-1">
            <StatusButton reservation={reservation} status="cancelled" label="إلغاء" color="red" />
          </div>

          {/* زر الحذف */}
          <Button
            size="xs"
            variant="danger"
            onClick={(e) => openDeleteModal(reservation, e)}
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
        data={reservations}
        columns={columns}
        keyExtractor={(reservation) => reservation.id}
        isLoading={isLoading}
        emptyMessage="لم يتم العثور على حجوزات"
        onRowClick={handleRowClick}
      />

      {/* نافذة تأكيد الحذف */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="حذف الحجز"
        footer={
          <div className="flex justify-end space-x-3">
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
        }
      >
        <p className="text-gray-600 mb-4">
          هل أنت متأكد أنك تريد حذف هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
          <p className="text-sm font-medium">تحذير</p>
          <p className="text-sm">حذف هذا الحجز سيؤدي إلى إزالة وصول المستأجر إلى هذه الوحدة وأي طلبات خدمة مرتبطة بها.</p>
        </div>
      </Modal>

      {/* نافذة تأكيد تحديث الحالة */}
      <Modal
        isOpen={statusUpdateModalOpen}
        onClose={() => setStatusUpdateModalOpen(false)}
        title="تحديث حالة الحجز"
        footer={
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
        }
      >
        <p className="text-gray-600 mb-4">
          هل أنت متأكد أنك تريد تغيير الحالة إلى{" "}
          <span className="font-medium">{getStatusLabel(newStatus)}</span>؟
        </p>
        {newStatus === 'cancelled' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
            <p className="text-sm font-medium">تحذير</p>
            <p className="text-sm">إلغاء هذا الحجز سيؤدي إلى إزالة وصول المستأجر إلى هذه الوحدة.</p>
          </div>
        )}

      </Modal>
    </>
  );
}