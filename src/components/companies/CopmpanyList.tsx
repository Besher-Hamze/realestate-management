import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Company } from '@/lib/types';
import Table, { TableColumn } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { companiesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface CompanyListProps {
  companies: Company[];
  isLoading: boolean;
  onDelete?: (id: number) => void;
  refetch: () => void;
}

export default function CompanyList({
  companies,
  isLoading,
  onDelete,
  refetch,
}: CompanyListProps) {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // التعامل مع النقر على الصف
  const handleRowClick = (company: Company) => {
    router.push(`/dashboard/companies/${company.id}`);
  };

  // فتح نافذة تأكيد الحذف
  const openDeleteModal = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompany(company);
    setDeleteModalOpen(true);
  };

  // حذف الشركة
  const handleDelete = async () => {
    if (!selectedCompany) return;

    try {
      setIsDeleting(true);
      const response = await companiesApi.delete(selectedCompany.id);

      if (response.success) {
        toast.success('تم حذف الشركة بنجاح');
        setDeleteModalOpen(false);

        // استدعاء دالة الحذف أو إعادة جلب البيانات
        if (onDelete) {
          onDelete(selectedCompany.id);
        } else {
          refetch();
        }
      } else {
        toast.error(response.message || 'فشل في حذف الشركة');
      }
    } catch (error) {
      console.error('خطأ في حذف الشركة:', error);
      toast.error('حدث خطأ أثناء حذف الشركة');
    } finally {
      setIsDeleting(false);
    }
  };

  // تعريف أعمدة الجدول
  const columns: TableColumn<Company>[] = [
    {
      key: 'logo',
      header: '',
      cell: (company) => (
        <div className="w-10 h-10 flex items-center justify-center">
          {company.logoImageUrl ? (
            <img
              src={company.logoImageUrl}
              alt={`شعار ${company.name}`}
              className="w-8 h-8 object-contain rounded"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold">
              {company.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'اسم الشركة',
      cell: (company) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{company.name}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'معلومات الاتصال',
      cell: (company) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{company.email}</span>
          <span className="text-xs text-gray-500">{company.phone}</span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'العنوان',
      cell: (company) => <span className="text-gray-700">{company.address}</span>,
    },
    {
      key: 'createdAt',
      header: 'تاريخ الإنشاء',
      cell: (company) => <span className="text-gray-700">{formatDate(company.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (company) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/companies/${company.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">عرض</Button>
          </Link>
          <Link href={`/dashboard/companies/${company.id}/edit`} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline">تعديل</Button>
          </Link>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => openDeleteModal(company, e)}
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
        data={companies}
        columns={columns}
        keyExtractor={(company) => company.id}
        isLoading={isLoading}
        emptyMessage="لم يتم العثور على شركات"
        onRowClick={handleRowClick}
      />

      {/* نافذة تأكيد الحذف */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="حذف الشركة"
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
          هل أنت متأكد أنك تريد حذف الشركة "{selectedCompany?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
          <p className="text-sm font-medium">تحذير</p>
          <p className="text-sm">حذف هذه الشركة سيؤدي أيضًا إلى إزالة جميع المباني والوحدات والمديرين والبيانات المرتبطة بها.</p>
        </div>
      </Modal>
    </>
  );
}