import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ServiceOrder } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { servicesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface ServiceListProps {
  services: ServiceOrder[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
  forTenant?: boolean;
}

export default function ServiceList({
  services,
  isLoading,
  onDelete,
  refetch,
  forTenant = false,
}: ServiceListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // التعامل مع النقر على الصف
  const handleRowClick = (service: ServiceOrder) => {
    if (forTenant) {
      router.push(`/tenant/services/${service.id}`);
    } else {
      router.push(`/dashboard/services/${service.id}`);
    }
  };

  // فتح نافذة تأكيد الحذف
  const openDeleteModal = (service: ServiceOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedService(service);
    setDeleteModalOpen(true);
  };

  // فتح نافذة تحديث الحالة
  const openStatusUpdateModal = (service: ServiceOrder, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedService(service);
    setNewStatus(status);
    setStatusUpdateModalOpen(true);
  };

  // حذف الخدمة
  const handleDelete = async () => {
    if (!selectedService) return;

    try {
      setIsDeleting(true);
      const response = await servicesApi.delete(selectedService.id);

      if (response.success) {
        toast.success('تم حذف طلب الخدمة بنجاح');
        setDeleteModalOpen(false);

        // استدعاء وظيفة الحذف أو إعادة جلب البيانات
        if (onDelete) {
          onDelete(selectedService.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'فشل في حذف طلب الخدمة');
      }
    } catch (error) {
      console.error('خطأ في حذف طلب الخدمة:', error);
      toast.error('حدث خطأ أثناء حذف طلب الخدمة');
    } finally {
      setIsDeleting(false);
    }
  };

  // تحديث حالة الخدمة
  const handleStatusUpdate = async () => {
    if (!selectedService || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      const response = await servicesApi.update(selectedService.id, {
        ...selectedService,
        status: newStatus,
      });

      if (response.success) {
        let statusText = '';
        switch (newStatus) {
          case 'pending': statusText = 'قيد الانتظار'; break;
          case 'in-progress': statusText = 'قيد التنفيذ'; break;
          case 'completed': statusText = 'مكتمل'; break;
          case 'cancelled': statusText = 'ملغي'; break;
          default: statusText = newStatus.replace('-', ' ');
        }
        toast.success(`تم تحديث حالة طلب الخدمة إلى ${statusText}`);
        setStatusUpdateModalOpen(false);
        refetch();
      } else {
        toast.error(response.message || 'فشل في تحديث حالة طلب الخدمة');
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الخدمة:', error);
      toast.error('حدث خطأ أثناء تحديث حالة طلب الخدمة');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // مكون زر تحديث الحالة
  const StatusButton = ({ service, status, label, color }: { service: ServiceOrder; status: string; label: string; color: string }) => (
    <Button
      size="xs"
      variant="outline"
      className={`border-${color}-500 text-${color}-700 hover:bg-${color}-50`}
      onClick={(e) => openStatusUpdateModal(service, status, e)}
      disabled={service.status === status}
    >
      {label}
    </Button>
  );

  // ترجمة حالة الخدمة
  const translateStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'in-progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // ترجمة نوع الخدمة
  const translateServiceType = (type: string) => {
    switch (type) {
      case 'maintenance': return 'صيانة';
      case 'financial': return 'مالي';
      case 'administrative': return 'إداري';
      default: return type;
    }
  };

  // ترجمة النوع الفرعي للخدمة
  const translateServiceSubtype = (subtype: string) => {
    switch (subtype) {
      case 'electrical': return 'كهربائي';
      case 'plumbing': return 'سباكة';
      case 'hvac': return 'تكييف وتدفئة';
      case 'appliance': return 'أجهزة منزلية';
      case 'structural': return 'هيكلي';
      case 'general': return 'عام';
      case 'deep': return 'تنظيف عميق';
      case 'windows': return 'تنظيف نوافذ';
      case 'carpets': return 'تنظيف سجاد';
      case 'locksmith': return 'أقفال';
      case 'camera': return 'كاميرات أمنية';
      case 'alarm': return 'نظام إنذار';
      default: return subtype;
    }
  };

  // تحديد الأعمدة للجدول
  const baseColumns: TableColumn<ServiceOrder>[] = [
    {
      key: 'type',
      header: 'النوع',
      cell: (service) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{translateServiceType(service.serviceType)}</span>
          <span className="text-xs text-gray-500">{translateServiceSubtype(service.serviceSubtype)}</span>
        </div>
      ),
    },
    {
      key: 'property',
      header: 'العقار',
      cell: (service) => {
        const unitNumber = service.reservation?.unit?.unitNumber || 'غير متوفر';
        const buildingName = service.reservation?.unit?.building?.name || 'غير متوفر';
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
      cell: (service) => {
        const tenantName = service.reservation?.user?.fullName || 'غير متوفر';
        const tenantEmail = service.reservation?.user?.email || '';
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{tenantName}</span>
            {tenantEmail && <span className="text-xs text-gray-500">{tenantEmail}</span>}
          </div>
        );
      },
    },
    {
      key: 'created',
      header: 'تاريخ التقديم',
      cell: (service) => <span className="text-gray-700">{formatDate(service.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (service) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              service.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                service.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
            }`}
        >
          {translateStatus(service.status)}
        </span>
      ),
    },
  ];

  // أعمدة خاصة بالمشرف/المدير مع الإجراءات
  const adminColumns: TableColumn<ServiceOrder>[] = [
    ...baseColumns,
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (service) => (
        <div className="flex space-x-2">
          {/* زر العرض */}
          <Link href={`/dashboard/services/${service.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">عرض</Button>
          </Link>

          {/* أزرار تحديث الحالة */}
          <div className="flex space-x-1">
            <StatusButton service={service} status="in-progress" label="بدء" color="blue" />
            <StatusButton service={service} status="completed" label="إكمال" color="green" />
            <StatusButton service={service} status="cancelled" label="إلغاء" color="red" />
          </div>

          {/* زر الحذف */}
          <Button
            size="xs"
            variant="danger"
            onClick={(e) => openDeleteModal(service, e)}
          >
            حذف
          </Button>
        </div>
      ),
    },
  ];

  // أعمدة خاصة بالمستأجر
  const tenantColumns: TableColumn<ServiceOrder>[] = [
    // إزالة عمود المستأجر من عرض المستأجر
    ...baseColumns.filter(col => col.key !== 'tenant'),
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (service) => (
        <div className="flex space-x-2">
          <Link href={`/tenant/services/${service.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">عرض التفاصيل</Button>
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
        data={services}
        columns={columns}
        keyExtractor={(service) => service.id}
        isLoading={isLoading}
        emptyMessage="لا توجد طلبات خدمة"
        onRowClick={handleRowClick}
      />

      {/* نافذة تأكيد الحذف */}
      {!forTenant && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="حذف طلب الخدمة"
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
            هل أنت متأكد من أنك تريد حذف طلب الخدمة هذا؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
        </Modal>
      )}

      {/* نافذة تأكيد تحديث الحالة */}
      {!forTenant && (
        <Modal
          isOpen={statusUpdateModalOpen}
          onClose={() => setStatusUpdateModalOpen(false)}
          title="تحديث الحالة"
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
          <p className="text-gray-600">
            هل أنت متأكد من أنك تريد تغيير الحالة إلى{" "}
            <span className="font-medium">
              {translateStatus(newStatus)}
            </span>
            ؟
          </p>
          {newStatus === 'cancelled' && (
            <p className="mt-2 text-red-600 text-sm">
              ملاحظة: إلغاء طلب الخدمة سيؤدي إلى إخطار المستأجر بأن طلبه لن تتم معالجته.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}