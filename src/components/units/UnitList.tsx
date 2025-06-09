import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { RealEstateUnit } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { unitsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUnitTypeLabel,
  getUnitLayoutLabel,
  getUnitStatusLabel
} from '@/constants/options';

interface UnitListProps {
  units: RealEstateUnit[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
  forTenant?: boolean;
  showOwnerInfo?: boolean;
}

export default function UnitList({
  units,
  isLoading,
  onDelete,
  refetch,
  forTenant = false,
  showOwnerInfo = false,
}: UnitListProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<RealEstateUnit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check user permissions
  const canEdit = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';

  // التعامل مع النقر على الصف
  const handleRowClick = (unit: RealEstateUnit) => {
    if (forTenant) {
      router.push(`/tenant/units/${unit.id}`);
    } else {
      if (canEdit)
        router.push(`/dashboard/units/${unit.id}`);
    }
  };

  // فتح نافذة تأكيد الحذف
  const openDeleteModal = (unit: RealEstateUnit, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUnit(unit);
    setDeleteModalOpen(true);
  };

  // حذف الوحدة
  const handleDelete = async () => {
    if (!selectedUnit) return;

    try {
      setIsDeleting(true);
      const response = await unitsApi.delete(selectedUnit.id);

      if (response.success) {
        toast.success('تم حذف الوحدة بنجاح');
        setDeleteModalOpen(false);

        // استدعاء وظيفة الحذف أو إعادة جلب البيانات
        if (onDelete) {
          onDelete(selectedUnit.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'فشل في حذف الوحدة');
      }
    } catch (error) {
      console.error('خطأ في حذف الوحدة:', error);
      toast.error('حدث خطأ أثناء حذف الوحدة');
    } finally {
      setIsDeleting(false);
    }
  };

  // Navigate to create reservation
  const handleCreateReservation = (unit: RealEstateUnit, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/reservations/create?unitId=${unit.id}`);
  };

  // تحديد الأعمدة للجدول
  const baseColumns: TableColumn<RealEstateUnit>[] = [
    {
      key: 'unitNumber',
      header: 'معلومات الوحدة',
      cell: (unit) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{unit.unitNumber}</span>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>المبنى: {unit.building?.name || 'غير متوفر'}</span>
            {unit.building?.buildingNumber && (
              <>
                <span>•</span>
                <span>رقم: {unit.building.buildingNumber}</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'unitType',
      header: 'النوع والتخطيط',
      cell: (unit) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {getUnitTypeLabel(unit.unitType)}
          </span>
          {unit.unitLayout && (
            <span className="text-xs text-gray-500">
              {getUnitLayoutLabel(unit.unitLayout)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'details',
      header: 'التفاصيل',
      cell: (unit) => (
        <div className="flex flex-col">
          <span className="text-gray-700">
            {unit.bathrooms} حمام
          </span>
          <span className="text-xs text-gray-500">
            {unit.area} م² • الطابق {unit.floor}
          </span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'السعر',
      cell: (unit) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {formatCurrency(unit.price)}
          </span>
          <span className="text-xs text-gray-500">شهرياً</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (unit) => {
        const statusClasses = {
          available: 'bg-green-100 text-green-800 border-green-200',
          rented: 'bg-blue-100 text-blue-800 border-blue-200',
          maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
            ${statusClasses[unit.status]}`}
          >
            {getUnitStatusLabel(unit.status)}
          </span>
        );
      },
    },
  ];

  // Add owner column if requested
  if (showOwnerInfo) {
    baseColumns.splice(-1, 0, {
      key: 'owner',
      header: 'المالك',
      cell: (unit) => (
        <div className="flex flex-col">
          <span className="text-gray-700">
            {unit.owner?.fullName || 'غير محدد'}
          </span>
          {unit.owner?.username && (
            <span className="text-xs text-gray-500">
              @{unit.owner.username}
            </span>
          )}
        </div>
      ),
    });
  }

  // أعمدة خاصة بالمشرف/المدير مع الإجراءات
  const adminColumns: TableColumn<RealEstateUnit>[] = [
    ...baseColumns,
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (unit) => (
        <div className="flex flex-wrap gap-1">
          <Link href={`/dashboard/units/${unit.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">عرض</Button>
          </Link>

          {canEdit && (
            <>
              <Link href={`/dashboard/units/${unit.id}/edit`} onClick={(e) => e.stopPropagation()}>
                <Button size="xs" variant="outline">تعديل</Button>
              </Link>

              {unit.status === 'available' && (
                <Button
                  size="xs"
                  variant="primary"
                  onClick={(e) => handleCreateReservation(unit, e)}
                  title="إنشاء حجز جديد"
                >
                  حجز
                </Button>
              )}
            </>
          )}

          {canDelete && (
            <Button
              size="xs"
              variant="danger"
              onClick={(e) => openDeleteModal(unit, e)}
            >
              حذف
            </Button>
          )}
        </div>
      ),
    },
  ];

  // أعمدة خاصة بالمستأجر
  const tenantColumns: TableColumn<RealEstateUnit>[] = [
    ...baseColumns,
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (unit) => (
        <div className="flex flex-wrap gap-1">
          <Link href={`/tenant/units/${unit.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">عرض التفاصيل</Button>
          </Link>
          <Link href={`/tenant/services/create?unitId=${unit.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="primary">طلب خدمة</Button>
          </Link>
        </div>
      ),
    },
  ];

  // اختيار الأعمدة بناءً على نوع المستخدم
  const columns = forTenant ? tenantColumns : adminColumns;

  return (
    <>
      <Table
        data={units}
        columns={columns}
        keyExtractor={(unit) => unit.id}
        isLoading={isLoading}
        emptyMessage="لا توجد وحدات"
        onRowClick={handleRowClick}
      />

      {/* نافذة تأكيد الحذف */}
      {!forTenant && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="حذف الوحدة"
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
          <div className="space-y-4">
            <p className="text-gray-600">
              هل أنت متأكد من أنك تريد حذف الوحدة "{selectedUnit?.unitNumber}"؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            {selectedUnit && selectedUnit.status === 'rented' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">تحذير</h3>
                    <div className="mt-1 text-sm text-red-700">
                      <p>هذه الوحدة مؤجرة حالياً. حذفها سيؤثر على الحجوزات والمدفوعات المرتبطة بها.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedUnit && selectedUnit.status === 'maintenance' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">ملاحظة</h3>
                    <div className="mt-1 text-sm text-yellow-700">
                      <p>هذه الوحدة قيد الصيانة حالياً. تأكد من إنهاء أعمال الصيانة قبل الحذف.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}