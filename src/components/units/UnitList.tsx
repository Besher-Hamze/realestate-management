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
}

export default function UnitList({
  units,
  isLoading,
  onDelete,
  refetch,
  forTenant = false,
}: UnitListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<RealEstateUnit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // التعامل مع النقر على الصف
  const handleRowClick = (unit: RealEstateUnit) => {
    if (forTenant) {
      router.push(`/tenant/units/${unit.id}`);
    } else {
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

  // تحديد الأعمدة للجدول
  const baseColumns: TableColumn<RealEstateUnit>[] = [
    {
      key: 'unitNumber',
      header: 'رقم الوحدة',
      cell: (unit) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{unit.unitNumber}</span>
          <span className="text-xs text-gray-500">
            المبنى: {unit.building?.name || 'غير متوفر'}
          </span>
        </div>
      ),
    },
    {
      key: 'unitType',
      header: 'نوع الوحدة',
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
        <span className="font-medium text-gray-900">
          {formatCurrency(unit.price)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (unit) => {
        const statusClasses = {
          available: 'bg-green-100 text-green-800',
          rented: 'bg-blue-100 text-blue-800',
          maintenance: 'bg-yellow-100 text-yellow-800',
        };
        
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
            ${statusClasses[unit.status]}`}
          >
            {getUnitStatusLabel(unit.status)}
          </span>
        );
      },
    },
  ];

  // أعمدة خاصة بالمشرف/المدير مع الإجراءات
  const adminColumns: TableColumn<RealEstateUnit>[] = [
    ...baseColumns,
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (unit) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/units/${unit.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">عرض</Button>
          </Link>
          <Link href={`/dashboard/units/${unit.id}/edit`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">تعديل</Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => openDeleteModal(unit, e)}
          >
            حذف
          </Button>
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
        <div className="flex space-x-2">
          <Link href={`/tenant/units/${unit.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">عرض التفاصيل</Button>
          </Link>
          <Link href={`/tenant/services/create?unitId=${unit.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="primary">طلب خدمة</Button>
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
          <p className="text-gray-600">
            هل أنت متأكد من أنك تريد حذف الوحدة "{selectedUnit?.unitNumber}"؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
        </Modal>
      )}
    </>
  );
}