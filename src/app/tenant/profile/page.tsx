'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';

// Icons for show/hide password
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

// Enhanced Input component with password toggle
interface PasswordInputProps {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  fullWidth?: boolean;
  helpText?: string;
  placeholder?: string;
}

const PasswordInput = ({
  label,
  id,
  name,
  value,
  onChange,
  required = false,
  fullWidth = false,
  helpText,
  placeholder
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
          style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
        />

        {/* Password toggle button */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>

        {/* Lock icon on the right */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>
      {helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

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

    if (currentPassword === newPassword) {
      toast.error('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية');
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

  // التحقق من قوة كلمة المرور
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { level: 0, text: '', color: '' };

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ];

    strength = checks.filter(Boolean).length;

    if (strength <= 2) return { level: 1, text: 'ضعيفة', color: 'text-red-500' };
    if (strength === 3) return { level: 2, text: 'متوسطة', color: 'text-yellow-500' };
    if (strength === 4) return { level: 3, text: 'قوية', color: 'text-green-500' };
    return { level: 4, text: 'قوية جداً', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-600">جاري تحميل الملف الشخصي...</p>
        </div>
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
      <div className="flex items-center space-x-3 space-x-reverse">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ملفي الشخصي</h1>
          <p className="text-gray-600">إدارة معلوماتك الشخصية وكلمة المرور</p>
        </div>
      </div>

      {/* معلومات الملف الشخصي */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 ml-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            معلومات الحساب
          </h2>

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
              <p className="mt-1 text-base text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {translateRole(user.role)}
                </span>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">تاريخ الانضمام</h3>
              <p className="mt-1 text-base text-gray-900">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* تغيير كلمة المرور */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 ml-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            تغيير كلمة المرور
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <PasswordInput
              label="كلمة المرور الحالية"
              id="currentPassword"
              name="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              fullWidth
              placeholder="أدخل كلمة المرور الحالية"
            />

            <div className="space-y-2">
              <PasswordInput
                label="كلمة المرور الجديدة"
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                fullWidth
                placeholder="أدخل كلمة المرور الجديدة"
                helpText="يجب أن تتكون كلمة المرور من 6 أحرف على الأقل"
              />

              {/* Password strength indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">قوة كلمة المرور:</span>
                    <span className={passwordStrength.color}>{passwordStrength.text}</span>
                  </div>
                  <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.level === 1 ? 'bg-red-500 w-1/4' :
                        passwordStrength.level === 2 ? 'bg-yellow-500 w-2/4' :
                          passwordStrength.level === 3 ? 'bg-green-500 w-3/4' :
                            passwordStrength.level === 4 ? 'bg-green-600 w-full' : 'w-0'
                        }`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <PasswordInput
                label="تأكيد كلمة المرور الجديدة"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
                placeholder="أعد إدخال كلمة المرور الجديدة"
              />

              {/* Password match indicator */}
              {confirmPassword && (
                <div className="mt-1">
                  {newPassword === confirmPassword ? (
                    <p className="text-xs text-green-600 flex items-center">
                      <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      كلمات المرور متطابقة
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 flex items-center">
                      <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      كلمات المرور غير متطابقة
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* معلومات الحساب */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 ml-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            هل تحتاج إلى تحديث معلوماتك؟
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 mb-3">
              إذا كنت بحاجة إلى تحديث معلوماتك الشخصية مثل اسمك أو بريدك الإلكتروني أو رقم هاتفك، يرجى الاتصال بمدير العقار الخاص بك.
            </p>
            <div className="flex items-center text-sm text-blue-600">
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              تواصل مع الإدارة للحصول على المساعدة
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}