import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import { Reservation, ReservationFormData, Unit, User } from '@/lib/types';
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

const initialReservationData: ReservationFormData = {
  unitId: 0,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
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
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [contractFile, setContractFile] = useState<File | undefined>(undefined);
  const [identityFile, setIdentityFile] = useState<File | undefined>(undefined);
  const [commercialRegisterFile, setCommercialRegisterFile] = useState<File | undefined>(undefined);
  const [newUserCredentials, setNewUserCredentials] = useState<NewUserCredentials | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  // إعداد البيانات الأولية
  const formInitialData: ReservationFormData = isEdit && initialData
    ? {
      unitId: initialData.unitId,
      userId: initialData.userId,
      startDate: initialData.startDate.split('T')[0],
      endDate: initialData.endDate.split('T')[0],
      notes: initialData.notes,
    }
    : {
      ...initialReservationData,
      unitId: preSelectedUnitId || 0,
      userId: preSelectedUserId || undefined,
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
      const files: Record<string, File | undefined> = {
        contractImage: contractFile,
      };

      files.identityImage = identityFile;
      files.commercialRegisterImage = commercialRegisterFile;


      if (isEdit && initialData) {
        return reservationsApi.update(initialData.id, data, contractFile);
      }
      return reservationsApi.create(data, files);
    },
    formInitialData,
    {
      onSuccess: (response) => {
        const successMessage = isEdit
          ? 'تم تحديث الحجز بنجاح'
          : 'تم إنشاء الحجز بنجاح';
        toast.success(successMessage);
        console.log(response);
        console.log(response.newUser);
        setNewUserCredentials(response.newUser);

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
    } else if (preSelectedUnitId) {
      updateFormData({ unitId: preSelectedUnitId });
    }


  }, [isEdit, initialData, preSelectedUnitId, preSelectedUserId]);

  // جلب الوحدات المتاحة
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setIsLoadingUnits(true);

        // للتعديل، احصل على جميع الوحدات. للإنشاء، احصل فقط على المتاحة
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

  // إنشاء خيارات الوحدات للقائمة المنسدلة
  const unitOptions = units.map((unit) => {
    const buildingName = unit.building?.name || 'مبنى غير معروف';
    return {
      value: unit.id,
      label: `${unit.unitNumber} - ${buildingName} (${unit.status === 'available' ? 'متاح' : unit.status})`,
    };
  });


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | undefined>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
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
        <form onSubmit={(e) => handleSubmit(e, formData)} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* اختيار الوحدة */}
          <Select
            label="وحدة العقار"
            id="unitId"
            name="unitId"
            value={formData.unitId.toString()}
            onChange={handleChange}
            options={unitOptions}
            disabled={isLoadingUnits || isEdit}
            required
            fullWidth
            helpText={isLoadingUnits ? 'جاري تحميل الوحدات...' : 'اختر الوحدة لهذا الحجز'}
            emptyOptionLabel="اختر وحدة"
          />



          {/* نموذج المستأجر الجديد */}
          {!isEdit && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <h3 className="text-md font-medium text-gray-900">معلومات المستأجر الجديد</h3>

              <Input
                label="الاسم الكامل"
                id="fullName"
                name="fullName"
                value={formData.fullName || ''}
                onChange={handleChange}
                required
                fullWidth
              />

              <Input
                label="البريد الإلكتروني"
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                required
                fullWidth
              />

              <Input
                label="الهاتف"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                required
                fullWidth
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  وثيقة الهوية (اختياري)
                </label>
                <input
                  type="file"
                  id="identityImage"
                  name="identityImage"
                  onChange={(e) => handleFileChange(e, setIdentityFile)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  السجل التجاري (اختياري)
                </label>
                <input
                  type="file"
                  id="commercialRegisterImage"
                  name="commercialRegisterImage"
                  onChange={(e) => handleFileChange(e, setCommercialRegisterFile)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
            </div>
          )}

          {/* فترة الحجز */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="تاريخ البدء"
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              required
              fullWidth
            />

            <Input
              label="تاريخ الانتهاء"
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              required
              fullWidth
            />
          </div>

          {/* الملاحظات */}
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="معلومات إضافية حول هذا الحجز..."
            />
          </div>

          {/* وثيقة العقد */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              وثيقة العقد {isEdit ? '(اختياري)' : '(مطلوب)'}
            </label>
            <input
              type="file"
              id="contractImage"
              name="contractImage"
              onChange={(e) => handleFileChange(e, setContractFile)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              required={!isEdit}
            />
            {initialData?.contractUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">الوثيقة الحالية:</p>
                <a
                  href={initialData.contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  عرض العقد الحالي
                </a>
              </div>
            )}
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
              {isEdit ? 'تحديث الحجز' : 'إنشاء الحجز'}
            </Button>
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