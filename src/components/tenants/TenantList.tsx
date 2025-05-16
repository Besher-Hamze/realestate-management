import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Tenant } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { tenantsApi } from '@/lib/api';
import { formatPhoneNumber } from '@/lib/utils';
import { getTenantTypeLabel } from '@/constants/options';

interface TenantListProps {
  tenants: Tenant[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
}

export default function TenantList({
  tenants,
  isLoading,
  onDelete,
  refetch,
}: TenantListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // التعامل مع النقر على الصف
  const handleRowClick = (tenant: Tenant) => {
    router.push(`/dashboard/tenants/${tenant.id}`);
  };

  // فتح نافذة تأكيد الحذف
  const openDeleteModal = (tenant: Tenant, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTenant(tenant);
    setDeleteModalOpen(true);
  };

  // حذف المستأجر
  const handleDelete = async () => {
    if (!selectedTenant) return;

    try {
      setIsDeleting(true);
      const response = await tenantsApi.delete(selectedTenant.id);

      if (response.success) {
        toast.success('تم حذف المستأجر بنجاح');
        setDeleteModalOpen(false);

        // استدعاء وظيفة الحذف أو إعادة جلب البيانات
        if (onDelete) {
          onDelete(selectedTenant.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'فشل في حذف المستأجر');
      }
    } catch (error) {
      console.error('خطأ في حذف المستأجر:', error);
      toast.error('حدث خطأ أثناء حذف المستأجر');
    } finally {
      setIsDeleting(false);
    }
  };

  // تحديد الأعمدة للجدول
  const columns: TableColumn<Tenant>[] = [
    {
      key: 'name',
      header: 'المستأجر',
      cell: (tenant) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{tenant.user?.fullName || 'غير متوفر'}</span>
          <span className="text-xs text-gray-500">{tenant.user?.email || 'غير متوفر'}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'معلومات الاتصال',
      cell: (tenant) => (
        <div className="flex flex-col">
          <span className="text-gray-900">{formatPhoneNumber(tenant.user?.phone || '')}</span>
          <span className="text-xs text-gray-500">{formatPhoneNumber(tenant.user?.whatsappNumber || '')}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'النوع',
      cell: (tenant) => (
        <span className="text-gray-900">
          {getTenantTypeLabel(tenant.tenantType)}
        </span>
      ),
    },
    {
      key: 'business',
      header: 'معلومات الشركة',
      cell: (tenant) => (
        <div className="flex flex-col">
          {tenant.tenantType !== 'person' ? (
            <>
              <span className="text-gray-900">{tenant.contactPerson || ''}</span>
              <span className="text-xs text-gray-500">{tenant.contactPosition || ''}</span>
            </>
          ) : (
            <span className="text-gray-500">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (tenant) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/tenants/${tenant.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">عرض</Button>
          </Link>
          <Link href={`/dashboard/tenants/${tenant.id}/edit`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">تعديل</Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => openDeleteModal(tenant, e)}
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
        data={tenants}
        columns={columns}
        keyExtractor={(tenant) => tenant.id}
        isLoading={isLoading}
        emptyMessage="لا يوجد مستأجرين"
        onRowClick={handleRowClick}
      />

      {/* نافذة تأكيد الحذف */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="حذف المستأجر"
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
          هل أنت متأكد من أنك تريد حذف المستأجر "{selectedTenant?.user?.fullName}"؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-yellow-700 font-medium">تحذير</span>
          </div>
          <p className="text-yellow-600 mt-1 text-sm">
            حذف المستأجر سيؤدي أيضًا إلى حذف حساب المستخدم المرتبط به وقد يؤثر على الحجوزات المرتبطة.
          </p>
        </div>
      </Modal>
    </>
  );
}