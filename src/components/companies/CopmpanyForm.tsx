import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import { Company, CompanyFormData } from '@/lib/types';
import { companiesApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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

const initialCompanyData: CompanyFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
};

export default function CompanyForm({
  isEdit = false,
  initialData,
  onSuccess,
}: CompanyFormProps) {
  const router = useRouter();
  const [logoImage, setLogoImage] = useState<File | undefined>(undefined);
  const [createManager, setCreateManager] = useState(false);
  const [managerCredentials, setManagerCredentials] = useState<ManagerCredentials | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  // إعداد البيانات الأولية لوضع التعديل
  const formInitialData = isEdit && initialData
    ? {
      name: initialData.name,
      email: initialData.email,
      phone: initialData.phone,
      address: initialData.address,
    }
    : initialCompanyData;

  // حالة النموذج باستخدام الخطاف المخصص
  const {
    formData,
    handleChange,
    handleSubmit,
    updateFormData,
    isSubmitting,
    error,
    resetForm,
  } = useForm<CompanyFormData, any>(
    async (data) => {
      if (isEdit && initialData) {
        return companiesApi.update(initialData.id, data, logoImage);
      }
      return companiesApi.create(data, logoImage);
    },
    formInitialData,
    {
      onSuccess: (data) => {
        const successMessage = isEdit
          ? 'تم تحديث الشركة بنجاح'
          : 'تم إنشاء الشركة بنجاح';
        toast.success(successMessage);

        // التحقق من توفر بيانات اعتماد المدير
        if (!isEdit && data.manager) {
          setManagerCredentials(data.manager);
          setShowCredentialsModal(true);
        } else {
          // إذا لم يتم إنشاء مدير أو في وضع التعديل، قم بإعادة التوجيه أو استدعاء onSuccess على الفور
          if (onSuccess) {
            onSuccess(data.company);
          } else {
            router.push(`/dashboard/companies/${data.company.id}`);
          }
        }
      },
      onError: (errorMessage) => {
        toast.error(errorMessage || 'حدث خطأ ما');
      },
    }
  );

  // إعادة تعيين النموذج عند تغيير البيانات الأولية (للتعديل)
  useEffect(() => {
    if (isEdit && initialData) {
      resetForm();
    }
  }, [isEdit, initialData]);

  // التعامل مع تغيير إدخال الملف
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogoImage(e.target.files[0]);
    }
  };



  // التعامل مع إغلاق النافذة المنبثقة
  const handleModalClose = () => {
    setShowCredentialsModal(false);
    // توجيه إلى تفاصيل الشركة أو استدعاء onSuccess
    if (onSuccess && managerCredentials) {
      onSuccess({ id: managerCredentials.companyId } as Company);
    } else if (managerCredentials) {
      router.push(`/dashboard/companies/${managerCredentials.companyId}`);
    }
  };

  // نسخ بيانات الاعتماد إلى الحافظة
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
        <form onSubmit={(e) => handleSubmit(e, formData)} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات الشركة</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="اسم الشركة"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                fullWidth
              />

              <Input
                label="البريد الإلكتروني"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                fullWidth
              />

              <Input
                label="الهاتف"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                fullWidth
              />

              <Input
                label="العنوان"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                fullWidth
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                شعار الشركة (اختياري)
              </label>
              <input
                type="file"
                id="logoImage"
                name="logoImage"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                قم بتحميل شعار الشركة (PNG، JPG)
              </p>

              {/* عرض الشعار الحالي في وضع التعديل */}
              {isEdit && initialData?.logoImageUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">الشعار الحالي:</p>
                  <div className="mt-1 relative w-32 h-32 border border-gray-200 rounded-md overflow-hidden">
                    <img
                      src={initialData.logoImageUrl}
                      alt={`شعار ${initialData.name}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* قسم إنشاء المدير - فقط للشركات الجديدة */}
          {!isEdit && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="الاسم الكامل للمدير"
                  id="managerFullName"
                  name="managerFullName"
                  value={formData.managerFullName || ''}
                  onChange={handleChange}
                  required
                  fullWidth
                />

                <Input
                  label="البريد الإلكتروني للمدير"
                  id="managerEmail"
                  name="managerEmail"
                  type="email"
                  value={formData.managerEmail || ''}
                  onChange={handleChange}
                  required
                  fullWidth
                />

                <Input
                  label="هاتف المدير"
                  id="managerPhone"
                  name="managerPhone"
                  value={formData.managerPhone || ''}
                  onChange={handleChange}
                  required
                  fullWidth
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4">
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

      {/* نافذة بيانات اعتماد المدير */}
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
                    <span className="text-base text-blue-800 capitalize">{managerCredentials.role === 'manager' ? 'مدير' : managerCredentials.role}</span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  <p className="mb-2">
                    <span className="text-red-500 font-bold">مهم:</span> سيتم عرض بيانات الاعتماد هذه مرة واحدة فقط.
                    تأكد من تخزينها بشكل آمن ومشاركتها مع المدير.
                  </p>
                  <p>
                    يجب على المدير تغيير كلمة المرور الخاصة به بعد تسجيل الدخول الأول لأسباب أمنية.
                  </p>
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