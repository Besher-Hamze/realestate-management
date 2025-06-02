import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import {
  Reservation,
  ReservationFormData,
  User,
  ContractType,
  PaymentMethod,
  PaymentSchedule
} from '@/lib/types';
import { reservationsApi, unitsApi, usersApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

interface NewUserCredentials {
  id: number;
  username: string;
  password: string;
  fullName: string;
}

interface ReservationFormProps {
  isEdit?: boolean;
  initialData?: Reservation;
  preSelectedUnitId?: number;
  preSelectedUserId?: number;
  onSuccess?: (reservation: Reservation) => void;
}

// Define payment method options
const paymentMethodOptions = [
  { value: 'cash', label: 'نقداً' },
  { value: 'checks', label: 'شيكات' },
];

// Define payment schedule options
const paymentScheduleOptions = [
  { value: 'monthly', label: 'شهري' },
  { value: 'quarterly', label: '4 دفعات' },
  { value: 'triannual', label: '3 دفعات' },
  { value: 'biannual', label: 'دفعتين' },
  { value: 'annual', label: 'سنوي' },
];

// Define contract type options
const contractTypeOptions = [
  { value: 'residential', label: 'سكني' },
  { value: 'commercial', label: 'تجاري' },
];

// Define tenant type options
const tenantTypeOptions = [
  { value: 'person', label: 'فرد' },
  { value: 'commercial_register', label: 'سجل تجاري' },
  { value: 'partnership', label: 'شراكة' },
  { value: 'embassy', label: 'سفارة' },
  { value: 'foreign_company', label: 'شركة أجنبية' },
  { value: 'government', label: 'حكومي' },
  { value: 'inheritance', label: 'ميراث' },
  { value: 'civil_registry', label: 'سجل مدني' },
];

const initialReservationData: ReservationFormData = {
  unitId: 0,
  contractType: 'residential',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  paymentMethod: 'cash',
  paymentSchedule: 'monthly',
  includesDeposit: false,
  depositAmount: 0,
  notes: '',
};

export default function ReservationForm({
  isEdit = false,
  initialData,
  preSelectedUnitId,
  preSelectedUserId,
  onSuccess,
}: ReservationFormProps) {
  const router = useRouter();
  const [units, setUnits] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  // Default to new tenant option unless specified
  const [selectedTenantOption, setSelectedTenantOption] = useState<'existing' | 'new'>(preSelectedUserId ? 'existing' : 'new');
  const [contractFile, setContractFile] = useState<File | undefined>(undefined);
  const [contractPdfFile, setContractPdfFile] = useState<File | undefined>(undefined);
  const [identityImageFront, setIdentityImageFront] = useState<File | undefined>(undefined);
  const [identityImageBack, setIdentityImageBack] = useState<File | undefined>(undefined);
  const [commercialRegisterImage, setCommercialRegisterImage] = useState<File | undefined>(undefined);
  const [newUserCredentials, setNewUserCredentials] = useState<NewUserCredentials | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showDepositFields, setShowDepositFields] = useState(false);

  // إعداد البيانات الأولية
  const formInitialData: ReservationFormData = isEdit && initialData
    ? {
      unitId: initialData.unitId,
      userId: initialData.userId,
      contractType: initialData.contractType as ContractType,
      startDate: initialData.startDate.split('T')[0],
      endDate: initialData.endDate.split('T')[0],
      paymentMethod: initialData.paymentMethod as PaymentMethod,
      paymentSchedule: initialData.paymentSchedule as PaymentSchedule,
      includesDeposit: initialData.includesDeposit,
      depositAmount: initialData.depositAmount,
      notes: initialData.notes,
    }
    : {
      ...initialReservationData,
      unitId: preSelectedUnitId || 0,
      userId: preSelectedUserId,
    };

  // حالة النموذج باستخدام الخطاف المخصص
  const {
    formData,
    handleChange,
    handleSubmit,
    updateFormData,
    isSubmitting,
    error,
    resetForm,
  } = useForm<ReservationFormData, any>(
    async (data) => {
      const formDataToSubmit = { ...data };

      // Add file attachments to the formDataToSubmit object
      if (contractFile) {
        formDataToSubmit.contractImage = contractFile;
      }

      if (contractPdfFile) {
        formDataToSubmit.contractPdf = contractPdfFile;
      }

      if (identityImageFront) {
        formDataToSubmit.identityImageFront = identityImageFront;
      }

      if (identityImageBack) {
        formDataToSubmit.identityImageBack = identityImageBack;
      }

      if (commercialRegisterImage) {
        formDataToSubmit.commercialRegisterImage = commercialRegisterImage;
      }

      if (isEdit && initialData) {
        return reservationsApi.update(initialData.id, formDataToSubmit);
      }

      return reservationsApi.create(formDataToSubmit);
    },
    formInitialData,
    {
      onSuccess: (response) => {
        const successMessage = isEdit
          ? 'تم تحديث الحجز بنجاح'
          : 'تم إنشاء الحجز بنجاح';
        toast.success(successMessage);

        // Handle new user credentials if available
        if (!isEdit && response.newUser) {
          setNewUserCredentials(response.newUser);
          setShowCredentialsModal(true);
        } else if (onSuccess && response.reservation) {
          onSuccess(response.reservation);
        } else if (response.reservation) {
          router.push(`/dashboard/reservations/${response.reservation.id}`);
        } else {
          router.push('/dashboard/reservations');
        }
      },
      onError: (errorMessage) => {
        toast.error(errorMessage || 'حدث خطأ ما');
      },
    }
  );

  // إعادة تعيين النموذج عند تغيير البيانات الأولية (للتعديل)
  useEffect(() => {
    if (initialData) {
      resetForm();
      setShowDepositFields(initialData.includesDeposit);
    } else if (preSelectedUnitId) {
      updateFormData({ unitId: preSelectedUnitId });
    }

    if (preSelectedUserId) {
      updateFormData({ userId: preSelectedUserId });
    } else {
      // setSelectedTenantOption('new');
      // Set default tenant type to 'person' for new tenants
      // updateFormData({ tenantType: 'person' });
    }
  }, [isEdit, initialData, preSelectedUnitId, preSelectedUserId, resetForm, updateFormData]);

  // Update deposit fields visibility when includesDeposit changes
  useEffect(() => {
    setShowDepositFields(formData.includesDeposit);
  }, [formData.includesDeposit]);

  // جلب الوحدات المتاحة
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setIsLoadingUnits(true);

        const response = isEdit
          ? await unitsApi.getAll()
          : await unitsApi.getAvailable();

        if (response.success) {
          setUnits(response.data);
        } else {
          toast.error(response.message || 'فشل في تحميل الوحدات');
        }
      } catch (error) {
        console.error('خطأ في جلب الوحدات:', error);
        toast.error('حدث خطأ أثناء تحميل الوحدات');
      } finally {
        setIsLoadingUnits(false);
      }
    };

    fetchUnits();
  }, [isEdit]);

  // جلب المستخدمين إذا تم تحديد \"مستأجر موجود\"
  useEffect(() => {
    if (selectedTenantOption === 'existing' && !isEdit) {
      const fetchUsers = async () => {
        try {
          setIsLoadingUsers(true);
          const response = await usersApi.getAll();

          if (response.success) {
            // Filter only tenant users
            const tenantUsers = response.data.filter(user => user.role === 'tenant');
            setUsers(tenantUsers);
          } else {
            toast.error(response.message || 'فشل في تحميل المستخدمين');
          }
        } catch (error) {
          console.error('خطأ في جلب المستخدمين:', error);
          toast.error('حدث خطأ أثناء تحميل المستخدمين');
        } finally {
          setIsLoadingUsers(false);
        }
      };

      fetchUsers();
    }
  }, [selectedTenantOption, isEdit]);

  // إنشاء خيارات الوحدات للقائمة المنسدلة
  const unitOptions = units.map((unit) => {
    const buildingName = unit.building?.name || 'مبنى غير معروف';
    return {
      value: unit.id,
      label: `${unit.unitNumber} - ${buildingName} (${unit.status === 'available' ? 'متاح' : unit.status})`,
    };
  });

  // إنشاء خيارات المستخدمين للقائمة المنسدلة
  const userOptions = users.map((user) => ({
    value: user.id,
    label: `${user.fullName} (${user.email})`,
  }));

  // التعامل مع تغيير ملفات العقد والهوية
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | undefined>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  // التعامل مع تغيير خيار المستأجر (موجود/جديد)
  const handleTenantOptionChange = (option: 'existing' | 'new') => {
    setSelectedTenantOption(option);

    // Reset related fields
    if (option === 'existing') {
      updateFormData({
        tenantFullName: undefined,
        tenantEmail: undefined,
        tenantPhone: undefined,
        tenantWhatsappNumber: undefined,
        tenantIdNumber: undefined,
        tenantType: undefined,
        tenantBusinessActivities: undefined,
        tenantContactPerson: undefined,
        tenantContactPosition: undefined,
        tenantNotes: undefined,
      });
    } else {
      // Set default tenant type to 'person' for new tenants
      updateFormData({ userId: undefined, tenantType: 'person' });
    }
  };

  // التعامل مع تغيير توفر الإيداع
  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const includesDeposit = e.target.checked;
    updateFormData({ includesDeposit });
    setShowDepositFields(includesDeposit);

    if (!includesDeposit) {
      updateFormData({ depositAmount: undefined });
    }
  };

  // التعامل مع إغلاق النافذة المنبثقة والتنقل
  const handleCredentialsModalClose = () => {
    setShowCredentialsModal(false);

    if (newUserCredentials) {
      // انتقل إلى صفحة الحجز إذا كانت موجودة
      if (onSuccess && formData) {
        onSuccess(formData as any);
      } else {
        router.push('/dashboard/reservations');
      }
    }
  };

  // نسخ بيانات الاعتماد إلى الحافظة
  const copyCredentials = () => {
    if (!newUserCredentials) return;

    const credentials = `
      اسم المستخدم: ${newUserCredentials.username}
      كلمة المرور: ${newUserCredentials.password}
      الاسم الكامل: ${newUserCredentials.fullName}
    `;

    navigator.clipboard.writeText(credentials.trim())
      .then(() => toast.success('تم نسخ بيانات الاعتماد إلى الحافظة!'))
      .catch(() => toast.error('فشل نسخ بيانات الاعتماد'));
  };

  return (
    <>
      <Card>
        <form onSubmit={(e) => handleSubmit(e, formData)} className="space-y-6 p-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
              {error}
            </div>
          )}

          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isEdit ? 'تعديل الحجز' : 'إنشاء حجز جديد'}
          </h2>

          {/* اختيار الوحدة */}
          <Select
            label="وحدة العقار"
            id="unitId"
            name="unitId"
            value={formData.unitId?.toString() || ''}
            onChange={handleChange}
            options={unitOptions}
            disabled={isLoadingUnits || isEdit || !!preSelectedUnitId}
            required
            fullWidth
            helpText={isLoadingUnits ? 'جاري تحميل الوحدات...' : 'اختر الوحدة لهذا الحجز'}
            emptyOptionLabel="اختر وحدة"
          />

          {/* نوع العقد */}
          <Select
            label="نوع العقد"
            id="contractType"
            name="contractType"
            value={formData.contractType || 'residential'}
            onChange={handleChange}
            options={contractTypeOptions}
            required
            fullWidth
          />

          {/* فترة الحجز */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="تاريخ البدء"
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate || ''}
              onChange={handleChange}
              required
              fullWidth
            />

            <Input
              label="تاريخ الانتهاء"
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate || ''}
              onChange={handleChange}
              required
              fullWidth
            />
          </div>

          {/* طريقة الدفع والجدول الزمني */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="طريقة الدفع"
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod || 'cash'}
              onChange={handleChange}
              options={paymentMethodOptions}
              required
              fullWidth
            />

            <Select
              label="جدول الدفع"
              id="paymentSchedule"
              name="paymentSchedule"
              value={formData.paymentSchedule || 'monthly'}
              onChange={handleChange}
              options={paymentScheduleOptions}
              required
              fullWidth
            />
          </div>

          {/* مبلغ التأمين */}
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includesDeposit"
                name="includesDeposit"
                checked={formData.includesDeposit || false}
                onChange={handleDepositChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="includesDeposit" className="mr-2 block text-sm text-gray-700">
                يتضمن مبلغ تأمين
              </label>
            </div>

            {showDepositFields && (
              <Input
                label="مبلغ التأمين"
                id="depositAmount"
                name="depositAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.depositAmount?.toString() || '0'}
                onChange={handleChange}
                required={formData.includesDeposit}
                fullWidth
              />
            )}
          </div>

          {/* اختيار المستأجر (موجود/جديد) - فقط للإنشاء الجديد */}
          {!isEdit && (
            <div className="space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات المستأجر</h3>

              </div>



              {/* نموذج المستأجر الجديد */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="نوع المستأجر"
                    id="tenantType"
                    name="tenantType"
                    value={formData.tenantType}
                    onChange={handleChange}
                    options={tenantTypeOptions}
                    required
                    fullWidth
                  />
                  <Input
                    label="الاسم الكامل"
                    id="tenantFullName"
                    name="tenantFullName"
                    value={formData.tenantFullName || ''}
                    onChange={handleChange}
                    required
                    fullWidth
                  />
                  <Input
                    label="البريد الإلكتروني"
                    id="tenantEmail"
                    name="tenantEmail"
                    type="email"
                    value={formData.tenantEmail || ''}
                    onChange={handleChange}
                    required
                    fullWidth
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="الهاتف"
                    id="tenantPhone"
                    name="tenantPhone"
                    type='tel'
                    value={formData.tenantPhone || ''}
                    onChange={handleChange}
                    required
                    fullWidth
                  />

                  <Input
                    label="رقم واتساب"
                    id="tenantWhatsappNumber"
                    type='tel'
                    name="tenantWhatsappNumber"
                    value={formData.tenantWhatsappNumber || ''}
                    onChange={handleChange}
                    fullWidth
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="رقم الهوية"
                    id="tenantIdNumber"
                    type='number'
                    name="tenantIdNumber"
                    value={formData.tenantIdNumber || ''}
                    onChange={handleChange}
                    required
                    fullWidth
                  />


                </div>

                {formData.tenantType && ['commercial_register', 'partnership', 'foreign_company'].includes(formData.tenantType) && (
                  <Input
                    label="الأنشطة التجارية"
                    id="tenantBusinessActivities"
                    name="tenantBusinessActivities"
                    value={formData.tenantBusinessActivities || ''}
                    onChange={handleChange}
                    fullWidth
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="جهة الاتصال"
                    id="tenantContactPerson"
                    name="tenantContactPerson"
                    value={formData.tenantContactPerson || ''}
                    onChange={handleChange}
                    fullWidth
                  />

                  <Input
                    label="منصب جهة الاتصال"
                    id="tenantContactPosition"
                    name="tenantContactPosition"
                    value={formData.tenantContactPosition || ''}
                    onChange={handleChange}
                    fullWidth
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      صورة الهوية (الوجه الأمامي)
                    </label>
                    <input
                      type="file"
                      id="identityImageFront"
                      name="identityImageFront"
                      onChange={(e) => handleFileChange(e, setIdentityImageFront)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      صورة الهوية (الوجه الخلفي)
                    </label>
                    <input
                      type="file"
                      id="identityImageBack"
                      name="identityImageBack"
                      onChange={(e) => handleFileChange(e, setIdentityImageBack)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>

                  {formData.tenantType && ['commercial_register', 'partnership', 'foreign_company'].includes(formData.tenantType) && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        صورة السجل التجاري
                      </label>
                      <input
                        type="file"
                        id="commercialRegisterImage"
                        name="commercialRegisterImage"
                        onChange={(e) => handleFileChange(e, setCommercialRegisterImage)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        required={formData.tenantType && ['commercial_register', 'partnership', 'foreign_company'].includes(formData.tenantType)}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {formData.tenantType && ['commercial_register', 'partnership', 'foreign_company'].includes(formData.tenantType)
                          ? 'مطلوب لهذا النوع من المستأجرين'
                          : 'اختياري لهذا النوع من المستأجرين'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="tenantNotes" className="block text-sm font-medium text-gray-700 mb-1">
                    ملاحظات عن المستأجر
                  </label>
                  <textarea
                    id="tenantNotes"
                    name="tenantNotes"
                    rows={3}
                    value={formData.tenantNotes || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="معلومات إضافية عن المستأجر..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* الملاحظات */}
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات عن الحجز
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes || ''}
              onChange={handleChange}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="معلومات إضافية حول هذا الحجز..."
            />
          </div>

          {/* وثائق العقد */}
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">وثائق العقد</h3>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                صورة العقد {isEdit ? '(اختياري)' : '(مطلوب)'}
              </label>
              <input
                type="file"
                id="contractImage"
                name="contractImage"
                onChange={(e) => handleFileChange(e, setContractFile)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                required={!isEdit && !initialData?.contractImageUrl}
              />
              {initialData?.contractImageUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">الصورة الحالية:</p>
                  <a
                    href={initialData.contractImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                  >
                    عرض صورة العقد الحالية
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  ملف PDF للعقد (اختياري)
                </label>
                <input
                  type="file"
                  id="contractPdf"
                  name="contractPdf"
                  onChange={(e) => handleFileChange(e, setContractPdfFile)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {initialData?.contractPdfUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">الملف الحالي:</p>
                    <a
                      href={initialData.contractPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                    >
                      تنزيل ملف العقد الحالي (PDF)
                    </a>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
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
                  {isEdit ? 'تحديث الحجز' : 'إنشاء الحجز'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Card>

      {/* نافذة بيانات اعتماد المستخدم الجديد */}
      <Modal
        isOpen={showCredentialsModal}
        onClose={handleCredentialsModalClose}
        title="تم إنشاء حساب مستأجر جديد"
        size="md"
      >
        <div className="p-6">
          {newUserCredentials && (
            <>
              <div className="mb-4">
                <p className="text-gray-700 mb-4">
                  تم إنشاء حساب مستأجر جديد. يرجى مشاركة بيانات الاعتماد هذه مع المستأجر:
                </p>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md font-mono">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">اسم المستخدم:</span>
                    <span className="text-base text-blue-800">{newUserCredentials.username}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">كلمة المرور:</span>
                    <span className="text-base text-blue-800">{newUserCredentials.password}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">الاسم الكامل:</span>
                    <span className="text-base text-blue-800">{newUserCredentials.fullName}</span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                  <p className="mb-2">
                    <span className="text-red-500">مهم:</span> يرجى التأكد من مشاركة بيانات الاعتماد هذه بشكل آمن
                    مع المستأجر. سيحتاجون إلى هذه التفاصيل لتسجيل الدخول إلى حسابهم.
                  </p>
                  <p>
                    قد ترغب في نصح المستأجر بتغيير كلمة المرور الخاصة به بعد تسجيل الدخول الأول.
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
                  onClick={handleCredentialsModalClose}
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