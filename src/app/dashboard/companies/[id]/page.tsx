'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Company, User, Building } from '@/lib/types';
import { companiesApi, buildingsApi, usersApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import { formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { BUILDING_TYPE_OPTIONS } from '@/constants';

interface CompanyDetailPageProps {
  params: {
    id: string;
  };
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const id = params.id;
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [managers, setManagers] = useState<User[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagersLoading, setIsManagersLoading] = useState(true);
  const [isBuildingsLoading, setIsBuildingsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // فقط المسؤولون يمكنهم حذف الشركات
  const isAdmin = currentUser?.role === 'admin';

  // جلب تفاصيل الشركة عند تحميل المكون
  useEffect(() => {
    fetchCompany();
  }, [id]);

  // جلب بيانات الشركة
  const fetchCompany = async () => {
    try {
      setIsLoading(true);
      const response = await companiesApi.getById(id);

      if (response.success) {
        setCompany(response.data);
        fetchCompanyManagers();
        fetchCompanyBuildings();
      } else {
        toast.error(response.message || 'فشل في جلب تفاصيل الشركة');
      }
    } catch (error) {
      console.error('خطأ في جلب الشركة:', error);
      toast.error('حدث خطأ أثناء جلب تفاصيل الشركة');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب المديرين لهذه الشركة
  const fetchCompanyManagers = async () => {
    try {
      setIsManagersLoading(true);
      const response = await usersApi.getAll();

      if (response.success) {
        // تصفية لمستخدمي المديرين فقط في هذه الشركة
        const companyManagers = response.data.filter(
          (user: User) => user.role === 'manager' && user.companyId === parseInt(id)
        );
        setManagers(companyManagers);
      } else {
        toast.error(response.message || 'فشل في جلب مديري الشركة');
      }
    } catch (error) {
      console.error('خطأ في جلب المديرين:', error);
      toast.error('حدث خطأ أثناء جلب مديري الشركة');
    } finally {
      setIsManagersLoading(false);
    }
  };

  // جلب المباني لهذه الشركة
  const fetchCompanyBuildings = async () => {
    try {
      setIsBuildingsLoading(true);
      const response = await buildingsApi.getAll();

      if (response.success) {
        // تصفية لمباني هذه الشركة فقط
        const companyBuildings = response.data.filter(
          (building: Building) => building.companyId === parseInt(id)
        );
        setBuildings(companyBuildings);
      } else {
        toast.error(response.message || 'فشل في جلب مباني الشركة');
      }
    } catch (error) {
      console.error('خطأ في جلب المباني:', error);
      toast.error('حدث خطأ أثناء جلب مباني الشركة');
    } finally {
      setIsBuildingsLoading(false);
    }
  };

  // حذف الشركة
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await companiesApi.delete(id);

      if (response.success) {
        toast.success('تم حذف الشركة بنجاح');
        router.push('/dashboard/companies');
      } else {
        toast.error(response.message || 'فشل في حذف الشركة');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('خطأ في حذف الشركة:', error);
      toast.error('حدث خطأ أثناء حذف الشركة');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // تعريف أعمدة جدول المديرين
  const managerColumns = [
    {
      key: 'name',
      header: 'الاسم',
      cell: (user: User) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{user.fullName}</span>
          <span className="text-xs text-gray-500">{user.username}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'معلومات الاتصال',
      cell: (user: User) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{user.email}</span>
          <span className="text-xs text-gray-500">{user.phone}</span>
        </div>
      ),
    },
    {
      key: 'joined',
      header: 'تاريخ الانضمام',
      cell: (user: User) => <span className="text-gray-700">{formatDate(user.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (user: User) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/users/${user.id}`}>
            <Button size="xs" variant="outline">عرض الملف الشخصي</Button>
          </Link>
        </div>
      ),
    },
  ];

  // تعريف أعمدة جدول المباني
  const buildingColumns = [
    {
      key: 'name',
      header: 'الاسم',
      cell: (building: Building) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{building.name}</span>
          <span className="text-xs text-gray-500 capitalize">
            {BUILDING_TYPE_OPTIONS.find(e => e.value == building.buildingType)?.label}
          </span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'العنوان',
      cell: (building: Building) => <span className="text-gray-700">{building.address}</span>,
    },
    {
      key: 'units',
      header: 'الوحدات',
      cell: (building: Building) => <span className="text-gray-700">{building.totalUnits}</span>,
    },
    {
      key: 'created',
      header: 'تاريخ الإنشاء',
      cell: (building: Building) => <span className="text-gray-700">{formatDate(building.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (building: Building) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/buildings/${building.id}`}>
            <Button size="xs" variant="outline">عرض</Button>
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
          <p className="text-gray-600">جاري تحميل تفاصيل الشركة...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-xl font-bold text-gray-800 mb-2">لم يتم العثور على الشركة</h3>
        <p className="text-gray-600 mb-4">تعذر العثور على الشركة المطلوبة</p>
        <Link href="/dashboard/companies">
          <Button>العودة إلى الشركات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان مع مسار التنقل */}
      <div className="flex flex-col space-y-2">
        <nav className="text-sm text-gray-500 mb-2">
          <ol className="flex space-x-2">
            <li>
              <Link href="/dashboard" className="hover:text-primary-600">لوحة التحكم</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <Link href="/dashboard/companies" className="hover:text-primary-600">الشركات</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">{company.name}</span>
            </li>
          </ol>
        </nav>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <div className="flex space-x-3">
            <Link href={`/dashboard/companies/${id}/edit`}>
              <Button variant="outline">تعديل</Button>
            </Link>
            {isAdmin && (
              <Button
                variant="danger"
                onClick={() => setDeleteModalOpen(true)}
              >
                حذف
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* بطاقة معلومات الشركة */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">معلومات الشركة</h2>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-gray-50 w-1/3">اسم الشركة</th>
                  <td className="px-4 py-3 text-sm text-gray-900">{company.name || 'غير متوفر'}</td>
                </tr>
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-gray-50 w-1/3">نوع الشركة</th>
                  <td className="px-4 py-3 text-sm text-gray-900">{company.companyType === 'owner' ? 'مالك' : 'شركة عقارية'}</td>
                </tr>
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-gray-50 w-1/3">البريد الإلكتروني</th>
                  <td className="px-4 py-3 text-sm text-gray-900">{company.email || 'غير متوفر'}</td>
                </tr>
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-gray-50 w-1/3">رقم الهاتف</th>
                  <td className="px-4 py-3 text-sm text-gray-900 dir-ltr text-right">{company.phone || 'غير متوفر'}</td>
                </tr>
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-gray-50 w-1/3">رقم الواتساب</th>
                  <td className="px-4 py-3 text-sm text-gray-900 dir-ltr text-right">{company.whatsappNumber || 'غير متوفر'}</td>
                </tr>
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-gray-50 w-1/3">الهاتف الثانوي</th>
                  <td className="px-4 py-3 text-sm text-gray-900 dir-ltr text-right">{company.secondaryPhone || 'غير متوفر'}</td>
                </tr>
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-gray-50 w-1/3">رقم السجل التجاري</th>
                  <td className="px-4 py-3 text-sm text-gray-900">{company.registrationNumber || 'غير متوفر'}</td>
                </tr>
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-gray-50 w-1/3">اسم المفوض</th>
                  <td className="px-4 py-3 text-sm text-gray-900">{company.delegateName || 'غير متوفر'}</td>
                </tr>
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-gray-50 w-1/3">العنوان</th>
                  <td className="px-4 py-3 text-sm text-gray-900">{company.address || 'غير متوفر'}</td>
                </tr>
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 bg-gray-50 w-1/3">تاريخ الإنشاء</th>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatDate(company.createdAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {company.logoImageUrl && (
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 mb-2">شعار الشركة</p>
                <div className="flex justify-center">
                  <img
                    src={company.logoImageUrl}
                    alt={`شعار ${company.name}`}
                    className="h-32 w-auto object-contain"
                  />
                </div>
              </div>
            )}

            {company.identityImageFrontUrl && (
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 mb-2">بطاقة الهوية (الوجه الأمامي)</p>
                <div className="flex justify-center">
                  <img
                    src={company.identityImageFrontUrl}
                    alt="صورة الهوية الأمامية"
                    className="h-32 w-auto object-contain"
                  />
                </div>
              </div>
            )}


          </div>
        </div>
      </Card>


      {/* قسم المباني */}
      <Card>
        <div className="p-6">
          {currentUser?.role == "manager" && <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">المباني</h2>
            <Link href={`/dashboard/buildings/create?companyId=${id}`}>
              <Button size="sm">إضافة مبنى</Button>
            </Link>
          </div>
          }
          {isBuildingsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="flex flex-col items-center">
                <svg
                  className="animate-spin h-8 w-8 text-primary-500 mb-3"
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
                <p className="text-gray-600">جاري تحميل المباني...</p>
              </div>
            </div>
          ) : buildings.length > 0 ? (
            <Table
              columns={buildingColumns}
              data={buildings}
              keyExtractor={(item) => item.id}
              showHeader={true}
              striped={true}
            />
          ) : (
            <div className="bg-gray-50 p-6 text-center rounded-md">
              <p className="text-gray-600 mb-4">لم يتم العثور على مباني لهذه الشركة</p>
              {currentUser?.role == "manager" &&
                <Link href={`/dashboard/buildings/create?companyId=${id}`}>
                  <Button size="sm">إضافة مبنى</Button>
                </Link>

              }
            </div>
          )}
        </div>
      </Card>

      {/* نافذة تأكيد الحذف */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="حذف الشركة"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            هل أنت متأكد أنك تريد حذف <span className="font-semibold">{company?.name}</span>؟
            لا يمكن التراجع عن هذا الإجراء، وسيتم حذف جميع المباني والبيانات المرتبطة نهائيًا.
          </p>
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
              حذف الشركة
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}