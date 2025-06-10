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

type UserRole = 'admin' | 'manager' | 'accountant' | 'maintenance' | 'owner' | 'tenant';

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

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // حالات النافذة المنبثقة لإنشاء المستخدمين
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createRole, setCreateRole] = useState<UserRole>('manager');
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Get available roles based on current user
  const getAvailableRoles = (): UserRole[] => {
    if (currentUser?.role === 'admin') {
      return ['admin'];
    } else if (currentUser?.role === 'manager') {
      return ['accountant', 'maintenance', 'owner'];
    }
    return [];
  };

  // Get role options for filter
  const getRoleFilterOptions = () => {
    const baseOptions = [{ value: 'all', label: 'جميع الأدوار' }];

    if (currentUser?.role === 'admin') {
      return [
        ...baseOptions,
        { value: 'admin', label: 'المشرف' },
        { value: 'manager', label: 'المدير' },
        // { value: 'tenant', label: 'المستأجر' },
      ];
    } else if (currentUser?.role === 'manager') {
      return [
        ...baseOptions,
        { value: 'accountant', label: 'المحاسب' },
        { value: 'maintenance', label: 'الصيانة' },
        { value: 'owner', label: 'المالك' },
        { value: 'tenant', label: 'المستأجر' },
      ];
    }

    return baseOptions;
  };

  // Get role statistics
  const getRoleStatistics = () => {
    if (currentUser?.role === 'admin') {
      return [
        {
          role: 'admin',
          label: 'المشرفون',
          count: users.filter(user => user.role === 'admin').length,
          color: 'red',
          icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )
        },
        {
          role: 'manager',
          label: 'المديرون',
          count: users.filter(user => user.role === 'manager').length,
          color: 'blue',
          icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )
        },
        // {
        //   role: 'tenant',
        //   label: 'المستأجرون',
        //   count: users.filter(user => user.role === 'tenant').length,
        //   color: 'green',
        //   icon: (
        //     <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        //     </svg>
        //   )
        // }
      ];
    } else if (currentUser?.role === 'manager') {
      return [
        {
          role: 'accountant',
          label: 'المحاسبون',
          count: users.filter(user => user.role === 'accountant').length,
          color: 'purple',
          icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )
        },
        {
          role: 'maintenance',
          label: 'فريق الصيانة',
          count: users.filter(user => user.role === 'maintenance').length,
          color: 'orange',
          icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        },
        {
          role: 'owner',
          label: 'الملاك',
          count: users.filter(user => user.role === 'owner').length,
          color: 'indigo',
          icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        }
      ];
    }

    return [];
  };

  // Translate role to Arabic
  const translateRole = (role: string): string => {
    switch (role) {
      case 'admin': return 'مشرف';
      case 'manager': return 'مدير';
      case 'accountant': return 'محاسب';
      case 'maintenance': return 'صيانة';
      case 'owner': return 'مالك';
      case 'tenant': return 'مستأجر';
      default: return role;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'accountant': return 'bg-purple-100 text-purple-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'owner': return 'bg-indigo-100 text-indigo-800';
      case 'tenant': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

      switch (createRole) {
        case 'admin':
          response = await authApi.registerAdmin(formData);
          break;
        case 'manager':
          response = await authApi.registerManager(formData);
          break;
        case 'accountant':
          response = await authApi.registerAccountant(formData);
          break;
        case 'maintenance':
          response = await authApi.registerMaintenance(formData);
          break;
        case 'owner':
          response = await authApi.registerOwner(formData);
          break;
        default:
          throw new Error('نوع المستخدم غير مدعوم');
      }

      if (response.success) {
        toast.success(`تم إنشاء ${translateRole(createRole)} بنجاح`);
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
        toast.error(response.message || `فشل في إنشاء ${translateRole(createRole)}`);
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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
          {translateRole(user.role)}
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

  const availableRoles = getAvailableRoles();
  const roleStatistics = getRoleStatistics();

  return (
    <div className="space-y-6">
      {/* الترويسة مع أزرار الإجراءات */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">المستخدمون</h1>

        {/* أزرار إضافة المستخدمين حسب الصلاحيات */}
        {availableRoles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((role) => (
              <Button
                key={role}
                variant="primary"
                onClick={() => {
                  setCreateRole(role);
                  setCreateModalOpen(true);
                }}
              >
                إضافة {translateRole(role)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* بطاقات إحصائيات المستخدمين */}
      {roleStatistics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {roleStatistics.map((stat) => (
            <Card key={stat.role} className={`bg-${stat.color}-50 border-${stat.color}-200`}>
              <div className="p-4">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 bg-${stat.color}-100 rounded-md p-3`}>
                    <div className={`text-${stat.color}-600`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="mr-4">
                    <h3 className={`font-medium text-${stat.color}-800`}>{stat.label}</h3>
                    <p className={`text-2xl font-bold text-${stat.color}-900`}>
                      {stat.count}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

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
              options={getRoleFilterOptions()}
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
        title={`إنشاء ${translateRole(createRole)} جديد`}
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
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">كلمة المرور</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.96 6.96M14.12 14.12l2.878 2.878M6.96 6.96L3.08 3.08M14.12 14.12L18 18M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">الاسم الكامل</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
      </Modal>

    </div>
  );
}