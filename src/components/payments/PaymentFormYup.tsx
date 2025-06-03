'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Controller } from 'react-hook-form';
import { Payment, Reservation } from '@/lib/types';
import { paymentsApi, reservationsApi } from '@/lib/api';
import { paymentSchema, PaymentFormData } from '@/lib/validations/schemas';
import { useAsyncForm, useFileForm } from '@/hooks/useYupForm';
import {
  FormInput,
  FormTextArea,
  FormSelect,
  FormFileInput
} from '@/components/ui/FormInputs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/constants';

interface PaymentFormYupProps {
  isEdit?: boolean;
  initialData?: Payment;
  preSelectedReservationId?: number;
  onSuccess?: (payment: Payment) => void;
}
const initialPaymentData: Partial<PaymentFormData> = {
  reservationId: 0,
  amount: 0,
  paymentDate: new Date().toISOString().split('T')[0] as any,
  paymentMethod: 'cash',
  status: 'paid',
  notes: '',
  checkNumber: '',
  bankName: '',
  transferReference: '',
  dueDate: null,
};

export default function PaymentForm({
  isEdit = false,
  initialData,
  preSelectedReservationId,
  onSuccess,
}: PaymentFormYupProps) {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);

  // Initialize form with validation schema
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    setFileValue,
    getFilePreview,
  } = useFileForm<PaymentFormData>(
    paymentSchema,
    isEdit && initialData ? {
      reservationId: initialData.reservationId,
      amount: initialData.amount,
      paymentDate: initialData.paymentDate.split('T')[0] as any,
      paymentMethod: initialData.paymentMethod,
      status: initialData.status,
      notes: initialData.notes || '',
      checkNumber: (initialData as any).checkNumber || '',
      bankName: (initialData as any).bankName || '',
      checkDate: (initialData as any).checkDate ? (initialData as any).checkDate.split('T')[0] : null,
      transferReference: (initialData as any).transferReference || '',
      lateFee: (initialData as any).lateFee || null,
      dueDate: (initialData as any).dueDate ? (initialData as any).dueDate.split('T')[0] : null,
    } : preSelectedReservationId ? {
      ...initialPaymentData,
      reservationId: preSelectedReservationId,
    } : initialPaymentData
  );

  // Watch payment method to show conditional fields
  const watchedPaymentMethod = watch('paymentMethod');
  const watchedStatus = watch('status');
  const watchedCheckImage = watch('checkImage');
  const watchedReceiptImage = watch('receiptImage');

  // Load reservations on component mount
  useEffect(() => {
    const loadReservations = async () => {
      try {
        const response = await reservationsApi.getAll();
        if (response.success) {
          // Filter active reservations only
          const activeReservations = response.data.filter(
            (reservation: Reservation) => reservation.status === 'active'
          );
          setReservations(activeReservations);
        } else {
          toast.error('فشل في تحميل قائمة المستأجرين ');
        }
      } catch (error) {
        console.error('Error loading reservations:', error);
        toast.error('حدث خطأ في تحميل المستأجرين ');
      } finally {
        setLoadingReservations(false);
      }
    };

    loadReservations();
  }, []);

  // Reset form when editing data changes
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        reservationId: initialData.reservationId,
        amount: initialData.amount,
        paymentDate: initialData.paymentDate.split('T')[0] as any,
        paymentMethod: initialData.paymentMethod,
        status: initialData.status,
        notes: initialData.notes || '',
        checkNumber: (initialData as any).checkNumber || '',
        bankName: (initialData as any).bankName || '',
        checkDate: (initialData as any).checkDate ? (initialData as any).checkDate.split('T')[0] : null,
        transferReference: (initialData as any).transferReference || '',
        lateFee: (initialData as any).lateFee || null,
        dueDate: (initialData as any).dueDate ? (initialData as any).dueDate.split('T')[0] : null,
      });
    } else if (preSelectedReservationId) {
      reset({
        ...initialPaymentData,
        reservationId: preSelectedReservationId,
      });
    }
  }, [isEdit, initialData, preSelectedReservationId, reset]);

  // Clear conditional fields when payment method changes
  useEffect(() => {
    if (watchedPaymentMethod !== 'check') {
      setValue('checkNumber', '');
      setValue('checkDate', null);
      setValue('checkImage', null);
    }
    if (!['check', 'bank_transfer'].includes(watchedPaymentMethod)) {
      setValue('bankName', '');
    }
    if (watchedPaymentMethod !== 'bank_transfer') {
      setValue('transferReference', '');
    }
  }, [watchedPaymentMethod, setValue]);

  // Clear status-dependent fields when status changes
  useEffect(() => {
    if (watchedStatus !== 'delayed') {
      setValue('lateFee', null);
    }
    if (!['pending', 'delayed'].includes(watchedStatus)) {
      setValue('dueDate', null);
    }
  }, [watchedStatus, setValue]);

  // Form submission handler
  const onSubmit = async (data: PaymentFormData) => {
    try {
      let response;

      if (isEdit && initialData) {
        response = await paymentsApi.update(initialData.id, data);
      } else {
        response = await paymentsApi.create(data);
      }

      if (response.success) {
        const successMessage = isEdit
          ? 'تم تحديث الدفعة بنجاح'
          : 'تم إنشاء الدفعة بنجاح';
        toast.success(successMessage);

        if (onSuccess) {
          onSuccess(response.data);
        } else {
          router.push(`/dashboard/payments/${response.data.id}`);
        }
      } else {
        toast.error(response.message || 'حدث خطأ ما');
      }
    } catch (error: any) {
      console.error('Payment form submission error:', error);
      toast.error(error.message || 'حدث خطأ في الإرسال');
      throw error;
    }
  };

  // Handle file changes
  const handleFileChange = (fieldName: keyof PaymentFormData) => (files: FileList | null) => {
    const file = files?.[0] || null;
    setFileValue(fieldName, file);
  };

  // Prepare reservation options
  const reservationOptions = reservations.map(reservation => ({
    value: reservation.id.toString(),
    label: `${reservation.user?.fullName} - ${reservation.unit?.unitNumber} (${reservation.unit?.building?.name})`,
  }));

  // Format current date for input
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Payment Information Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900">معلومات الدفعة الأساسية</h3>
            <p className="text-sm text-gray-500 mt-1">يرجى إدخال المعلومات الأساسية للدفعة</p>
          </div>

          <FormSelect
            label="الحجز"
            register={register}
            name="reservationId"
            error={errors.reservationId}
            options={reservationOptions}
            required
            placeholder={loadingReservations ? "جاري التحميل..." : "اختر الحجز"}
            disabled={loadingReservations || isEdit}
            helpText={loadingReservations ? 'جاري تحميل المستأجرين ...' : 'اختر الحجز المراد الدفع له'}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="المبلغ"
              register={register}
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              error={errors.amount}
              required
              helpText="المبلغ المدفوع بالريال السعودي"
              startIcon={<span className="text-gray-500">OMR</span>}
            />

            <FormInput
              label="تاريخ الدفع"
              register={register}
              name="paymentDate"
              type="date"
              max={getCurrentDate()}
              error={errors.paymentDate}
              required
              helpText="تاريخ تنفيذ الدفعة"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              label="طريقة الدفع"
              register={register}
              name="paymentMethod"
              error={errors.paymentMethod}
              options={PAYMENT_METHOD_OPTIONS}
              required
              placeholder="اختر طريقة الدفع"
            />

            <FormSelect
              label="حالة الدفعة"
              register={register}
              name="status"
              error={errors.status}
              options={PAYMENT_STATUS_OPTIONS}
              required
              placeholder="اختر حالة الدفعة"
            />
          </div>
        </div>

        {/* Conditional Fields Based on Payment Method */}
        {(watchedPaymentMethod === 'check' || watchedPaymentMethod === 'bank_transfer') && (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {watchedPaymentMethod === 'check' ? 'تفاصيل الشيك' : 'تفاصيل التحويل البنكي'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {watchedPaymentMethod === 'check'
                  ? 'معلومات الشيك المستلم'
                  : 'معلومات التحويل البنكي'}
              </p>
            </div>


            {watchedPaymentMethod === 'check' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="رقم الشيك"
                  register={register}
                  name="checkNumber"
                  error={errors.checkNumber}
                  required
                  helpText="رقم الشيك كما هو مكتوب"
                />

                <FormInput
                  label="تاريخ الشيك"
                  register={register}
                  name="checkDate"
                  type="date"
                  min={getCurrentDate()}
                  error={errors.checkDate}
                  required
                  helpText="تاريخ استحقاق الشيك"
                />
              </div>
            )}

            {watchedPaymentMethod === 'bank_transfer' && (
              <FormInput
                label="رقم المرجع"
                register={register}
                name="transferReference"
                error={errors.transferReference}
                required
                helpText="رقم المرجع أو التحويل"
              />
            )}
          </div>
        )}

        {/* Status-dependent Fields */}
        {(watchedStatus === 'delayed' || watchedStatus === 'pending') && (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">تفاصيل إضافية</h3>
              <p className="text-sm text-gray-500 mt-1">معلومات خاصة بحالة الدفعة</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {watchedStatus === 'delayed' && (
                <FormInput
                  label="رسوم التأخير"
                  register={register}
                  name="lateFee"
                  type="number"
                  min="0"
                  step="0.01"
                  error={errors.lateFee}
                  helpText="رسوم التأخير المطبقة (اختياري)"
                  startIcon={<span className="text-gray-500">OMR</span>}
                />
              )}

              {['pending', 'delayed'].includes(watchedStatus) && (
                <FormInput
                  label="تاريخ الاستحقاق"
                  register={register}
                  name="dueDate"
                  type="date"
                  min={getCurrentDate()}
                  error={errors.dueDate}
                  required
                  helpText="تاريخ استحقاق الدفعة"
                />
              )}
            </div>
          </div>
        )}

        {/* File Attachments Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900">المرفقات</h3>
            <p className="text-sm text-gray-500 mt-1">صور الوثائق والإيصالات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {watchedPaymentMethod === 'check' && (
              <Controller
                name="checkImage"
                control={control}
                render={({ field, fieldState }) => (
                  <FormFileInput
                    label="صورة الشيك"
                    name="checkImage"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange('checkImage')}
                    error={fieldState.error}
                    helpText="صورة واضحة للشيك (JPEG, PNG)"
                    required
                    currentFile={isEdit ? (initialData as any)?.checkImageUrl : undefined}
                    selectedFile={watchedCheckImage}
                  />
                )}
              />
            )}

            <Controller
              name="receiptImage"
              control={control}
              render={({ field, fieldState }) => (
                <FormFileInput
                  label="صورة الإيصال"
                  name="receiptImage"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange('receiptImage')}
                  error={fieldState.error}
                  helpText="صورة إيصال الدفع (اختياري)"
                  currentFile={isEdit ? (initialData as any)?.receiptImageUrl : undefined}
                  selectedFile={watchedReceiptImage}
                />
              )}
            />
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900">معلومات إضافية</h3>
            <p className="text-sm text-gray-500 mt-1">ملاحظات وتفاصيل إضافية</p>
          </div>

          <FormTextArea
            label="ملاحظات"
            register={register}
            name="notes"
            rows={4}
            error={errors.notes}
            helpText="أي ملاحظات إضافية حول الدفعة (اختياري)"
          />
        </div>

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
            disabled={isSubmitting || loadingReservations}
          >
            {isEdit ? 'تحديث الدفعة' : 'إنشاء الدفعة'}
          </Button>
        </div>
      </form>
    </Card>
  );
}