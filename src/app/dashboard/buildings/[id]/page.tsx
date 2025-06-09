'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Building, Unit } from '@/lib/types';
import { buildingsApi, unitsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Table, { TableColumn } from '@/components/ui/Table';
import { formatDate } from '@/lib/utils';
import { BUILDING_TYPE_OPTIONS } from '@/constants';

interface BuildingDetailPageProps {
  params: Promise<{
    id: string;
  }>;

}

export default function BuildingDetailPage({ params }: BuildingDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [building, setBuilding] = useState<Building | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnitsLoading, setIsUnitsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // جلب تفاصيل المبنى عند تحميل المكون
  useEffect(() => {
    fetchBuilding();
  }, [id]);

  // جلب بيانات المبنى
  const fetchBuilding = async () => {
    try {
      setIsLoading(true);
      const response = await buildingsApi.getById(id);

      if (response.success) {
        setBuilding(response.data);
        fetchUnits();
      } else {
        toast.error(response.message || 'فشل في جلب تفاصيل المبنى');
      }
    } catch (error) {
      console.error('خطأ في جلب المبنى:', error);
      toast.error('حدث خطأ أثناء جلب تفاصيل المبنى');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب الوحدات لهذا المبنى
  const fetchUnits = async () => {
    try {
      setIsUnitsLoading(true);
      const response = await unitsApi.getByBuildingId(id);

      if (response.success) {
        setUnits(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب وحدات المبنى');
      }
    } catch (error) {
      console.error('خطأ في جلب الوحدات:', error);
      toast.error('حدث خطأ أثناء جلب وحدات المبنى');
    } finally {
      setIsUnitsLoading(false);
    }
  };

  // حذف المبنى
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await buildingsApi.delete(id);

      if (response.success) {
        toast.success('تم حذف المبنى بنجاح');
        router.push('/dashboard/buildings');
      } else {
        toast.error(response.message || 'فشل في حذف المبنى');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('خطأ في حذف المبنى:', error);
      toast.error('حدث خطأ أثناء حذف المبنى');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // تعريف أعمدة جدول الوحدات
  const unitColumns: TableColumn<Unit>[] = [
    {
      key: 'unitNumber',
      header: 'رقم الوحدة',
      cell: (unit) => <span className="font-medium text-gray-900">{unit.unitNumber}</span>,
    },
    {
      key: 'floor',
      header: 'الطابق',
      cell: (unit) => <span className="text-gray-700">{unit.floor}</span>,
    },
    {
      key: 'area',
      header: 'المساحة (م²)',
      cell: (unit) => <span className="text-gray-700">{unit.area}</span>,
    },

    {
      key: 'bathrooms',
      header: 'الحمامات',
      cell: (unit) => <span className="text-gray-700">{unit.bathrooms}</span>,
    },
    {
      key: 'price',
      header: 'السعر',
      cell: (unit) => <span className="text-gray-900 font-medium">${unit.price}</span>,
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (unit) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${unit.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}
        >
          {unit.status === 'available' ? 'متاح' : 'مؤجر'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (unit) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/units/${unit.id}`}>
            <Button size="sm" variant="outline">عرض</Button>
          </Link>
          <Link href={`/dashboard/units/${unit.id}/edit`}>
            <Button size="sm" variant="outline">تعديل</Button>
          </Link>
        </div>
      ),
    },
  ];

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-primary-500 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">جاري تحميل تفاصيل المبنى...</p>
        </div>
      </div>
    );
  }

  // عرض حالة عدم العثور على المبنى
  if (!building) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">لم يتم العثور على المبنى</h2>
        <p className="text-gray-600 mb-6">المبنى الذي تبحث عنه غير موجود أو ليس لديك صلاحية مشاهدته.</p>
        <Link href="/dashboard/buildings">
          <Button>العودة إلى المباني</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان مع مسار التنقل والإجراءات */}
      <div className="flex flex-col space-y-4">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/dashboard" className="hover:text-primary-600">لوحة التحكم</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/dashboard/buildings" className="hover:text-primary-600">المباني</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">{building.name}</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{building.name}</h1>
          <div className="flex space-x-3">
            <Link href={`/dashboard/units/create?buildingId=${building.id}`}>
              <Button
                variant="primary"
                leftIcon={
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                إضافة وحدة
              </Button>
            </Link>
            <Link href={`/dashboard/buildings/${building.id}/edit`}>
              <Button variant="outline">تعديل المبنى</Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>حذف</Button>
          </div>
        </div>
      </div>

      {/* تفاصيل المبنى */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المعلومات الرئيسية */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات المبنى</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">نوع المبنى</h3>
                <p className="mt-1 text-base text-gray-900 capitalize">
                  {BUILDING_TYPE_OPTIONS.find(e => e.value == building.buildingType)?.label}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">إجمالي الوحدات</h3>
                <p className="mt-1 text-base text-gray-900">
                  {building.totalUnits}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">عدد المواقف الداخلية</h3>
                <p className="mt-1 text-base text-gray-900">
                  {building.internalParkingSpaces}
                </p>
              </div>


              <div>
                <h3 className="text-sm font-medium text-gray-500">العنوان</h3>
                <p className="mt-1 text-base text-gray-900">
                  {building.address}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">تاريخ الإنشاء</h3>
                <p className="mt-1 text-base text-gray-900">
                  {formatDate(building.createdAt)}
                </p>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">الوصف</h3>
                <p className="mt-1 text-base text-gray-900">
                  {building.description || 'لا يوجد وصف مقدم'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* الإحصائيات */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">الإحصائيات</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">الوحدات المتاحة</h3>
                <p className="mt-1 text-2xl font-semibold text-green-600">
                  {units.filter(unit => unit.status === 'available').length}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">الوحدات المؤجرة</h3>
                <p className="mt-1 text-2xl font-semibold text-blue-600">
                  {units.filter(unit => unit.status === 'rented').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* قائمة الوحدات */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">الوحدات</h2>
          <Link href={`/dashboard/units/create?buildingId=${building.id}`}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              إضافة وحدة
            </Button>
          </Link>
        </div>

        <Card>
          <Table
            data={units}
            columns={unitColumns}
            keyExtractor={(unit) => unit.id}
            isLoading={isUnitsLoading}
            emptyMessage="لا توجد وحدات لهذا المبنى"
            onRowClick={(unit) => router.push(`/dashboard/units/${unit.id}`)}
          />
        </Card>
      </div>

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
        <p className="text-gray-600 mb-4">
          هل أنت متأكد أنك تريد حذف المبنى "{building.name}"؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
          <p className="text-sm font-medium">تحذير</p>
          <p className="text-sm">حذف هذا المبنى سيؤدي أيضًا إلى حذف جميع الوحدات والبيانات المرتبطة به. ستتأثر أي حجوزات نشطة.</p>
        </div>
      </Modal>
    </div>
  );
}