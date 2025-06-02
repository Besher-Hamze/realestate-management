'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { RealEstateUnit, Reservation } from '@/lib/types';
import { unitsApi, reservationsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Table, { TableColumn } from '@/components/ui/Table';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  getUnitTypeLabel,
  getUnitLayoutLabel,
  getUnitStatusLabel,
  getReservationStatusLabel
} from '@/constants/options';

interface UnitDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function UnitDetailPage({ params }: UnitDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [unit, setUnit] = useState<RealEstateUnit | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReservationsLoading, setIsReservationsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // جلب تفاصيل الوحدة عند تحميل المكون
  useEffect(() => {
    fetchUnit();
  }, [id]);

  // جلب بيانات الوحدة
  const fetchUnit = async () => {
    try {
      setIsLoading(true);
      const response = await unitsApi.getById(id);

      if (response.success) {
        setUnit(response.data);
        fetchReservations();
      } else {
        toast.error(response.message || 'فشل في جلب تفاصيل الوحدة');
      }
    } catch (error) {
      console.error('خطأ في جلب الوحدة:', error);
      toast.error('حدث خطأ أثناء جلب تفاصيل الوحدة');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب الحجوزات لهذه الوحدة
  const fetchReservations = async () => {
    try {
      setIsReservationsLoading(true);
      const response = await reservationsApi.getByUnitId(id);

      if (response.success) {
        setReservations(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب حجوزات الوحدة');
      }
    } catch (error) {
      console.error('خطأ في جلب الحجوزات:', error);
      toast.error('حدث خطأ أثناء جلب حجوزات الوحدة');
    } finally {
      setIsReservationsLoading(false);
    }
  };

  // حذف الوحدة
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await unitsApi.delete(id);

      if (response.success) {
        toast.success('تم حذف الوحدة بنجاح');
        router.push('/dashboard/units');
      } else {
        toast.error(response.message || 'فشل في حذف الوحدة');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('خطأ في حذف الوحدة:', error);
      toast.error('حدث خطأ أثناء حذف الوحدة');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // تغيير حالة الوحدة
  const handleStatusChange = async (newStatus: string) => {
    if (!unit) return;

    try {
      const response = await unitsApi.update(id, { status: newStatus });

      if (response.success) {
        toast.success(`تم تحديث حالة الوحدة إلى ${getUnitStatusLabel(newStatus)}`);
        setUnit(response.data);
      } else {
        toast.error(response.message || 'فشل في تحديث حالة الوحدة');
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الوحدة:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الوحدة');
    }
  };

  // تحديد الأعمدة لجدول الحجوزات
  const reservationColumns: TableColumn<Reservation>[] = [
    {
      key: 'tenant',
      header: 'المستأجر',
      cell: (reservation) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{reservation.user?.fullName || 'غير متوفر'}</span>
          <span className="text-xs text-gray-500">{reservation.user?.email || 'غير متوفر'}</span>
        </div>
      ),
    },
    {
      key: 'period',
      header: 'الفترة',
      cell: (reservation) => (
        <div className="flex flex-col">
          <span className="text-gray-900">{formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}</span>
          <span className="text-xs text-gray-500">{reservation.contractDuration}</span>
        </div>
      ),
    },
    {
      key: 'contract',
      header: 'العقد',
      cell: (reservation) => (
        <div className="flex flex-col">
          <span className="text-gray-900">{reservation.contractType === 'residential' ? 'سكني' : 'تجاري'}</span>
          <span className="text-xs text-gray-500">
            {reservation.paymentMethod === 'cash' ? 'نقدي' : 'شيكات'} •
            {reservation.paymentSchedule === 'monthly' ? ' شهري' :
              reservation.paymentSchedule === 'quarterly' ? ' ربع سنوي' :
                reservation.paymentSchedule === 'biannual' ? ' نصف سنوي' :
                  reservation.paymentSchedule === 'annual' ? ' سنوي' :
                    reservation.paymentSchedule}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (reservation) => {
        const statusClasses = {
          active: 'bg-green-100 text-green-800',
          expired: 'bg-gray-100 text-gray-800',
          cancelled: 'bg-red-100 text-red-800',
        };

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
            ${statusClasses[reservation.status]}`}
          >
            {getReservationStatusLabel(reservation.status)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (reservation) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/reservations/${reservation.id}`}>
            <Button size="sm" variant="outline">عرض</Button>
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
          <p className="text-gray-600">جاري تحميل تفاصيل الوحدة...</p>
        </div>
      </div>
    );
  }

  // عرض حالة عدم العثور
  if (!unit) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">الوحدة غير موجودة</h2>
        <p className="text-gray-600 mb-6">الوحدة التي تبحث عنها غير موجودة أو ليس لديك صلاحية لعرضها.</p>
        <Link href="/dashboard/units">
          <Button>العودة إلى الوحدات</Button>
        </Link>
      </div>
    );
  }

  // تحديد لون الحالة
  const statusColors = {
    available: 'bg-green-100 text-green-800 border-green-200',
    rented: 'bg-blue-100 text-blue-800 border-blue-200',
    maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return (
    <div className="space-y-6">
      {/* الترويسة مع مسار التنقل والإجراءات */}
      <div className="flex flex-col space-y-4">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/dashboard" className="hover:text-primary-600">لوحة التحكم</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/dashboard/units" className="hover:text-primary-600">الوحدات</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">{unit.unitNumber}</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">الوحدة {unit.unitNumber}</h1>
          <div className="flex space-x-3">
            <Link href={`/dashboard/reservations/create?unitId=${unit.id}`}>
              <Button
                variant="primary"
                leftIcon={
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                إنشاء حجز
              </Button>
            </Link>
            <Link href={`/dashboard/units/${unit.id}/edit`}>
              <Button variant="outline">تعديل الوحدة</Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>حذف</Button>
          </div>
        </div>
      </div>

      {/* تفاصيل الوحدة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المعلومات الرئيسية */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">معلومات الوحدة</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[unit.status]}`}
              >
                {getUnitStatusLabel(unit.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">المبنى</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.building ? `${unit.building.buildingNumber} - ${unit.building.name}` : 'غير متوفر'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">نوع الوحدة</h3>
                <p className="mt-1 text-base text-gray-900">
                  {getUnitTypeLabel(unit.unitType)}
                  {unit.unitLayout && ` (${getUnitLayoutLabel(unit.unitLayout)})`}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">الطابق</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.floor}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">المساحة</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.area} م²
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">السعر</h3>
                <p className="mt-1 text-base text-gray-900 font-medium">
                  {formatCurrency(unit.price)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">غرف النوم</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.bedrooms}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">الحمامات</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.bathrooms}
                </p>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">الوصف</h3>
                <p className="mt-1 text-base text-gray-900">
                  {unit.description || 'لا يوجد وصف متاح'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* إجراءات تغيير الحالة */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">تغيير الحالة</h2>

            <div className="space-y-4">
              <Button
                variant="success"
                fullWidth
                disabled={unit.status === 'available'}
                onClick={() => handleStatusChange('available')}
              >
                تعيين كمتاحة
              </Button>

              {/* <Button
                variant="info"
                fullWidth
                disabled={unit.status === 'rented'}
                onClick={() => handleStatusChange('rented')}
              >
                تعيين كمؤجرة
              </Button> */}

              <Button
                variant="warning"
                fullWidth
                disabled={unit.status === 'maintenance'}
                onClick={() => handleStatusChange('maintenance')}
              >
                تعيين تحت الصيانة
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-3">روابط سريعة</h3>
              <div className="space-y-3">
                <Link href={`/dashboard/reservations/create?unitId=${unit.id}`}>
                  <Button variant="primary" fullWidth>
                    إنشاء حجز جديد
                  </Button>
                </Link>
                {unit.building && (
                  <Link href={`/dashboard/buildings/${unit.building.id}`}>
                    <Button variant="outline" fullWidth>
                      عرض المبنى
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* سجل الحجوزات */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">سجل الحجوزات</h2>
          <Link href={`/dashboard/reservations/create?unitId=${unit.id}`}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              إنشاء حجز
            </Button>
          </Link>
        </div>

        <Card>
          <Table
            data={reservations}
            columns={reservationColumns}
            keyExtractor={(reservation) => reservation.id}
            isLoading={isReservationsLoading}
            emptyMessage="لا يوجد سجل حجوزات لهذه الوحدة"
            onRowClick={(reservation) => router.push(`/dashboard/reservations/${reservation.id}`)}
          />
        </Card>
      </div>

      {/* نافذة تأكيد الحذف */}
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
        <p className="text-gray-600 mb-4">
          هل أنت متأكد من أنك تريد حذف الوحدة "{unit.unitNumber}"؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        {reservations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-yellow-700 font-medium">تحذير</span>
            </div>
            <p className="text-yellow-600 mt-1 text-sm">
              هذه الوحدة لديها {reservations.length} حجز. حذف الوحدة قد يؤثر على هذه الحجوزات.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}