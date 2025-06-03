'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, usersApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { User, Company } from '@/lib/types';
import { companiesApi } from '@/lib/api';

export default function ManagerProfilePage() {
  const { user, checkAuth } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<Partial<User>>({});
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  // جلب بيانات الشركة إذا كان مديرًا
  useEffect(() => {
    if (user?.companyId) {
      const fetchCompany = async () => {
        try {
          setIsLoadingCompany(true);
          const response = await companiesApi.getById(user.companyId as number);
          if (response.success) {
            setCompany(response.data);
          }
        } catch (error) {
          console.error('خطأ في جلب بيانات الشركة:', error);
        } finally {
          setIsLoadingCompany(false);
        }
      };

      fetchCompany();
    }
  }, [user]);

  // تهيئة بيانات الملف الشخصي من المستخدم
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user]);

  // التعامل مع تغيير كلمة المرور
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من كلمات المرور
    if (newPassword !== confirmPassword) {
      toast.error('كلمات المرور الجديدة غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('يجب أن تكون كلمة المرور الجديدة على الأقل 6 أحرف');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authApi.changePassword(currentPassword, newPassword);

      if (response.success) {
        toast.success('تم تغيير كلمة المرور بنجاح');
        // مسح النموذج
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(response.message || 'فشل في تغيير كلمة المرور');
      }
    } catch (error) {
      console.error('خطأ في تغيير كلمة المرور:', error);
      toast.error('حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  // التعامل مع تحديث الملف الشخصي
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setIsSubmitting(true);
      const response = await usersApi.update(user.id, profileData);

      if (response.success) {
        toast.success('تم تحديث الملف الشخصي بنجاح');
        setIsEditing(false);
        // تحديث بيانات المستخدم في سياق المصادقة
        checkAuth();
      } else {
        toast.error(response.message || 'فشل في تحديث الملف الشخصي');
      }
    } catch (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
      toast.error('حدث خطأ أثناء تحديث الملف الشخصي');
    } finally {
      setIsSubmitting(false);
    }
  };

  // التعامل مع تغيير المدخلات لبيانات الملف الشخصي
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!user) {
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
          <p className="text-gray-600">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">ملفي الشخصي</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            تعديل الملف الشخصي
          </Button>
        )}
      </div>

      {/* معلومات الملف الشخصي */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الحساب</h2>

          {isEditing ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <Input
                label="الاسم الكامل"
                id="fullName"
                name="fullName"
                value={profileData.fullName || ''}
                onChange={handleInputChange}
                required
                fullWidth
              />

              <Input
                label="البريد الإلكتروني"
                id="email"
                name="email"
                type="email"
                value={profileData.email || ''}
                onChange={handleInputChange}
                required
                fullWidth
              />

              <Input
                label="الهاتف"
                id="phone"
                name="phone"
                value={profileData.phone || ''}
                onChange={handleInputChange}
                required
                fullWidth
              />

              <div className="flex space-x-3 pt-2">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  حفظ التغييرات
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setProfileData({
                      fullName: user.fullName,
                      email: user.email,
                      phone: user.phone,
                    });
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          ) : (
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
                <p className="mt-1 text-base text-gray-900 capitalize">
                  {user.role === 'manager' ? 'مدير' : user.role === 'admin' ? 'مسؤول' : user.role}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">تاريخ الانضمام</h3>
                <p className="mt-1 text-base text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* معلومات الشركة (للمديرين) */}
      {user.role === 'manager' && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الشركة</h2>

            {isLoadingCompany ? (
              <div className="flex justify-center py-4">
                <svg
                  className="animate-spin h-6 w-6 text-primary-500"
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
              </div>
            ) : company ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">اسم الشركة</h3>
                  <p className="mt-1 text-base text-gray-900">{company.name}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">البريد الإلكتروني للشركة</h3>
                  <p className="mt-1 text-base text-gray-900">{company.email}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">هاتف الشركة</h3>
                  <p className="mt-1 text-base text-gray-900">{company.phone}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">عنوان الشركة</h3>
                  <p className="mt-1 text-base text-gray-900">{company.address}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">لا توجد معلومات متاحة عن الشركة.</p>
            )}
          </div>
        </Card>
      )}

      {/* تغيير كلمة المرور */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">تغيير كلمة المرور</h2>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="كلمة المرور الحالية"
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              fullWidth
            />

            <Input
              label="كلمة المرور الجديدة"
              id="newPassword"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              fullWidth
              helpText="يجب أن تكون كلمة المرور على الأقل 6 أحرف"
            />

            <Input
              label="تأكيد كلمة المرور الجديدة"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
            />

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                تغيير كلمة المرور
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* معلومات الوصول */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الوصول</h2>
          <p className="text-gray-600 mb-3">
            بصفتك مديرًا، لديك إمكانية الوصول إلى:
          </p>
          <ul className="list-disc pr-5 text-gray-600 space-y-2">
            <li>إدارة المباني والوحدات لشركتك</li>
            <li>التعامل مع طلبات المستأجرين والمستأجرين </li>
            <li>معالجة المدفوعات وإدارة السجلات المالية</li>
            <li>إدارة طلبات الخدمة والصيانة</li>
            <li>إنشاء تقارير لمحفظة العقارات الخاصة بك</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
            إذا كنت بحاجة إلى أي تغييرات في صلاحيات حسابك أو لديك أسئلة حول دورك، يرجى الاتصال بمسؤول النظام.
          </div>
        </div>
      </Card>
    </div>
  );
}