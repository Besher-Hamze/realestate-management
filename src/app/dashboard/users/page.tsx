'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { User } from '@/lib/types';
import { usersApi, authApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Table, { TableColumn } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // حالات النافذة المنبثقة لإنشاء المستخدمين
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createRole, setCreateRole] = useState<'admin' | 'manager'>('manager');
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // خيارات تصفية الأدوار
  const roleOptions = [
    { value: 'all', label: 'جميع الأدوار' },
    { value: 'admin', label: 'المشرف' },
    { value: 'manager', label: 'المدير' },
    { value: 'tenant', label: 'المستأجر' },
  ];

  // بيانات النموذج لإنشاء مستخدمين جدد
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
  });

  // جلب المستخدمين عند تحميل المكون
  useEffect(() => {
    fetchUsers();
  }, []);

  // تطبيق التصفية عند تغيير المستخدمين أو تصفية الدور
  useEffect(() => {
    applyFilters();
  }, [users, roleFilter]);

  // جلب بيانات المستخدمين
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getAll();

      if (response.success) {
        setUsers(response.data);
      } else {
        toast.error(response.message || 'فشل في جلب المستخدمين');
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      toast.error('حدث خطأ أثناء جلب المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  // تطبيق التصفية على المستخدمين
  const applyFilters = () => {
    let filtered = [...users];

    // تطبيق تصفية الدور
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  // التعامل مع تغيير تصفية الدور
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  // التعامل مع حذف المستخدم
  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setIsDeleting(true);
      const response = await usersApi.delete(selectedUser.id);

      if (response.success) {
        toast.success('تم حذف المستخدم بنجاح');
        setDeleteModalOpen(false);
        fetchUsers(); // إعادة جلب المستخدمين بعد الحذف
      } else {
        toast.error(response.message || 'فشل في حذف المستخدم');
      }
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      toast.error('حدث خطأ أثناء حذف المستخدم');
    } finally {
      setIsDeleting(false);
    }
  };

  // فتح نافذة تأكيد الحذف
  const openDeleteModal = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  // فتح نافذة إعادة تعيين كلمة المرور
  const openResetPasswordModal = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUser(user);
    setResetPasswordModalOpen(true);
    // إنشاء كلمة مرور عشوائية
    const randomPassword = Math.random().toString(36).slice(-8);
    setNewPassword(randomPassword);
  };

  // إعادة تعيين كلمة مرور المدير
  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      setIsResettingPassword(true);

      // يمكن للمشرفين فقط إعادة تعيين كلمات مرور المديرين
      if (currentUser?.role === 'admin' && selectedUser.role === 'manager') {
        const response = await authApi.resetManagerPassword(selectedUser.id, newPassword);

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

  const handleCreateUser = async () => {
    try {
      let response;

      if (createRole === 'admin') {
        response = await authApi.registerAdmin(formData);
      } else {
        response = await authApi.registerManager(formData);
      }

      if (response.success) {
        toast.success(`تم إنشاء ${createRole === 'admin' ? 'المشرف' : 'المدير'} بنجاح`);
        setCreateModalOpen(false);
        fetchUsers(); // إعادة جلب المستخدمين بعد الإنشاء

        // إعادة تعيين بيانات النموذج
        setFormData({
          username: '',
          password: '',
          fullName: '',
          email: '',
          phone: '',
        });
      } else {
        toast.error(response.message || `فشل في إنشاء ${createRole === 'admin' ? 'المشرف' : 'المدير'}`);
      }
    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
      toast.error('حدث خطأ أثناء إنشاء المستخدم');
    }
  };

  // التعامل مع تغيير إدخال النموذج
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // تحديد الأعمدة للجدول
  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      header: 'الاسم',
      cell: (user) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{user.fullName}</span>
          <span className="text-xs text-gray-500">{user.username}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'معلومات الاتصال',
      cell: (user) => (
        <div className="flex flex-col">
          <span className="text-gray-700">{user.email}</span>
          <span className="text-xs text-gray-500">{user.phone}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'الدور',
      cell: (user) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}
        >
          {user.role === 'admin' ? 'مشرف' : user.role === 'manager' ? 'مدير' : 'مستأجر'}
        </span>
      ),
    },
    {
      key: 'joinedDate',
      header: 'تاريخ الانضمام',
      cell: (user) => <span className="text-gray-700">{formatDate(user.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      cell: (user) => (
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/users/${user.id}`} onClick={(e) => e.stopPropagation()}>
            <Button size="xs" variant="outline">عرض</Button>
          </Link>

          {/* زر إعادة تعيين كلمة المرور (فقط للمديرين عندما يكون المشرف مسجل الدخول) */}
          {currentUser?.role === 'admin' && user.role === 'manager' && (
            <Button
              size="xs"
              variant="outline"
              onClick={(e) => openResetPasswordModal(user, e)}
            >
              إعادة تعيين كلمة المرور
            </Button>
          )}

          {/* زر الحذف */}
          <Button
            size="xs"
            variant="danger"
            onClick={(e) => openDeleteModal(user, e)}
          >
            حذف
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* الترويسة مع أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">المستخدمون</h1>

        {/* يمكن للمشرفين فقط إنشاء مستخدمين جدد مشرفين/مديرين */}
        {currentUser?.role === 'admin' && (
          <div className=" flex  gap-4">
            <Button
              variant="primary"
              onClick={() => {
                setCreateRole('admin');
                setCreateModalOpen(true);
              }}
            >
              إضافة مشرف
            </Button>
          </div>
        )}
      </div>

      {/* بطاقات إحصائيات المستخدمين */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-red-800">المشرفون</h3>
                <p className="text-2xl font-bold text-red-900">
                  {users.filter(user => user.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-blue-800">المديرون</h3>
                <p className="text-2xl font-bold text-blue-900">
                  {users.filter(user => user.role === 'manager').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="mr-4">
                <h3 className="font-medium text-green-800">المستأجرون</h3>
                <p className="text-2xl font-bold text-green-900">
                  {users.filter(user => user.role === 'tenant').length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* المرشحات */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-64">
            <Select
              label="الدور"
              id="roleFilter"
              name="roleFilter"
              value={roleFilter}
              onChange={handleRoleFilterChange}
              options={roleOptions}
              fullWidth
            />
          </div>
        </div>
      </div>

      {/* قائمة المستخدمين */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <Table
          data={filteredUsers}
          columns={columns}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
          emptyMessage="لا يوجد مستخدمين"
          onRowClick={(user) => router.push(`/dashboard/users/${user.id}`)}
        />
      </div>

      {/* نافذة إنشاء مستخدم */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={`إنشاء ${createRole === 'admin' ? 'مشرف' : 'مدير'} جديد`}
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateUser}
            >
              إنشاء مستخدم
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">اسم المستخدم</label>
            <input
              type="text"
              id="username"
              name="username"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">كلمة المرور</label>
            <input
              type="password"
              id="password"
              name="password"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">الاسم الكامل</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">الهاتف</label>
            <input
              type="text"
              id="phone"
              name="phone"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>
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
          هل أنت متأكد من أنك تريد حذف {selectedUser?.fullName}؟ لا يمكن التراجع عن هذا الإجراء.
        </p>

        {selectedUser?.role === 'tenant' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-700">
            <p className="text-sm font-medium">تحذير</p>
            <p className="text-sm">حذف هذا المستأجر سيؤدي أيضًا إلى إزالة وصوله إلى جميع الوحدات وطلبات الخدمة المرتبطة به.</p>
          </div>
        )}

        {selectedUser?.role === 'manager' && (
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
          هل أنت متأكد من أنك تريد إعادة تعيين كلمة المرور لـ {selectedUser?.fullName}؟
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