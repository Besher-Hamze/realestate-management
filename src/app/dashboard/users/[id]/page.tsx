'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { User, Reservation } from '@/lib/types';
import { usersApi, reservationsApi, authApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Table, { TableColumn } from '@/components/ui/Table';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const id = params.id;
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReservationsLoading, setIsReservationsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // لإعادة تعيين كلمة المرور
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // لنموذج تحديث المستخدم
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // جلب تفاصيل المستخدم عند تحميل المكون
  useEffect(() => {
    fetchUser();
  }, [id]);

  // جلب بيانات المستخدم
  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getById(id);

      if (response.success) {
        setUser(response.data);
        setFormData({
          fullName: response.data.fullName,
          email: response.data.email,
          phone: response.data.phone,
        });

        if (response.data.role === 'tenant') {
          fetchUserReservations(response.data.id);
        } else {
          setIsReservationsLoading(false);
        }
      } else {
        toast.error(response.message || 'فشل في جلب تفاصيل المستخدم');
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدم:', error);
      toast.error('حدث خطأ أثناء جلب تفاصيل المستخدم');
    } finally {
      setIsLoading(false);
    }
  };

  // جلب المستأجرين  للمستأجر
  const fetchUserReservations = async (userId: number) => {
    try {
      setIsReservationsLoading(true);
      const response = await reservationsApi.getByUserId(userId);

      if (response.success) {
        setReservations(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب حجوزات المستخدم');
      }
    } catch (error) {
      console.error('خطأ في جلب المستأجرين :', error);
      toast.error('حدث خطأ أثناء جلب حجوزات المستخدم');
    } finally {
      setIsReservationsLoading(false);
    }
  };

  // حذف المستخدم
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await usersApi.delete(id);

      if (response.success) {
        toast.success('تم حذف المستخدم بنجاح');
        router.push('/dashboard/users');
      } else {
        toast.error(response.message || 'فشل في حذف المستخدم');
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      toast.error('حدث خطأ أثناء حذف المستخدم');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // تحديث المستخدم
  const handleUpdateUser = async () => {
    try {
      setIsUpdating(true);
      const response = await usersApi.update(id, formData);

      if (response.success) {
        toast.success('تم تحديث المستخدم بنجاح');
        setEditModalOpen(false);
        setUser(response.data);
      } else {
        toast.error(response.message || 'فشل في تحديث المستخدم');
      }
    } catch (error) {
      console.error('خطأ في تحديث المستخدم:', error);
      toast.error('حدث خطأ أثناء تحديث المستخدم');
    } finally {
      setIsUpdating(false);
    }
  };

  // إعادة تعيين كلمة مرور المدير
  const handleResetPassword = async () => {
    if (!user || user.role !== 'manager') return;

    try {
      setIsResettingPassword(true);

      // فقط المشرفين يمكنهم إعادة تعيين كلمات مرور المديرين
      if (currentUser?.role === 'admin') {
        const response = await authApi.resetManagerPassword(user.id, newPassword);

        if (response.success) {
          toast.success('تم إعادة تعيين كلمة المرور بنجاح');
          setResetPasswordModalOpen(false);
        } else {
          toast.error(response.message || 'فشل في إعادة تعيين كلمة المرور');
        }
      } else {
        toast.error('ليس لديك صلاحية لإعادة تعيين كلمة المرور هذه');
      }
    } catch (error) {
      console.error('خطأ في إعادة تعيين كلمة المرور:', error);
      toast.error('حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // التعامل مع تغيير إدخال النموذج
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // تحديد الأعمدة لجدول المستأجرين 
  const reservationColumns: TableColumn<Reservation>[] = [
    {
      key: 'unit',
      header: 'الوحدة',
      cell: (reservation) => {
        const unitNumber = reservation.unit?.unitNumber || 'غير متوفر';
        const buildingName = reservation.unit?.building?.name || 'غير متوفر';
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{unitNumber}</span>
            <span className="text-xs text-gray-500">{buildingName}</span>
          </div>
        );
      },
    },
    {
      key: 'period',
      header: 'الفترة',
      cell: (reservation) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (reservation) => {
        let statusText = '';
        switch (reservation.status) {
          case 'active':
            statusText = 'نشط';
            break;
          case 'pending':
            statusText = 'قيد الانتظار';
            break;
          case 'expired':
            statusText = 'منتهي';
            break;
          default:
            statusText = 'ملغي';
        }

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reservation.status === 'active' ? 'bg-green-100 text-green-800' :
              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                reservation.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
              }`}
          >
            {statusText}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (reservation) => (
        <div className="flex space-x-2">
          <Link href={`/dashboard/reservations/${reservation.id}`} onClick={(e) => e.stopPropagation()}>
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
          <p className="text-gray-600">جاري تحميل تفاصيل المستخدم...</p>
        </div>
      </div>
    );
  }

  // عرض حالة عدم العثور
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">المستخدم غير موجود</h2>
        <p className="text-gray-600 mb-6">المستخدم الذي تبحث عنه غير موجود أو ليس لديك صلاحية لعرضه.</p>
        <Link href="/dashboard/users">
          <Button>العودة إلى المستخدمين</Button>
        </Link>
      </div>
    );
  }

  // تحديد لون شارة الدور
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'tenant':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // تحويل الدور إلى النص العربي
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مشرف';
      case 'manager':
        return 'مدير';
      case 'tenant':
        return 'مستأجر';
      default:
        return role;
    }
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
              <Link href="/dashboard/users" className="hover:text-primary-600">المستخدمون</Link>
            </li>
            <li>
              <span className="mx-1">/</span>
              <span className="text-gray-700">{user.fullName}</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 ml-3">
              {user.fullName}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}
            >
              {getRoleText(user.role)}
            </span>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(true)}
            >
              تعديل
            </Button>

            {/* إظهار إعادة تعيين كلمة المرور للمديرين فقط عندما يكون المشرف مسجل الدخول */}
            {currentUser?.role === 'admin' && user.role === 'manager' && (
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordModalOpen(true);
                  // إنشاء كلمة مرور عشوائية
                  const randomPassword = Math.random().toString(36).slice(-8);
                  setNewPassword(randomPassword);
                }}
              >
                إعادة تعيين كلمة المرور
              </Button>
            )}

            <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
              حذف
            </Button>
          </div>
        </div>
      </div>

      {/* تفاصيل المستخدم */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات المستخدم</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">الاسم الكامل</h3>
              <p className="mt-1 text-base text-gray-900">{user.fullName}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">اسم المستخدم</h3>
              <p className="mt-1 text-base text-gray-900">{user.username}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">البريد الإلكتروني</h3>
              <p className="mt-1 text-base text-gray-900">{user.email}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">الهاتف</h3>
              <p className="mt-1 text-base text-gray-900">{user.phone}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">الدور</h3>
              <p className="mt-1 text-base text-gray-900">{getRoleText(user.role)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">تاريخ الانضمام</h3>
              <p className="mt-1 text-base text-gray-900">{formatDate(user.createdAt)}</p>
            </div>

            {user.companyId && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">الشركة</h3>
                <p className="mt-1 text-base text-gray-900">
                  <Link href={`/dashboard/companies/${user.companyId}`} className="text-primary-600 hover:text-primary-700">
                    عرض الشركة
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* المستأجرين  (للمستأجرين فقط) */}
      {user.role === 'tenant' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">المستأجرين </h2>
            <Link href={`/dashboard/reservations/create?userId=${user.id}`}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                اضافة مستأجر
              </Button>
            </Link>
          </div>

          <Card>
            <Table
              data={reservations}
              columns={reservationColumns}
              keyExtractor={(reservation) => reservation.id}
              isLoading={isReservationsLoading}
              emptyMessage="لا توجد حجوزات لهذا المستخدم"
              onRowClick={(reservation) => router.push(`/dashboard/reservations/${reservation.id}`)}
            />
          </Card>
        </div>
      )}

      {/* نافذة تعديل المستخدم */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="تعديل المستخدم"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={isUpdating}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateUser}
              isLoading={isUpdating}
              disabled={isUpdating}
            >
              تحديث المستخدم
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="الاسم الكامل"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
            fullWidth
          />

          <Input
            label="البريد الإلكتروني"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            fullWidth
          />

          <Input
            label="الهاتف"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            fullWidth
          />
        </div>
      </Modal>

      {/* نافذة تأكيد حذف المستخدم */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="حذف المستخدم"
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
          هل أنت متأكد من أنك تريد حذف {user.fullName}؟ لا يمكن التراجع عن هذا الإجراء.
        </p>

        {user.role === 'tenant' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
            <p className="text-sm font-medium">تحذير</p>
            <p className="text-sm">حذف هذا المستأجر سيؤدي أيضًا إلى إزالة وصوله إلى جميع الوحدات وطلبات الخدمة المرتبطة به.</p>
          </div>
        )}

        {user.role === 'manager' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
            <p className="text-sm font-medium">تحذير</p>
            <p className="text-sm">حذف هذا المدير سيؤدي إلى إزالة وصوله إلى النظام. ضع في اعتبارك إعادة تعيين ممتلكاته أولاً.</p>
          </div>
        )}
      </Modal>

      {/* نافذة إعادة تعيين كلمة المرور */}
      <Modal
        isOpen={resetPasswordModalOpen}
        onClose={() => setResetPasswordModalOpen(false)}
        title="إعادة تعيين كلمة مرور المدير"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setResetPasswordModalOpen(false)}
              disabled={isResettingPassword}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              onClick={handleResetPassword}
              isLoading={isResettingPassword}
              disabled={isResettingPassword}
            >
              إعادة تعيين كلمة المرور
            </Button>
          </div>
        }
      >
        <p className="text-gray-600 mb-4">
          هل أنت متأكد من أنك تريد إعادة تعيين كلمة المرور لـ {user.fullName}؟
        </p>

        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">كلمة المرور الجديدة</label>
          <div className="mt-1 flex items-center">
            <input
              type="text"
              id="newPassword"
              className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Button
              type="button"
              variant="outline"
              className="ml-2"
              onClick={() => {
                // إنشاء كلمة مرور عشوائية
                const randomPassword = Math.random().toString(36).slice(-8);
                setNewPassword(randomPassword);
              }}
            >
              توليد
            </Button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            سيحتاج المدير إلى استخدام كلمة المرور هذه لتسجيل الدخول التالي.
          </p>
        </div>
      </Modal>
    </div>
  );
}