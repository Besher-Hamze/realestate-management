import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import { ServiceOrder, ServiceOrderFormData, Reservation, Unit, ServiceType, ServiceSubtype } from '@/lib/types';
import { servicesApi, reservationsApi, unitsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

interface ServiceFormProps {
  isEdit?: boolean;
  initialData?: ServiceOrder;
  preSelectedReservationId?: number;
  preSelectedUnitId?: number;
  isTenant?: boolean;
  onSuccess?: (serviceOrder: ServiceOrder) => void;
}

const initialServiceData: ServiceOrderFormData = {
  reservationId: 0,
  serviceType: 'maintenance',
  serviceSubtype: 'electrical',
  description: '',
};

const serviceTypeOptions = [
  { value: 'maintenance', label: 'صيانة' },
  { value: 'financial', label: 'مالي' },
  { value: 'administrative', label: 'إداري' },
];

// ربط أنواع الخدمة بالأنواع الفرعية
const serviceSubtypeOptions: Record<ServiceType, { value: string; label: string }[]> = {
  maintenance: [
    { value: 'electrical', label: 'كهربائي' },
    { value: 'plumbing', label: 'سباكة' },
    { value: 'hvac', label: 'تكييف وتدفئة' },
    { value: 'appliance', label: 'أجهزة منزلية' },
    { value: 'structural', label: 'هيكلي' },
    { value: 'general', label: 'عام' },
    { value: 'general', label: 'تنظيف عام' },
    { value: 'deep', label: 'تنظيف عميق' },
    { value: 'windows', label: 'تنظيف نوافذ' },
    { value: 'carpets', label: 'تنظيف سجاد' },
  ],
  financial: [
    { value: 'postpone_payment', label: 'تأجيل دفعة' },
    { value: 'advance_payment', label: 'تقديم دفعة' },
    { value: 'replace_check', label: 'استبدال شيك' },
    { value: 'other_financial', label: 'أخرى (مالية)' },
  ],
  administrative: [
    { value: 'cancel_contract', label: 'إلغاء عقد' },
    { value: 'renew_contract', label: 'تجديد عقد' },
    { value: 'change_unit', label: 'استبدال وحدة' },
    { value: 'eviction', label: 'إخلاء' },
    { value: 'other_administrative', label: 'أخرى (إدارية)' },
  ],
};

export default function ServiceForm({
  isEdit = false,
  initialData,
  preSelectedReservationId,
  preSelectedUnitId,
  isTenant = false,
  onSuccess,
}: ServiceFormProps) {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>('maintenance');
  const [attachmentFile, setAttachmentFile] = useState<File | undefined>(undefined);

  // إعداد البيانات الأولية لوضع التعديل أو مع حجز محدد مسبقًا
  const formInitialData: ServiceOrderFormData = isEdit && initialData
    ? {
      reservationId: initialData.reservationId,
      serviceType: initialData.serviceType,
      serviceSubtype: initialData.serviceSubtype,
      description: initialData.description,
    }
    : preSelectedReservationId
      ? { ...initialServiceData, reservationId: preSelectedReservationId }
      : initialServiceData;

  // حالة النموذج باستخدام الخطاف المخصص
  const {
    formData,
    handleChange,
    handleSubmit,
    updateFormData,
    isSubmitting,
    error,
    resetForm,
  } = useForm<ServiceOrderFormData, ServiceOrder>(
    async (data) => {
      if (isEdit && initialData) {
        return servicesApi.update(initialData.id, {
          serviceType: data.serviceType,
          serviceSubtype: data.serviceSubtype,
          description: data.description,
          attachmentFile: attachmentFile
        });
      }
      return servicesApi.create({
        reservationId: data.reservationId,
        serviceType: data.serviceType,
        serviceSubtype: data.serviceSubtype,
        description: data.description,
        attachmentFile: attachmentFile
      });
    },
    formInitialData,
    {
      onSuccess: (data) => {
        const successMessage = isEdit
          ? 'تم تحديث طلب الخدمة بنجاح'
          : 'تم تقديم طلب الخدمة بنجاح';
        toast.success(successMessage);

        if (onSuccess) {
          onSuccess(data);
        } else {
          if (isTenant) {
            router.push(`/tenant/services/${data.id}`);
          } else {
            router.push(`/dashboard/services/${data.id}`);
          }
        }
      },
      onError: (errorMessage) => {
        toast.error(errorMessage || 'حدث خطأ');
      },
    }
  );

  // تأثير عندما يتغير نوع الخدمة، تحديث النوع الفرعي للخدمة
  useEffect(() => {
    if (formData.serviceType !== selectedServiceType) {
      setSelectedServiceType(formData.serviceType as ServiceType);

      // تعيين أول خيار نوع فرعي لنوع الخدمة المحدد
      const firstSubtype = serviceSubtypeOptions[formData.serviceType as ServiceType][0].value;
      updateFormData({ serviceSubtype: firstSubtype as ServiceSubtype });
    }
  }, [formData.serviceType, selectedServiceType, updateFormData]);

  // إعادة تعيين النموذج عند تغيير البيانات الأولية (للتعديل) أو عند تغيير معرف الحجز المحدد مسبقًا
  useEffect(() => {
    if (isEdit && initialData) {
      resetForm();
      setSelectedServiceType(initialData.serviceType);
    } else if (preSelectedReservationId) {
      updateFormData({ reservationId: preSelectedReservationId });
    }
  }, [isEdit, initialData, preSelectedReservationId, resetForm, updateFormData]);

  // جلب المستأجرين  بناءً على الشروط
  // جلب المستأجرين  بناءً على الشروط
  useEffect(() => {
    const fetchReservationsData = async () => {
      try {
        setIsLoadingReservations(true);

        let response;
        if (isTenant) {
          // المستأجر يمكنه رؤية حجوزاته فقط
          response = await reservationsApi.getMy();
        } else {
          // المشرفون/المديرون يمكنهم رؤية جميع المستأجرين 
          response = await reservationsApi.getAll();
        }

        if (response.success) {
          // تصفية المستأجرين  النشطة
          const activeReservations = response.data.filter(res => res.status === 'active');

          // إذا تم توفير معرف وحدة محدد مسبقًا، تصفية حسب تلك الوحدة
          const filteredReservations = preSelectedUnitId
            ? activeReservations.filter(res => res.unitId === preSelectedUnitId)
            : activeReservations;

          setReservations(filteredReservations);

          // استخراج الوحدات من المستأجرين  للقائمة المنسدلة
          const extractedUnits = filteredReservations
            .filter(res => res.unit) // تصفية المستأجرين  بدون بيانات الوحدة
            .map(res => res.unit as Unit); // استخراج بيانات الوحدة

          setUnits(extractedUnits);

          // إذا كان هناك حجز واحد فقط وليس هناك reservationId محدد مسبقًا،
          // تعيين الحجز الوحيد تلقائياً
          if (filteredReservations.length === 1 && !preSelectedReservationId && !isEdit) {
            const singleReservationId = filteredReservations[0].id;
            console.log('Auto-selecting the only reservation:', singleReservationId);
            updateFormData({ reservationId: singleReservationId });
          }

          // إذا تم توفير معرف حجز محدد مسبقًا ولكن لم يتم العثور عليه في المستأجرين  النشطة، أظهر تحذيرًا
          if (
            preSelectedReservationId &&
            !filteredReservations.some(res => res.id === preSelectedReservationId)
          ) {
            toast.warning('الحجز المحدد غير نشط أو غير موجود');
          }
        } else {
          toast.error(response.message || 'فشل في تحميل المستأجرين ');
        }
      } catch (error) {
        console.error('خطأ في جلب المستأجرين :', error);
        toast.error('حدث خطأ أثناء تحميل المستأجرين ');
      } finally {
        setIsLoadingReservations(false);
      }
    };

    fetchReservationsData();
  }, [isTenant, preSelectedUnitId, preSelectedReservationId, isEdit, updateFormData]);
  // إنشاء خيارات الحجز للقائمة المنسدلة
  const reservationOptions = reservations.map((reservation) => {
    const unitNumber = reservation.unit?.unitNumber || 'وحدة غير معروفة';
    const buildingName = reservation.unit?.building?.name || 'مبنى غير معروف';
    return {
      value: reservation.id,
      label: `${unitNumber} - ${buildingName}`,
    };
  });

  // التعامل مع تغيير إدخال الملف
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachmentFile(e.target.files[0]);
    }
  };

  // معالجة تغيير الحجز
  const handleReservationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);

    updateFormData({ reservationId: value });

    console.log('Reservation ID changed to:', value);
  };

  // طباعة قيمة reservationId للتصحيح
  console.log('Current reservationId in formData:', formData.reservationId);

  return (
    <Card>
      <form onSubmit={(e) => handleSubmit(e, formData)} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* اختيار الحجز (يظهر فقط إذا لم يتم تحديده مسبقًا) */}
        {!preSelectedReservationId && (
          <Select
            label="اختر العقار"
            id="reservationId"
            name="reservationId"
            value={formData.reservationId.toString()}
            onChange={handleReservationChange} // استخدام الدالة المخصصة بدلاً من handleChange
            options={reservationOptions}
            disabled={isLoadingReservations || isEdit}
            required
            fullWidth
            helpText={isLoadingReservations ? 'جاري تحميل العقارات...' : undefined}
            emptyOptionLabel="اختر عقارًا"
          />
        )}

        {/* نوع الخدمة */}
        <Select
          label="نوع الخدمة"
          id="serviceType"
          name="serviceType"
          value={formData.serviceType}
          onChange={handleChange}
          options={serviceTypeOptions}
          required
          fullWidth
        />

        {/* النوع الفرعي للخدمة (يعتمد على نوع الخدمة المحدد) */}
        <Select
          label="النوع الفرعي للخدمة"
          id="serviceSubtype"
          name="serviceSubtype"
          value={formData.serviceSubtype}
          onChange={handleChange}
          options={serviceSubtypeOptions[selectedServiceType]}
          required
          fullWidth
        />

        {/* الوصف */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            الوصف
            <span className="mr-1 text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            required
            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="يرجى وصف المشكلة بالتفصيل..."
          />
        </div>

        {/* ملف مرفق */}
        <div className="mb-4">
          <label htmlFor="attachmentFile" className="block text-sm font-medium text-gray-700 mb-1">
            مرفق (اختياري)
          </label>
          <input
            id="attachmentFile"
            name="attachmentFile"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            يمكنك إرفاق صور أو مستندات أو ملفات أخرى متعلقة بطلب الخدمة الخاص بك.
          </p>
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
            disabled={isSubmitting || formData.reservationId === 0}
          >
            {isEdit ? 'تحديث طلب الخدمة' : 'تقديم طلب الخدمة'}
          </Button>
        </div>
      </form>
    </Card>
  );
}