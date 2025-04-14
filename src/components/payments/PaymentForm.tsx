import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useForm from '@/hooks/useForm';
import { Payment, PaymentFormData, Reservation } from '@/lib/types';
import { paymentsApi, reservationsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

interface PaymentFormProps {
  isEdit?: boolean;
  initialData?: Payment;
  preSelectedReservationId?: number;
  onSuccess?: (payment: Payment) => void;
}

const initialPaymentData: PaymentFormData = {
  reservationId: 0,
  amount: 0,
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'cash',
  status: 'paid',
  notes: '',
};

const paymentMethodOptions = [
  { value: 'cash', label: 'نقدًا' },
  { value: 'credit_card', label: 'بطاقة ائتمان' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'check', label: 'شيك' },
  { value: 'other', label: 'أخرى' },
];
const paymentStatusOptions = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'paid', label: 'مدفوعة' },
  { value: 'cancelled', label: 'ملغية' },
  { value: 'delayed', label: 'متأخرة' },
];

export default function PaymentForm({
  isEdit = false,
  initialData,
  preSelectedReservationId,
  onSuccess,
}: PaymentFormProps) {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [checkImage, setCheckImage] = useState<File | undefined>(undefined);

  // إعداد البيانات الأولية لوضع التعديل أو مع الحجز المحدد مسبقًا
  const formInitialData: PaymentFormData = isEdit && initialData
    ? {
      reservationId: initialData.reservationId,
      amount: initialData.amount,
      paymentDate: initialData.paymentDate.split('T')[0],
      paymentMethod: initialData.paymentMethod,
      status: initialData.status,
      notes: initialData.notes,
    }
    : {
      ...initialPaymentData,
      reservationId: preSelectedReservationId || 0,
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
  } = useForm<PaymentFormData, Payment>(
    async (data) => {
      if (isEdit && initialData) {
        return paymentsApi.update(initialData.id, data, checkImage);
      }
      return paymentsApi.create(data, checkImage);
    },
    formInitialData,
    {
      onSuccess: (data) => {
        const successMessage = isEdit
          ? 'تم تحديث المدفوعة بنجاح'
          : 'تم إنشاء المدفوعة بنجاح';
        toast.success(successMessage);

        if (onSuccess) {
          onSuccess(data);
        } else {
          router.push(`/dashboard/payments`);
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
    } else if (preSelectedReservationId) {
      updateFormData({ reservationId: preSelectedReservationId });
    }
  }, [isEdit, initialData, preSelectedReservationId, resetForm, updateFormData]);

  // جلب الحجوزات للقائمة المنسدلة
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setIsLoadingReservations(true);
        const response = await reservationsApi.getAll();

        if (response.success) {
          // تصفية الحجوزات النشطة فقط
          const activeReservations = response.data.filter(res => res.status === 'active');
          setReservations(activeReservations);

          // إذا كان لدينا preSelectedReservationId أو في وضع التعديل، ابحث عن الحجز المطابق
          if ((preSelectedReservationId || (isEdit && initialData)) && response.data.length > 0) {
            const id = preSelectedReservationId || (initialData?.reservationId || 0);
            const reservation = response.data.find(res => res.id === id);
            if (reservation) {
              setSelectedReservation(reservation);
              // إذا كانت مدفوعة جديدة، اضبط المبلغ الافتراضي على سعر الوحدة
              if (!isEdit && reservation.unit && reservation.unit.price) {
                updateFormData({ amount: reservation.unit.price });
              }
            }
          }
        } else {
          toast.error(response.message || 'فشل في تحميل الحجوزات');
        }
      } catch (error) {
        console.error('خطأ في جلب الحجوزات:', error);
        toast.error('حدث خطأ أثناء تحميل الحجوزات');
      } finally {
        setIsLoadingReservations(false);
      }
    };

    fetchReservations();
  }, [isEdit, initialData, preSelectedReservationId, updateFormData]);

  // التعامل مع تغيير الحجز
  const handleReservationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const reservationId = parseInt(e.target.value);
    updateFormData({ reservationId });

    // البحث عن الحجز المحدد
    const reservation = reservations.find(res => res.id === reservationId);
    setSelectedReservation(reservation || null);

    // تعيين المبلغ الافتراضي إلى سعر الوحدة إذا كان متاحًا
    if (reservation?.unit?.price) {
      updateFormData({ amount: reservation.unit.price });
    }
  };

  // إنشاء خيارات الحجز للقائمة المنسدلة
  const reservationOptions = reservations.map((reservation) => {
    const unitNumber = reservation.unit?.unitNumber || 'غير معروف';
    const tenantName = reservation.user?.fullName || 'غير معروف';
    return {
      value: reservation.id,
      label: `${unitNumber} - ${tenantName}`,
    };
  });

  // التعامل مع تغيير إدخال الملف
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCheckImage(e.target.files[0]);
    }
  };

  // تنسيق إدخال العملة
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // السماح فقط بالأرقام والنقطة العشرية
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      updateFormData({ amount: value === '' ? 0 : parseFloat(value) });
    }
  };

  return (
    <Card>
      <form onSubmit={(e) => handleSubmit(e, formData)} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* اختيار الحجز */}
        <div className="space-y-4">
          <Select
            label="الحجز"
            id="reservationId"
            name="reservationId"
            value={formData.reservationId.toString()}
            onChange={handleReservationChange}
            options={reservationOptions}
            disabled={isLoadingReservations || isEdit || !!preSelectedReservationId}
            required
            fullWidth
            helpText={isLoadingReservations ? 'جاري تحميل الحجوزات...' : 'اختر الحجز لهذه المدفوعة'}
            emptyOptionLabel="اختر حجزًا"
          />

          {selectedReservation && (
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">تفاصيل الحجز</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">الوحدة:</span>
                  <span className="mr-2 font-medium">{selectedReservation.unit?.unitNumber || 'غير متوفر'}</span>
                </div>
                <div>
                  <span className="text-gray-500">المستأجر:</span>
                  <span className="mr-2 font-medium">{selectedReservation.user?.fullName || 'غير متوفر'}</span>
                </div>
                <div>
                  <span className="text-gray-500">الفترة:</span>
                  <span className="mr-2">{new Date(selectedReservation.startDate).toLocaleDateString()} - {new Date(selectedReservation.endDate).toLocaleDateString()}</span>
                </div>
                {selectedReservation.unit?.price && (
                  <div>
                    <span className="text-gray-500">الإيجار الشهري:</span>
                    <span className="mr-2 font-medium">{formatCurrency(selectedReservation.unit.price)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* تفاصيل المدفوعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="المبلغ"
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount.toString()}
            onChange={handleAmountChange}
            required
            fullWidth
            leftIcon={<span className="text-gray-500">$</span>}
          />

          <Input
            label="تاريخ الدفع"
            id="paymentDate"
            name="paymentDate"
            type="date"
            value={formData.paymentDate}
            onChange={handleChange}
            required
            fullWidth
          />

          <Select
            label="طريقة الدفع"
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            options={paymentMethodOptions}
            required
            fullWidth
          />

          <Select
            label="الحالة"
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={paymentStatusOptions}
            required
            fullWidth
          />
        </div>

        {/* ملاحظات */}
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
            placeholder="معلومات إضافية حول هذه المدفوعة..."
          />
        </div>

        {/* صورة الشيك (تظهر فقط لطريقة دفع الشيك) */}
        {formData.paymentMethod === 'check' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              صورة الشيك {isEdit ? '(اختياري)' : '(مُوصى به)'}
            </label>
            <input
              type="file"
              id="checkImage"
              name="checkImage"
              onChange={handleFileChange}
              accept="image/*"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {initialData?.checkUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">صورة الشيك الحالية:</p>
                <a
                  href={initialData.checkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  عرض صورة الشيك الحالية
                </a>
              </div>
            )}
          </div>
        )}

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
            {isEdit ? 'تحديث المدفوعة' : 'إنشاء المدفوعة'}
          </Button>
        </div>
      </form>
    </Card>
  );
}