import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Building } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { buildingsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { BUILDING_TYPE_OPTIONS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

interface BuildingListProps {
  buildings: Building[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
}

export default function BuildingList({
  buildings,
  isLoading,
  onDelete,
  refetch,
}: BuildingListProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user can perform actions
  const canEdit = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';

  // التعامل مع النقر على الصف
  const handleRowClick = (building: Building) => {
    if (canEdit)
      router.push(`/dashboard/buildings/${building.id}`);
  };

  // فتح نافذة تأكيد الحذف
  const openDeleteModal = (building: Building, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBuilding(building);
    setDeleteModalOpen(true);
  };

  // حذف المبنى
  const handleDelete = async () => {
    if (!selectedBuilding) return;

    try {
      setIsDeleting(true);
      const response = await buildingsApi.delete(selectedBuilding.id);

      if (response.success) {
        toast.success('تم حذف المبنى بنجاح');
        setDeleteModalOpen(false);

        // استدعاء دالة الحذف أو إعادة جلب البيانات
        if (onDelete) {
          onDelete(selectedBuilding.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'فشل في حذف المبنى');
      }
    } catch (error) {
      console.error('خطأ في حذف المبنى:', error);
      toast.error('حدث خطأ أثناء حذف المبنى');
    } finally {
      setIsDeleting(false);
    }
  };

  // إضافة زر إنشاء وحدة جديدة
  const handleCreateUnit = (building: Building, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/units/create?buildingId=${building.id}`);
  };

  // تعريف الأعمدة للجدول
  const columns: TableColumn<Building>[] = [
    {
      key: 'name',
      header: 'معلومات المبنى',
      cell: (building) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{building.name}</span>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{BUILDING_TYPE_OPTIONS.find(e => e.value === building.buildingType)?.label}</span>
            <span>•</span>
            <span>رقم المبنى: {building.buildingNumber}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'العنوان',
      cell: (building) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{building.address}</span>
          {building.company && (
            <span className="text-xs text-gray-500">
              الشركة: {building.company.name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'units',
      header: 'الوحدات',
      cell: (building) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{building.totalUnits}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'تاريخ الإنشاء',
      cell: (building) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{formatDate(building.createdAt)}</span>
          <span className="text-xs text-gray-500">
            آخر تحديث: {formatDate(building.updatedAt)}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (building) => (
        <div className="flex flex-wrap gap-1">
          <Link href={`/dashboard/buildings/${building.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">عرض</Button>
          </Link>

          {canEdit && (
            <>
              <Link href={`/dashboard/buildings/${building.id}/edit`} onClick={(e) => e.stopPropagation()}>
                <Button size="xs" variant="outline">تعديل</Button>
              </Link>

              <Button
                size="xs"
                variant="primary"
                onClick={(e) => handleCreateUnit(building, e)}
                title="إضافة وحدة جديدة"
              >
                + وحدة
              </Button>
            </>
          )}

          {canDelete && (
            <Button
              size="xs"
              variant="danger"
              onClick={(e) => openDeleteModal(building, e)}
            >
              حذف
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        data={buildings}
        columns={columns}
        keyExtractor={(building) => building.id}
        isLoading={isLoading}
        emptyMessage="لم يتم العثور على مباني"
        onRowClick={handleRowClick}
      />

      {/* نافذة تأكيد الحذف */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="حذف المبنى"
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
            هل أنت متأكد أنك تريد حذف المبنى "{selectedBuilding?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
          </p>

          {selectedBuilding && selectedBuilding.totalUnits > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">تحذير</h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    <p>هذا المبنى يحتوي على {selectedBuilding.totalUnits} وحدة. حذف المبنى سيؤدي إلى حذف جميع الوحدات المرتبطة به.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}