'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Controller } from 'react-hook-form';
import { Company } from '@/lib/types';
import { companiesApi } from '@/lib/api';
import { companySchema, CompanyFormData } from '@/lib/validations/schemas';
import { useAsyncForm, useFileForm } from '@/hooks/useYupForm';
import {
  FormInput,
  FormTextArea,
  FormSelect,
  FormFileInput
} from '@/components/ui/FormInputs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface CompanyFormYupProps {
  isEdit?: boolean;
  initialData?: Company;
  onSuccess?: (company: Company) => void;
}

interface ManagerCredentials {
  companyId: number;
  email: string;
  fullName: string;
  id: number;
  password: string;
  role: string;
  username: string;
}

const COMPANY_TYPE_OPTIONS = [
  { value: 'owner', label: 'مالك' },
  { value: 'agency', label: 'وكالة' },
];

const initialCompanyData: Partial<CompanyFormData> = {
  name: '',
  companyType: 'agency',
  email: '',
  phone: '',
  whatsappNumber: '',
  secondaryPhone: '',
  registrationNumber: '',
  delegateName: '',
  address: '',
  managerFullName: '',
  managerEmail: '',
  managerPhone: '',
};

export default function CompanyForm({
  isEdit = false,
  initialData,
  onSuccess,
}: CompanyFormYupProps) {
  const router = useRouter();
  const [managerCredentials, setManagerCredentials] = useState<ManagerCredentials | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  // Initialize form with validation schema
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    submitAsync,
  } = useFileForm<CompanyFormData>(
    companySchema,
    isEdit && initialData ? {
      name: initialData.name,
      companyType: initialData.companyType,
      email: initialData.email,
      phone: initialData.phone,
      whatsappNumber: initialData.whatsappNumber || '',
      secondaryPhone: initialData.secondaryPhone || '',
      registrationNumber: initialData.registrationNumber || '',
      delegateName: initialData.delegateName || '',
      address: initialData.address,
      managerFullName: '',
      managerEmail: '',
      managerPhone: '',
    } : initialCompanyData,
    { isCreating: !isEdit } // Context for conditional validation
  );

  // Watch file fields for preview
  const watchedLogoImage = watch('logoImage');
  const watchedIdentityImageFront = watch('identityImageFront');

  // Watch companyType to conditionally show/hide registration number field
  const watchedCompanyType = watch('companyType');

  // Reset form when editing data changes
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        name: initialData.name,
        companyType: initialData.companyType,
        email: initialData.email,
        phone: initialData.phone,
        whatsappNumber: initialData.whatsappNumber || '',
        secondaryPhone: initialData.secondaryPhone || '',
        registrationNumber: initialData.registrationNumber || '',
        delegateName: initialData.delegateName || '',
        address: initialData.address,
        managerFullName: '',
        managerEmail: '',
        managerPhone: '',
      });
    }
  }, [isEdit, initialData, reset]);

  // Form submission handler
  const onSubmit = async (data: CompanyFormData) => {
    try {
      let response;

      if (isEdit && initialData) {
        response = await companiesApi.update(initialData.id, data);
      } else {
        response = await companiesApi.create(data);
      }

      if (response.success) {
        const successMessage = isEdit
          ? 'تم تحديث الشركة بنجاح'
          : 'تم إنشاء الشركة بنجاح';
        toast.success(successMessage);

        // Handle manager credentials for new companies
        if (!isEdit && response.data.manager) {
          setManagerCredentials(response.data.manager);
          setShowCredentialsModal(true);
        } else {
          if (onSuccess) {
            onSuccess(response.data.company || response.data);
          } else {
            router.push(`/dashboard/companies/${(response.data.company || response.data).id}`);
          }
        }
      } else {
        toast.error(response.message || 'حدث خطأ ما');
      }
    } catch (error: any) {
      console.error('Company form submission error:', error);
      toast.error(error.message || 'حدث خطأ في الإرسال');
      throw error;
    }
  };

  // Handle file changes
  const handleFileChange = (fieldName: keyof CompanyFormData) => (files: FileList | null) => {
    const file = files?.[0] || null;
    setValue(fieldName, file as any, { shouldValidate: true, shouldDirty: true });
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowCredentialsModal(false);
    if (onSuccess && managerCredentials) {
      onSuccess({ id: managerCredentials.companyId } as Company);
    } else if (managerCredentials) {
      router.push(`/dashboard/companies/${managerCredentials.companyId}`);
    }
  };

  // Copy credentials to clipboard
  const copyCredentials = () => {
    if (!managerCredentials) return;

    const credentials = `
اسم المستخدم: ${managerCredentials.username}
كلمة المرور: ${managerCredentials.password}
الاسم الكامل: ${managerCredentials.fullName}
البريد الإلكتروني: ${managerCredentials.email}
الدور: ${managerCredentials.role === 'manager' ? 'مدير' : managerCredentials.role}
    `;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(credentials.trim())
        .then(() => toast.success('تم نسخ بيانات اعتماد المدير إلى الحافظة!'))
        .catch(() => toast.error('فشل نسخ بيانات الاعتماد'));
    } else {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = credentials.trim();
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        toast.success('تم نسخ بيانات اعتماد المدير إلى الحافظة!');
      } catch (err) {
        toast.error('فشل نسخ بيانات الاعتماد');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Company Information Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">معلومات الشركة الأساسية</h3>
              <p className="text-sm text-gray-500 mt-1">يرجى إدخال المعلومات الأساسية للشركة</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="اسم الشركة"
                register={register}
                name="name"
                error={errors.name}
                required
                helpText="أدخل الاسم الكامل للشركة"
              />

              <FormSelect
                label="نوع الشركة"
                register={register}
                name="companyType"
                error={errors.companyType}
                options={COMPANY_TYPE_OPTIONS}
                required
                placeholder="اختر نوع الشركة"
              />

              <FormInput
                label="البريد الإلكتروني"
                register={register}
                name="email"
                type="email"
                error={errors.email}
                required
                helpText="البريد الإلكتروني الرسمي للشركة"
              />

              <FormInput
                label="رقم الهاتف"
                register={register}
                name="phone"
                type="tel"
                error={errors.phone}
                required
                helpText="رقم الهاتف الأساسي للشركة"
              />

              <FormInput
                label="رقم الواتساب"
                register={register}
                name="whatsappNumber"
                type="tel"
                error={errors.whatsappNumber}
                helpText="رقم الواتساب للتواصل (اختياري)"
              />

              <FormInput
                label="رقم الهاتف الثانوي"
                register={register}
                name="secondaryPhone"
                type="tel"
                error={errors.secondaryPhone}
                helpText="رقم هاتف إضافي (اختياري)"
              />

              {/* Conditionally render registration number field - only show when companyType is NOT 'owner' */}
              {watchedCompanyType !== 'owner' && (
                <FormInput
                  label="رقم السجل التجاري"
                  register={register}
                  name="registrationNumber"
                  error={errors.registrationNumber}
                  helpText="رقم السجل التجاري للشركة (اختياري)"
                />
              )}

              <FormInput
                label="اسم المفوض"
                register={register}
                name="delegateName"
                error={errors.delegateName}
                helpText="اسم الشخص المفوض عن الشركة (اختياري)"
              />
            </div>

            <FormInput
              label="عنوان الشركة"
              register={register}
              name="address"
              error={errors.address}
              required
              helpText="العنوان الكامل للشركة"
            />
          </div>

          {/* Documents and Images Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">الوثائق والصور</h3>
              <p className="text-sm text-gray-500 mt-1">يرجى رفع الوثائق والصور المطلوبة</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="identityImageFront"
                control={control}
                render={({ field, fieldState }) => (
                  <FormFileInput
                    label="صورة الهوية "
                    name="identityImageFront"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileChange('identityImageFront')}
                    error={fieldState.error}
                    helpText="ملف PDF يحوي الوجهين الأمامي و الخلفي (JPEG, PNG)"
                    required={!isEdit}
                    currentFile={isEdit ? initialData?.identityImageFrontUrl : undefined}
                    selectedFile={watchedIdentityImageFront}
                  />
                )}
              />


              <Controller
                name="logoImage"
                control={control}
                render={({ field, fieldState }) => (
                  <FormFileInput
                    label="شعار الشركة"
                    name="logoImage"
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    onChange={handleFileChange('logoImage')}
                    error={fieldState.error}
                    helpText="شعار الشركة (اختياري) - JPEG, PNG, GIF, WebP"
                    currentFile={isEdit ? initialData?.logoImageUrl : undefined}
                    selectedFile={watchedLogoImage}
                  />
                )}
              />
            </div>
          </div>

          {/* Manager Information Section - Only for new companies */}
          {!isEdit && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900">معلومات المدير</h3>
                <p className="text-sm text-gray-500 mt-1">سيتم إنشاء حساب مدير جديد للشركة</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="الاسم الكامل للمدير"
                  register={register}
                  name="managerFullName"
                  error={errors.managerFullName}
                  required
                  helpText="الاسم الكامل لمدير الشركة"
                />

                <FormInput
                  label="البريد الإلكتروني للمدير"
                  register={register}
                  name="managerEmail"
                  type="email"
                  error={errors.managerEmail}
                  required
                  helpText="البريد الإلكتروني لحساب المدير"
                />

                <FormInput
                  label="رقم هاتف المدير"
                  register={register}
                  name="managerPhone"
                  type="tel"
                  error={errors.managerPhone}
                  required
                  helpText="رقم هاتف المدير"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isEdit ? 'تحديث الشركة' : 'إنشاء الشركة'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Manager Credentials Modal */}
      <Modal
        isOpen={showCredentialsModal}
        onClose={handleModalClose}
        title="تم إنشاء حساب مدير جديد"
        size="md"
      >
        <div className="p-6">
          {managerCredentials && (
            <>
              <div className="mb-4">
                <p className="text-gray-700 mb-4">
                  تم إنشاء حساب مدير جديد لـ <span className="font-semibold">{watch('name')}</span>.
                  يرجى حفظ بيانات الاعتماد هذه في مكان آمن:
                </p>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md font-mono">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">اسم المستخدم:</span>
                    <span className="text-base text-blue-800">{managerCredentials.username}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">كلمة المرور:</span>
                    <span className="text-base text-blue-800">{managerCredentials.password}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">الاسم الكامل:</span>
                    <span className="text-base text-blue-800">{managerCredentials.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">البريد الإلكتروني:</span>
                    <span className="text-base text-blue-800">{managerCredentials.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">الدور:</span>
                    <span className="text-base text-blue-800 capitalize">
                      {managerCredentials.role === 'manager' ? 'مدير' : managerCredentials.role}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="mr-3">
                      <h3 className="text-sm font-medium text-yellow-800">تنبيه مهم</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>سيتم عرض بيانات الاعتماد هذه مرة واحدة فقط</li>
                          <li>تأكد من حفظها في مكان آمن ومشاركتها مع المدير</li>
                          <li>يجب على المدير تغيير كلمة المرور بعد أول تسجيل دخول</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={copyCredentials}
                >
                  نسخ بيانات الاعتماد
                </Button>
                <Button
                  onClick={handleModalClose}
                >
                  متابعة
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}