'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Controller } from 'react-hook-form';
import { Reservation, User, RealEstateUnit } from '@/lib/types';
import { reservationsApi, unitsApi, usersApi } from '@/lib/api';
import { reservationSchema, ReservationFormData } from '@/lib/validations/schemas';
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
import {
  CONTRACT_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_SCHEDULE_OPTIONS,
  TENANT_TYPE_OPTIONS
} from '@/constants';

interface NewUserCredentials {
  id: number;
  username: string;
  copassword: string;
  fullName: string;
  email: string;
}

interface ReservationFormProps {
  isEdit?: boolean;
  initialData?: Reservation;
  preSelectedUnitId?: number;
  preSelectedUserId?: number;
  onSuccess?: (reservation: Reservation) => void;
}

const initialReservationData: Partial<ReservationFormData> = {
  userId: undefined,
  unitId: 0,
  contractType: 'residential',
  startDate: new Date().toISOString().split('T')[0] as any,
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] as any,
  paymentMethod: 'cash',
  paymentSchedule: 'monthly',
  includesDeposit: false,
  depositAmount: undefined,
  notes: '',
  // New tenant fields
  tenantFullName: '',
  tenantEmail: '',
  tenantPhone: '',
  tenantWhatsappNumber: '',
  tenantIdNumber: '',
  tenantType: 'person',
  tenantBusinessActivities: '',
  tenantContactPerson: '',
  tenantContactPosition: '',
  tenantNotes: '',
};

export default function ReservationForm({
  isEdit = false,
  initialData,
  preSelectedUnitId,
  preSelectedUserId,
  onSuccess,
}: ReservationFormProps) {
  const router = useRouter();
  const [units, setUnits] = useState<RealEstateUnit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [createNewTenant, setCreateNewTenant] = useState(!preSelectedUserId);
  const [newUserCredentials, setNewUserCredentials] = useState<NewUserCredentials | null>(null);
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
    setFileValue,
  } = useFileForm<ReservationFormData>(
    reservationSchema,
    isEdit && initialData ? {
      userId: initialData.userId,
      unitId: initialData.unitId,
      contractType: initialData.contractType,
      startDate: initialData.startDate.split('T')[0] as any,
      endDate: initialData.endDate.split('T')[0] as any,
      paymentMethod: initialData.paymentMethod,
      paymentSchedule: initialData.paymentSchedule,
      includesDeposit: initialData.includesDeposit,
      depositAmount: initialData.depositAmount || undefined,
      notes: initialData.notes || '',
      // Clear new tenant fields for edit mode
      tenantFullName: '',
      tenantEmail: '',
      tenantPhone: '',
      tenantWhatsappNumber: '',
      tenantIdNumber: '',
      tenantType: 'person',
      tenantBusinessActivities: '',
      tenantContactPerson: '',
      tenantContactPosition: '',
      tenantNotes: '',
    } : preSelectedUnitId || preSelectedUserId ? {
      ...initialReservationData,
      unitId: preSelectedUnitId || 0,
      userId: preSelectedUserId,
    } : initialReservationData,
    { createNewTenant } // Context for conditional validation
  );

  // Watch fields for conditional logic
  const watchedIncludesDeposit = watch('includesDeposit');
  const watchedTenantType = watch('tenantType');
  const watchedStartDate = watch('startDate');
  const watchedContractImage = watch('contractImage');
  const watchedContractPdf = watch('contractPdf');
  const watchedIdentityImageFront = watch('identityImageFront');
  const watchedIdentityImageBack = watch('identityImageBack');
  const watchedCommercialRegisterImage = watch('commercialRegisterImage');

  // Load units on component mount
  useEffect(() => {
    const loadUnits = async () => {
      try {
        setLoadingUnits(true);
        const response = isEdit
          ? await unitsApi.getAll()
          : await unitsApi.getAvailable();

        if (response.success) {
          setUnits(response.data);
        } else {
          toast.error('فشل في تحميل قائمة الوحدات');
        }
      } catch (error) {
        console.error('Error loading units:', error);
        toast.error('حدث خطأ في تحميل الوحدات');
      } finally {
        setLoadingUnits(false);
      }
    };

    loadUnits();
  }, [isEdit]);

  // Load users when existing tenant option is selected
  useEffect(() => {
    if (!createNewTenant && !isEdit) {
      const loadUsers = async () => {
        try {
          setLoadingUsers(true);
          const response = await usersApi.getAll();

          if (response.success) {
            // Filter only tenant users
            const tenantUsers = response.data.filter(user => user.role === 'tenant');
            setUsers(tenantUsers);
          } else {
            toast.error('فشل في تحميل قائمة المستأجرين');
          }
        } catch (error) {
          console.error('Error loading users:', error);
          toast.error('حدث خطأ في تحميل المستأجرين');
        } finally {
          setLoadingUsers(false);
        }
      };

      loadUsers();
    }
  }, [createNewTenant, isEdit]);

  // Reset form when editing data changes
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        userId: initialData.userId,
        unitId: initialData.unitId,
        contractType: initialData.contractType,
        startDate: initialData.startDate.split('T')[0] as any,
        endDate: initialData.endDate.split('T')[0] as any,
        paymentMethod: initialData.paymentMethod,
        paymentSchedule: initialData.paymentSchedule,
        includesDeposit: initialData.includesDeposit,
        depositAmount: initialData.depositAmount || undefined,
        notes: initialData.notes || '',
        // Clear new tenant fields for edit mode
        tenantFullName: '',
        tenantEmail: '',
        tenantPhone: '',
        tenantWhatsappNumber: '',
        tenantIdNumber: '',
        tenantType: 'person',
        tenantBusinessActivities: '',
        tenantContactPerson: '',
        tenantContactPosition: '',
        tenantNotes: '',
      });
    }
  }, [isEdit, initialData, reset]);



  // Clear deposit amount when deposit is disabled
  useEffect(() => {
    if (!watchedIncludesDeposit) {
      setValue('depositAmount', undefined);
    }
  }, [watchedIncludesDeposit, setValue]);

  // Update end date to be at least one year from start date
  useEffect(() => {
    if (watchedStartDate) {
      const startDate = new Date(watchedStartDate);
      const minEndDate = new Date(startDate);
      minEndDate.setFullYear(startDate.getFullYear() + 1);

      const currentEndDate = watch('endDate');
      if (!currentEndDate || new Date(currentEndDate) < minEndDate) {
        setValue('endDate', minEndDate.toISOString().split('T')[0] as any);
      }
    }
  }, [watchedStartDate, setValue, watch]);

  // Form submission handler
  const onSubmit = async (data: ReservationFormData) => {
    try {
      let response;

      if (isEdit && initialData) {
        response = await reservationsApi.update(initialData.id, data);
      } else {
        response = await reservationsApi.create(data);
      }

      if (response.success) {
        const successMessage = isEdit
          ? 'تم تحديث الحجز بنجاح'
          : 'تم إنشاء الحجز بنجاح';
        toast.success(successMessage);

        // Handle new user credentials if available
        if (!isEdit && response.data.tenant.user) {
          setNewUserCredentials(response.data.tenant.user);
          setShowCredentialsModal(true);
        } else {
          if (onSuccess) {
            onSuccess(response.data.reservation || response.data);
          } else {
            router.push(`/dashboard/reservations/${(response.data.reservation || response.data).id}`);
          }
        }
      } else {
        toast.error(response.message || 'حدث خطأ ما');
      }
    } catch (error: any) {
      console.error('Reservation form submission error:', error);
      toast.error(error.message || 'حدث خطأ في الإرسال');
      throw error;
    }
  };

  // Handle file changes
  const handleFileChange = (fieldName: keyof ReservationFormData) => (files: FileList | null) => {
    const file = files?.[0] || null;
    setFileValue(fieldName, file);
  };
  // Handle modal close and navigation
  const handleCredentialsModalClose = () => {
    setShowCredentialsModal(false);
    if (newUserCredentials) {
      if (onSuccess) {
        // Navigate with the reservation data
        onSuccess({ id: newUserCredentials.id } as Reservation);
      } else {
        router.push('/dashboard/reservations');
      }
    }
  };

  // Copy credentials to clipboard
  const copyCredentials = () => {
    if (!newUserCredentials) return;

    const credentials = `
اسم المستخدم: ${newUserCredentials.username}
كلمة المرور: ${newUserCredentials.copassword}
الاسم الكامل: ${newUserCredentials.fullName}
البريد الإلكتروني: ${newUserCredentials.email}
    `;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(credentials.trim())
        .then(() => toast.success('تم نسخ بيانات اعتماد المستأجر إلى الحافظة!'))
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
        toast.success('تم نسخ بيانات اعتماد المستأجر إلى الحافظة!');
      } catch (err) {
        toast.error('فشل نسخ بيانات الاعتماد');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  // Prepare options for dropdowns
  const unitOptions = units.map((unit) => ({
    value: unit.id.toString(),
    label: `${unit.unitNumber} - ${unit.building?.name || 'مبنى غير معروف'} (${unit.status === 'available' ? 'متاح' : unit.status})`,
  }));

  const userOptions = users.map((user) => ({
    value: user.id.toString(),
    label: `${user.fullName} (${user.email})`,
  }));

  // Get current date for date inputs
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get minimum end date (one year from start date)
  const getMinEndDate = () => {
    if (watchedStartDate) {
      const startDate = new Date(watchedStartDate);
      const minEndDate = new Date(startDate);
      minEndDate.setFullYear(startDate.getFullYear() + 1);
      return minEndDate.toISOString().split('T')[0];
    }
    return getCurrentDate();
  };

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Unit and Contract Information Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">معلومات الوحدة والعقد</h3>
              <p className="text-sm text-gray-500 mt-1">يرجى تحديد الوحدة وتفاصيل العقد</p>
            </div>

            <FormSelect
              label="وحدة العقار"
              register={register}
              name="unitId"
              value={preSelectedUnitId}
              error={errors.unitId}
              options={unitOptions}
              required
              placeholder={loadingUnits ? "جاري التحميل..." : "اختر الوحدة"}
              disabled={loadingUnits || isEdit || !!preSelectedUnitId}
              helpText={loadingUnits ? 'جاري تحميل الوحدات...' : 'اختر الوحدة لهذا الحجز'}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormSelect
                label="نوع العقد"
                register={register}
                name="contractType"
                error={errors.contractType}
                options={CONTRACT_TYPE_OPTIONS}
                required
                placeholder="اختر نوع العقد"
              />

              <FormInput
                label="تاريخ بداية العقد"
                register={register}
                name="startDate"
                type="date"
                min={getCurrentDate()}
                error={errors.startDate}
                required
                helpText="تاريخ بدء سريان العقد"
              />
            </div>

            <FormInput
              label="تاريخ نهاية العقد"
              register={register}
              name="endDate"
              type="date"
              min={getMinEndDate()}
              error={errors.endDate}
              required
              helpText="تاريخ انتهاء العقد (الحد الأدنى سنة واحدة)"
            />
          </div>

          {/* Payment Information Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">معلومات الدفع</h3>
              <p className="text-sm text-gray-500 mt-1">تفاصيل طريقة الدفع والجدول الزمني</p>
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
                label="جدول الدفع"
                register={register}
                name="paymentSchedule"
                error={errors.paymentSchedule}
                options={PAYMENT_SCHEDULE_OPTIONS}
                required
                placeholder="اختر جدول الدفع"
              />
            </div>

            {/* Deposit Section */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('includesDeposit')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="mr-2 block text-sm text-gray-700">
                  يتضمن مبلغ تأمين
                </label>
              </div>

              {watchedIncludesDeposit && (
                <FormInput
                  label="مبلغ التأمين"
                  register={register}
                  name="depositAmount"
                  type="number"
                  min="0"
                  step="0"
                  error={errors.depositAmount}
                  required={watchedIncludesDeposit}
                  helpText="مبلغ التأمين المطلوب"
                  startIcon={<span className="text-gray-500">ر.س</span>}
                />
              )}
            </div>
          </div>

          {/* Tenant Information Section - Only for new reservations */}
          {!isEdit && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900">معلومات المستأجر</h3>
                <p className="text-sm text-gray-500 mt-1">اختيار المستأجر أو إنشاء حساب جديد</p>
              </div>

              {/* Tenant Selection Options */}




              {/* New Tenant Form */}

              <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-900">بيانات المستأجر الجديد</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormSelect
                    label="نوع المستأجر"
                    register={register}
                    name="tenantType"
                    error={errors.tenantType}
                    options={TENANT_TYPE_OPTIONS}
                    required={createNewTenant}
                    placeholder="اختر نوع المستأجر"
                  />

                  <FormInput
                    label="الاسم الكامل"
                    register={register}
                    name="tenantFullName"
                    error={errors.tenantFullName}
                    required={createNewTenant}
                    helpText="الاسم الكامل للمستأجر"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="البريد الإلكتروني"
                    register={register}
                    name="tenantEmail"
                    type="email"
                    error={errors.tenantEmail}
                    required={createNewTenant}
                    helpText="البريد الإلكتروني للمستأجر"
                  />

                  <FormInput
                    label="رقم الهاتف"
                    register={register}
                    name="tenantPhone"
                    type="tel"
                    error={errors.tenantPhone}
                    required={createNewTenant}
                    helpText="رقم الهاتف الأساسي"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label="رقم واتساب"
                    register={register}
                    name="tenantWhatsappNumber"
                    type="tel"
                    error={errors.tenantWhatsappNumber}
                    helpText="رقم الواتساب (اختياري)"
                  />

                  <FormInput
                    label="رقم الهوية"
                    register={register}
                    type="number"
                    name="tenantIdNumber"
                    error={errors.tenantIdNumber}
                    required={createNewTenant}
                    helpText="رقم الهوية الوطنية (10 أرقام)"
                  />
                </div>{/* Business Activity Fields for Commercial Tenants */}
                {watchedTenantType && ['commercial_register', 'partnership', 'foreign_company'].includes(watchedTenantType) && (
                  <FormTextArea
                    label="الأنشطة التجارية"
                    register={register}
                    name="tenantBusinessActivities"
                    error={errors.tenantBusinessActivities}
                    required={['commercial_register', 'partnership', 'foreign_company'].includes(watchedTenantType)}
                    rows={3}
                    helpText="وصف الأنشطة التجارية للمستأجر"
                  />
                )}

                {/* Contact Person Fields for Non-Individual Tenants */}
                {watchedTenantType && !['person'].includes(watchedTenantType) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="اسم الشخص المسؤول"
                      register={register}
                      name="tenantContactPerson"
                      error={errors.tenantContactPerson}
                      required={!['person'].includes(watchedTenantType)}
                      helpText="اسم الشخص المسؤول عن التواصل"
                    />

                    <FormInput
                      label="منصب الشخص المسؤول"
                      register={register}
                      name="tenantContactPosition"
                      error={errors.tenantContactPosition}
                      required={!['person'].includes(watchedTenantType)}
                      helpText="المنصب أو الوظيفة"
                    />
                  </div>
                )}

                <FormTextArea
                  label="ملاحظات عن المستأجر"
                  register={register}
                  name="tenantNotes"
                  error={errors.tenantNotes}
                  rows={3}
                  helpText="أي معلومات إضافية عن المستأجر (اختياري)"
                />
              </div>

            </div>
          )}

          {/* Documents Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">الوثائق والمرفقات</h3>
              <p className="text-sm text-gray-500 mt-1">رفع وثائق العقد والهوية</p>
            </div>

            {/* Contract Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="contractImage"
                control={control}
                render={({ field, fieldState }) => (
                  <FormFileInput
                    label="صورة العقد"
                    name="contractImage"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange('contractImage')}
                    error={fieldState.error}
                    helpText="صورة واضحة للعقد (JPEG, PNG)"
                    currentFile={isEdit ? initialData?.contractImageUrl : undefined}
                    selectedFile={watchedContractImage}
                  />
                )}
              />

              <Controller
                name="contractPdf"
                control={control}
                render={({ field, fieldState }) => (
                  <FormFileInput
                    label="ملف PDF للعقد"
                    name="contractPdf"
                    accept="application/pdf"
                    onChange={handleFileChange('contractPdf')}
                    error={fieldState.error}
                    helpText="ملف PDF للعقد (اختياري)"
                    currentFile={isEdit ? initialData?.contractPdfUrl : undefined}
                    selectedFile={watchedContractPdf}
                  />
                )}
              />
            </div>

            {/* Tenant Identity Documents - Only for new tenants */}
            {createNewTenant && !isEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  name="identityImageFront"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFileInput
                      label="صورة الهوية (الوجه الأمامي)"
                      name="identityImageFront"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleFileChange('identityImageFront')}
                      error={fieldState.error}
                      helpText="صورة واضحة للوجه الأمامي للهوية"
                      required={createNewTenant}
                      selectedFile={watchedIdentityImageFront}
                    />
                  )}
                />

                <Controller
                  name="identityImageBack"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormFileInput
                      label="صورة الهوية (الوجه الخلفي)"
                      name="identityImageBack"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleFileChange('identityImageBack')}
                      error={fieldState.error}
                      helpText="صورة واضحة للوجه الخلفي للهوية"
                      required={createNewTenant}
                      selectedFile={watchedIdentityImageBack}
                    />
                  )}
                />

                {/* Commercial Register for Business Tenants */}
                {watchedTenantType && ['commercial_register', 'partnership', 'foreign_company'].includes(watchedTenantType) && (
                  <div className="md:col-span-2">
                    <Controller
                      name="commercialRegisterImage"
                      control={control}
                      render={({ field, fieldState }) => (
                        <FormFileInput
                          label="صورة السجل التجاري"
                          name="commercialRegisterImage"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleFileChange('commercialRegisterImage')}
                          error={fieldState.error}
                          helpText="صورة السجل التجاري (مطلوب لهذا النوع من المستأجرين)"
                          required={['commercial_register', 'partnership', 'foreign_company'].includes(watchedTenantType)}
                          selectedFile={watchedCommercialRegisterImage}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional Information Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">معلومات إضافية</h3>
              <p className="text-sm text-gray-500 mt-1">ملاحظات وتفاصيل إضافية</p>
            </div>

            <FormTextArea
              label="ملاحظات عن الحجز"
              register={register}
              name="notes"
              error={errors.notes}
              rows={4}
              helpText="أي معلومات إضافية حول هذا الحجز (اختياري)"
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
              disabled={isSubmitting || loadingUnits || (loadingUsers && !createNewTenant)}
            >
              {isEdit ? 'تحديث الحجز' : 'إنشاء الحجز'}
            </Button>
          </div>
        </form>
      </Card>

      {/* New User Credentials Modal */}
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
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">الاسم الكامل:</span>
                    <span className="text-base text-blue-800">{newUserCredentials.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">البريد الإلكتروني:</span>
                    <span className="text-base text-blue-800">{newUserCredentials.email}</span>
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
                          <li>تأكد من حفظها في مكان آمن ومشاركتها مع المستأجر</li>
                          <li>يجب على المستأجر تغيير كلمة المرور بعد أول تسجيل دخول</li>
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