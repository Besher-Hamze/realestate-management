import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Tenant, CreateTenantFormData, UpdateTenantFormData } from '@/lib/types';
import { tenantsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { TENANT_TYPE_OPTIONS } from '@/constants/options';

interface TenantFormProps {
  isEdit?: boolean;
  initialData?: Tenant;
  onSuccess?: (tenant: Tenant) => void;
}

const initialTenantData: CreateTenantFormData = {
  username: '',
  password: '',
  fullName: '',
  email: '',
  phone: '',
  whatsappNumber: '',
  idNumber: '',
  tenantType: 'person',
  businessActivities: '',
  contactPerson: '',
  contactPosition: '',
  notes: '',
};

export default function TenantForm({
  isEdit = false,
  initialData,
  onSuccess,
}: TenantFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateTenantFormData | UpdateTenantFormData>(
    isEdit && initialData && initialData.user
      ? {
        fullName: initialData.user.fullName,
        email: initialData.user.email,
        phone: initialData.user.phone,
        whatsappNumber: initialData.user.whatsappNumber || '',
        idNumber: initialData.user.idNumber || '',
        tenantType: initialData.tenantType,
        businessActivities: initialData.businessActivities || '',
        contactPerson: initialData.contactPerson || '',
        contactPosition: initialData.contactPosition || '',
        notes: initialData.notes || '',
      }
      : initialTenantData
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [identityFrontFile, setIdentityFrontFile] = useState<File | null>(null);
  const [identityBackFile, setIdentityBackFile] = useState<File | null>(null);
  const [commRegisterFile, setCommRegisterFile] = useState<File | null>(null);

  // التعامل مع تغييرات الحقول
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // التعامل مع تغييرات الملفات
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      switch (name) {
        case 'identityImageFront':
          setIdentityFrontFile(files[0]);
          break;
        case 'identityImageBack':
          setIdentityBackFile(files[0]);
          break;
        case 'commercialRegisterImage':
          setCommRegisterFile(files[0]);
          break;
      }
    }
  };

  // تقديم النموذج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // إعداد البيانات للإرسال
      const submitData = { ...formData };

      // إضافة الملفات إن وجدت
      const files: Record<string, File | undefined> = {};
      if (identityFrontFile) files.identityImageFront = identityFrontFile;
      if (identityBackFile) files.identityImageBack = identityBackFile;
      if (commRegisterFile) files.commercialRegisterImage = commRegisterFile;

      let response;
      if (isEdit && initialData) {
        response = await tenantsApi.update(initialData.id, submitData as UpdateTenantFormData);
      } else {
        // التحقق من وجود الحقول المطلوبة
        if (!('username' in submitData) || !submitData.username || !('password' in submitData) || !submitData.password) {
          setError('اسم المستخدم وكلمة المرور مطلوبان');
          setIsSubmitting(false);
          return;
        }
        response = await tenantsApi.create(submitData as CreateTenantFormData);
      }

      if (response.success) {
        const successMessage = isEdit
          ? 'تم تحديث المستأجر بنجاح'
          : 'تم إنشاء المستأجر بنجاح';
        toast.success(successMessage);

        if (onSuccess) {
          onSuccess(response.data);
        } else {
          router.push(`/dashboard/tenants/${response.data.id}`);
        }
      } else {
        setError(response.message || 'حدث خطأ أثناء حفظ المستأجر');
        toast.error(response.message || 'حدث خطأ');
      }
    } catch (error) {
      console.error('خطأ في حفظ المستأجر:', error);
      setError('حدث خطأ أثناء حفظ المستأجر');
      toast.error('حدث خطأ أثناء حفظ المستأجر');
    } finally {
      setIsSubmitting(false);
    }
  };

  // تحديد ما إذا كان يجب إظهار حقول الشركة
  const isBusinessTenant = formData.tenantType !== 'person';

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* بيانات الحساب - فقط في حالة الإضافة الجديدة */}
        {!isEdit && (
          <div className="border rounded-md p-4 mb-4 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-3">بيانات الحساب</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="اسم المستخدم"
                id="username"
                name="username"
                value={(formData as CreateTenantFormData).username || ''}
                onChange={handleChange}
                required
                fullWidth
              />
              <Input
                label="كلمة المرور"
                id="password"
                name="password"
                type="password"
                value={(formData as CreateTenantFormData).password || ''}
                onChange={handleChange}
                required
                fullWidth
              />
            </div>
          </div>
        )}

        {/* المعلومات الشخصية */}
        <div className="border rounded-md p-4 mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">المعلومات الشخصية</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="الاسم الكامل"
              id="fullName"
              name="fullName"
              value={formData.fullName}
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
              label="رقم الهاتف"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              fullWidth
            />

            <Input
              label="رقم الواتساب"
              id="whatsappNumber"
              name="whatsappNumber"
              type="tel"
              value={formData.whatsappNumber}
              onChange={handleChange}
              fullWidth
            />

            <Input
              label="رقم الهوية"
              type="number"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              required
              fullWidth
            />

            <Select
              label="نوع المستأجر"
              id="tenantType"
              name="tenantType"
              value={formData.tenantType}
              onChange={handleChange}
              options={TENANT_TYPE_OPTIONS}
              required
              fullWidth
            />
          </div>
        </div>

        {/* معلومات إضافية للشركات */}
        {isBusinessTenant && (
          <div className="border rounded-md p-4 mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">معلومات الشركة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="الأنشطة التجارية"
                id="businessActivities"
                name="businessActivities"
                value={formData.businessActivities}
                onChange={handleChange}
                fullWidth
              />

              <Input
                label="الشخص المسؤول"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                fullWidth
              />

              <Input
                label="المنصب الوظيفي"
                id="contactPosition"
                name="contactPosition"
                value={formData.contactPosition}
                onChange={handleChange}
                fullWidth
              />
            </div>
          </div>
        )}

        {/* تحميل المستندات */}
        <div className="border rounded-md p-4 mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">المستندات</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                صورة الهوية (الوجه الأمامي)
              </label>
              <input
                id="identityImageFront"
                name="identityImageFront"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                صورة الهوية (الوجه الخلفي)
              </label>
              <input
                id="identityImageBack"
                name="identityImageBack"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
              />
            </div>

            {isBusinessTenant && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  صورة السجل التجاري
                </label>
                <input
                  id="commercialRegisterImage"
                  name="commercialRegisterImage"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100"
                />
              </div>
            )}
          </div>
        </div>

        {/* ملاحظات */}
        <div className="mb-4">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            ملاحظات
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={formData.notes}
            onChange={handleChange}
            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>

        <div className="flex justify-end space-x-3">
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
            {isEdit ? 'تحديث المستأجر' : 'إنشاء المستأجر'}
          </Button>
        </div>
      </form>
    </Card>
  );
}