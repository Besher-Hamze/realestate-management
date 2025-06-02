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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // التعامل مع النقر على الصف
  const handleRowClick = (building: Building) => {
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

  // تعريف الأعمدة للجدول
  const columns: TableColumn<Building>[] = [
    {
      key: 'name',
      header: 'الاسم',
      cell: (building) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{building.name}</span>
          <span className="text-xs text-gray-500">{BUILDING_TYPE_OPTIONS.find(e => e.value == building.buildingType)?.label}</span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'العنوان',
      cell: (building) => <span className="text-gray-500">{building.address}</span>,
    },
    {
      key: 'totalUnits',
      header: 'الوحدات',
      cell: (building) => <span className="text-gray-900">{building.totalUnits}</span>,
    },
    {
      key: 'createdAt',
      header: 'تاريخ الإنشاء',
      cell: (building) => <span className="text-gray-500">{formatDate(building.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (building) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/buildings/${building.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">عرض</Button>
          </Link>
          <Link href={`/dashboard/buildings/${building.id}/edit`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">تعديل</Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => openDeleteModal(building, e)}
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
        <p className="text-gray-600">
          هل أنت متأكد أنك تريد حذف المبنى "{selectedBuilding?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
      </Modal>
    </>
  );
}