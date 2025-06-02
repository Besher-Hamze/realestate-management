'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Company, CompanyFormData } from '@/lib/types';
import { companiesApi } from '@/lib/api';
import { 
  validateCompanyForm,
  companyValidation,
  FILE_TYPES,
  FILE_SIZE_LIMITS 
} from '@/lib/validations';
import { 
  FormField, 
  FormSection, 
  ValidationSummary, 
  FormActions,
  useFormValidation 
} from '@/components/ui/FormValidation';
import { 
  Input, 
  Select, 
  FileInput,
  TextArea 
} from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface CompanyFormProps {
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

const initialCompanyData: CompanyFormData = {
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
}: CompanyFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CompanyFormData>(initialCompanyData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managerCredentials, setManagerCredentials] = useState<ManagerCredentials | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  
  // File states
  const [logoImage, setLogoImage] = useState<FileList | null>(null);
  const [identityImageFront, setIdentityImageFront] = useState<FileList | null>(null);
  const [identityImageBack, setIdentityImageBack] = useState<FileList | null>(null);

  // Validation hook
  const { errors, validate, clearErrors, hasErrors } = useFormValidation(validateCompanyForm);

  // Initialize form data for edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
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
  }, [isEdit, initialData]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file uploads
  const handleLogoChange = (files: FileList | null) => {
    setLogoImage(files);
  };

  const handleIdentityFrontChange = (files: FileList | null) => {
    setIdentityImageFront(files);
  };

  const handleIdentityBackChange = (files: FileList | null) => {
    setIdentityImageBack(files);
  };

  // Form submission
  const handleSubmit = async () => {
    // Clear previous errors
    clearErrors();

    // Prepare form data for validation including files
    const validationData = {
      ...formData,
      logoImage: logoImage?.[0],
      identityImageFront: identityImageFront?.[0],
      identityImageBack: identityImageBack?.[0],
    };

    // Validate form
    if (!validate(validationData)) {
      toast.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: CompanyFormData = {
        ...formData,
        logoImage: logoImage?.[0],
        identityImageFront: identityImageFront?.[0],
        identityImageBack: identityImageBack?.[0],
      };

      let response;
      if (isEdit && initialData) {
        response = await companiesApi.update(initialData.id, submitData);
      } else {
        response = await companiesApi.create(submitData);
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
            onSuccess(response.data.company);
          } else {
            router.push(`/dashboard/companies/${response.data.company.id}`);
          }
        }
      } else {
        toast.error(response.message || 'حدث خطأ ما');
      }
    } catch (error: any) {
      console.error('Company form submission error:', error);
      toast.error(error.message || 'حدث خطأ في الإرسال');
    } finally {
      setIsSubmitting(false);
    }
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

    navigator.clipboard.writeText(credentials.trim())
      .then(() => toast.success('تم نسخ بيانات اعتماد المدير إلى الحافظة!'))
      .catch(() => toast.error('فشل نسخ بيانات الاعتماد'));
  };

  return (
    <>
      <Card>
        <div className="space-y-8">
          {/* Validation Summary */}
          {hasErrors && (
            <ValidationSummary errors={errors} />
          )}

          {/* Company Information Section */}
          <FormSection 
            title="معلومات الشركة الأساسية"
            description="يرجى إدخال المعلومات الأساسية للشركة"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="اسم الشركة"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
                helpText="أدخل الاسم الكامل للشركة"
              />

              <Select
                label="نوع الشركة"
                name="companyType"
                value={formData.companyType}
                onChange={handleChange}
                options={COMPANY_TYPE_OPTIONS}
                error={errors.companyType}
                required
                placeholder="اختر نوع الشركة"
              />

              <Input
                label="البريد الإلكتروني"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                helpText="البريد الإلكتروني الرسمي للشركة"
              />

              <Input
                label="رقم الهاتف"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
                helpText="رقم الهاتف الأساسي للشركة"
              />

              <Input
                label="رقم الواتساب"
                name="whatsappNumber"
                type="tel"
                value={formData.whatsappNumber}
                onChange={handleChange}
                error={errors.whatsappNumber}
                helpText="رقم الواتساب للتواصل (اختياري)"
              />

              <Input
                label="رقم الهاتف الثانوي"
                name="secondaryPhone"
                type="tel"
                value={formData.secondaryPhone}
                onChange={handleChange}
                error={errors.secondaryPhone}
                helpText="رقم هاتف إضافي (اختياري)"
              />

              <Input
                label="رقم السجل التجاري"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                error={errors.registrationNumber}
                helpText="رقم السجل التجاري للشركة (اختياري)"
              />

              <Input
                label="اسم المفوض"
                name="delegateName"
                value={formData.delegateName}
                onChange={handleChange}
                error={errors.delegateName}
                helpText="اسم الشخص المفوض عن الشركة (اختياري)"
              />
            </div>

            <Input
              label="عنوان الشركة"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              required
              helpText="العنوان الكامل للشركة"
            />
          </FormSection>

          {/* Documents and Images Section */}
          <FormSection 
            title="الوثائق والصور"
            description="يرجى رفع الوثائق والصور المطلوبة"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileInput
                label="صورة الهوية (الوجه الأمامي)"
                accept={FILE_TYPES.IMAGES.join(',')}
                onChange={handleIdentityFrontChange}
                error={errors.identityImageFront}
                helpText="صورة واضحة للوجه الأمامي للهوية (JPEG, PNG)"
                currentFile={isEdit ? initialData?.identityImageFrontUrl : undefined}
              />

              <FileInput
                label="صورة الهوية (الوجه الخلفي)"
                accept={FILE_TYPES.IMAGES.join(',')}
                onChange={handleIdentityBackChange}
                error={errors.identityImageBack}
                helpText="صورة واضحة للوجه الخلفي للهوية (JPEG, PNG)"
                currentFile={isEdit ? initialData?.identityImageBackUrl : undefined}
              />

              <FileInput
                label="شعار الشركة"
                accept={FILE_TYPES.IMAGES.join(',')}
                onChange={handleLogoChange}
                error={errors.logoImage}
                helpText="شعار الشركة (اختياري) - JPEG, PNG, GIF"
                currentFile={isEdit ? initialData?.logoImageUrl : undefined}
              />
            </div>
          </FormSection>

          {/* Manager Information Section - Only for new companies */}
          {!isEdit && (
            <FormSection 
              title="معلومات المدير"
              description="سيتم إنشاء حساب مدير جديد للشركة"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="الاسم الكامل للمدير"
                  name="managerFullName"
                  value={formData.managerFullName || ''}
                  onChange={handleChange}
                  error={errors.managerFullName}
                  required
                  helpText="الاسم الكامل لمدير الشركة"
                />

                <Input
                  label="البريد الإلكتروني للمدير"
                  name="managerEmail"
                  type="email"
                  value={formData.managerEmail || ''}
                  onChange={handleChange}
                  error={errors.managerEmail}
                  required
                  helpText="البريد الإلكتروني لحساب المدير"
                />

                <Input
                  label="رقم هاتف المدير"
                  name="managerPhone"
                  type="tel"
                  value={formData.managerPhone || ''}
                  onChange={handleChange}
                  error={errors.managerPhone}
                  required
                  helpText="رقم هاتف المدير"
                />
              </div>
            </FormSection>
          )}

          {/* Form Actions */}
          <FormActions
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            submitText={isEdit ? 'تحديث الشركة' : 'إنشاء الشركة'}
            cancelText="إلغاء"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
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
                  تم إنشاء حساب مدير جديد لـ <span className="font-semibold">{formData.name}</span>.
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
