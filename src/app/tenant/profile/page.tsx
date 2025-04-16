'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function TenantProfilePage() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // التعامل مع تغيير كلمة المرور
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من كلمات المرور
    if (newPassword !== confirmPassword) {
      toast.error('كلمات المرور الجديدة غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('يجب أن تتكون كلمة المرور الجديدة من 6 أحرف على الأقل');
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

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">جاري تحميل الملف الشخصي...</p>
      </div>
    );
  }

  // ترجمة الدور إلى العربية
  const translateRole = (role: string) => {
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
      <h1 className="text-2xl font-bold text-gray-900">ملفي الشخصي</h1>

      {/* معلومات الملف الشخصي */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الحساب</h2>

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
              <p className="mt-1 text-base text-gray-900">{translateRole(user.role)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">تاريخ الانضمام</h3>
              <p className="mt-1 text-base text-gray-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </Card>

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
              helpText="يجب أن تتكون كلمة المرور من 6 أحرف على الأقل"
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

      {/* معلومات الحساب */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">هل تحتاج إلى تحديث معلوماتك؟</h2>
          <p className="text-gray-600 mb-4">
            إذا كنت بحاجة إلى تحديث معلوماتك الشخصية مثل اسمك أو بريدك الإلكتروني أو رقم هاتفك، يرجى الاتصال بمدير العقار الخاص بك.
          </p>
        </div>
      </Card>
    </div>
  );
}