'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { 
  Reservation, 
  ReservationFormData, 
  RealEstateUnit, 
  User 
} from '@/lib/types';
import { reservationsApi, unitsApi, usersApi } from '@/lib/api';
import { 
  validateReservationForm,
  CONTRACT_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_SCHEDULE_OPTIONS,
  TENANT_TYPE_OPTIONS,
  FILE_TYPES 
} from '@/lib/validations';
import { 
  FormSection, 
  ValidationSummary, 
  FormActions 
} from '@/components/ui/FormValidation';
import { 
  Input, 
  Select, 
  FileInput,
  TextArea,
  Checkbox,
  RadioGroup 
} from '@/components/ui/FormInput';
import { useValidatedForm, useFileUpload } from '@/hooks/useValidatedForm';
import Card from '@/components/ui/Card';

interface ReservationFormProps {
  isEdit?: boolean;
  initialData?: Reservation;
  onSuccess?: (reservation: Reservation) => void;
}

const initialReservationData: ReservationFormData = {
  userId: undefined,
  unitId: 0,
  contractType: 'residential',
  startDate: '',
  endDate: '',
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
  onSuccess,
}: ReservationFormProps) {
  const router = useRouter();
  const [availableUnits, setAvailableUnits] = useState<RealEstateUnit[]>([]);
  const [existingTenants, setExistingTenants] = useState<User[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [isCreatingNewTenant, setIsCreatingNewTenant] = useState(false);

  // Form management
  const {
    formData,
    errors,
    isSubmitting,
    hasErrors,
    handleInputChange,
    updateField,
    setFormData,
    submitForm,
    clearErrors,
  } = useValidatedForm(
    initialReservationData,
    validateReservationForm,
    {
      onSuccess: (data) => {
        if (onSuccess) {
          onSuccess(data);
        } else {
          router.push(`/dashboard/reservations/${data.id}`);
        }
      },
      showSuccessToast: true,
      showErrorToast: true,
    }
  );

  // File management
  const {
    updateFile,
    getFile,
    fileErrors,
    clearFileErrors,
  } = useFileUpload();

  // Load available units and existing tenants
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load available units
        const unitsResponse = await unitsApi.getAvailable();
        if (unitsResponse.success) {
          setAvailableUnits(unitsResponse.data);
        }

        // Load existing tenants
        const usersResponse = await usersApi.getAll();
        if (usersResponse.success) {
          const tenants = usersResponse.data.filter(user => user.role === 'tenant');
          setExistingTenants(tenants);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('حدث خطأ في تحميل البيانات');
      } finally {
        setLoadingUnits(false);
        setLoadingTenants(false);
      }
    };

    loadData();
  }, []);

  // Initialize form data for edit mode
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        userId: initialData.userId,
        unitId: initialData.unitId,
        contractType: initialData.contractType,
        startDate: initialData.startDate.split('T')[0], // Format for date input
        endDate: initialData.endDate.split('T')[0],
        paymentMethod: initialData.paymentMethod,
        paymentSchedule: initialData.paymentSchedule,
        includesDeposit: initialData.includesDeposit,
        depositAmount: initialData.depositAmount,
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
  }, [isEdit, initialData, setFormData]);

  // Handle tenant selection change
  const handleTenantChange = (value: string) => {
    const isNewTenant = value === 'new' || value === '';
    setIsCreatingNewTenant(isNewTenant);
    
    if (isNewTenant) {
      updateField('userId', undefined);
    } else {
      updateField('userId', parseInt(value, 10));
      // Clear new tenant fields when selecting existing tenant
      updateField('tenantFullName', '');
      updateField('tenantEmail', '');
      updateField('tenantPhone', '');
      updateField('tenantWhatsappNumber', '');
      updateField('tenantIdNumber', '');
      updateField('tenantType', 'person');
    }
  };

  // Handle file uploads
  const handleFileChange = (fieldName: string) => (files: FileList | null) => {
    updateFile(fieldName, files);
  };

  // Form submission
  const handleSubmit = async () => {
    clearErrors();
    clearFileErrors();

    // Prepare form data with files
    const submitData: ReservationFormData = {
      ...formData,
      contractImage: getFile('contractImage') || undefined,
      contractPdf: getFile('contractPdf') || undefined,
      identityImageFront: getFile('identityImageFront') || undefined,
      identityImageBack: getFile('identityImageBack') || undefined,
      commercialRegisterImage: getFile('commercialRegisterImage') || undefined,
    };

    await submitForm(async (data) => {
      if (isEdit && initialData) {
        return reservationsApi.update(initialData.id, data);
      } else {
        return reservationsApi.create(data);
      }
    });
  };

  // Prepare options for dropdowns
  const unitOptions = availableUnits.map(unit => ({
    value: unit.id.toString(),
    label: `${unit.building?.name} - وحدة ${unit.unitNumber} (${unit.unitType})`,
  }));

  const tenantOptions = [
    { value: 'new', label: 'إنشاء مستأجر جديد' },
    ...existingTenants.map(tenant => ({
      value: tenant.id.toString(),
      label: `${tenant.fullName} (${tenant.email})`,
    })),
  ];

  return (
    <Card>
      <div className="space-y-8">
        {/* Validation Summary */}
        {hasErrors && (
          <ValidationSummary errors={errors} />
        )}

        {/* Unit Selection */}
        <FormSection 
          title="اختيار الوحدة"
          description="اختر الوحدة المراد حجزها"
        >
          <Select
            label="الوحدة"
            name="unitId"
            value={formData.unitId.toString()}
            onChange={handleInputChange}
            options={unitOptions}
            error={errors.unitId}
            required
            placeholder={loadingUnits ? "جاري التحميل..." : "اختر الوحدة"}
            disabled={loadingUnits}
          />
        </FormSection>

        {/* Tenant Selection */}
        <FormSection 
          title="اختيار المستأجر"
          description="اختر مستأجر موجود أو أنشئ مستأجر جديد"
        >
          <Select
            label="المستأجر"
            name="tenantSelection"
            value={isCreatingNewTenant ? 'new' : (formData.userId?.toString() || 'new')}
            onChange={(e) => handleTenantChange(e.target.value)}
            options={tenantOptions}
            error={errors.userId}
            required={!isCreatingNewTenant}
            placeholder={loadingTenants ? "جاري التحميل..." : "اختر المستأجر"}
            disabled={loadingTenants}
          />

          {/* New Tenant Fields */}
          {isCreatingNewTenant && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-4">معلومات المستأجر الجديد</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="الاسم الكامل"
                  name="tenantFullName"
                  value={formData.tenantFullName || ''}
                  onChange={handleInputChange}
                  error={errors.tenantFullName}
                  required
                />

                <Input
                  label="البريد الإلكتروني"
                  name="tenantEmail"
                  type="email"
                  value={formData.tenantEmail || ''}
                  onChange={handleInputChange}
                  error={errors.tenantEmail}
                  required
                />

                <Input
                  label="رقم الهاتف"
                  name="tenantPhone"
                  type="tel"
                  value={formData.tenantPhone || ''}
                  onChange={handleInputChange}
                  error={errors.tenantPhone}
                  required
                />

                <Input
                  label="رقم الواتساب"
                  name="tenantWhatsappNumber"
                  type="tel"
                  value={formData.tenantWhatsappNumber || ''}
                  onChange={handleInputChange}
                  error={errors.tenantWhatsappNumber}
                  required
                />

                <Input
                  label="رقم الهوية"
                  name="tenantIdNumber"
                  value={formData.tenantIdNumber || ''}
                  onChange={handleInputChange}
                  error={errors.tenantIdNumber}
                  required
                  helpText="8 أرقام لرقم الهوية العماني"
                />

                <Select
                  label="نوع المستأجر"
                  name="tenantType"
                  value={formData.tenantType || 'person'}
                  onChange={handleInputChange}
                  options={TENANT_TYPE_OPTIONS}
                  error={errors.tenantType}
                  required
                />

                {/* Conditional fields for business types */}
                {formData.tenantType && ['partnership', 'commercial_register', 'foreign_company'].includes(formData.tenantType) && (
                  <>
                    <Input
                      label="الأنشطة التجارية"
                      name="tenantBusinessActivities"
                      value={formData.tenantBusinessActivities || ''}
                      onChange={handleInputChange}
                      error={errors.tenantBusinessActivities}
                    />

                    <Input
                      label="الشخص المسؤول"
                      name="tenantContactPerson"
                      value={formData.tenantContactPerson || ''}
                      onChange={handleInputChange}
                      error={errors.tenantContactPerson}
                    />

                    <Input
                      label="منصب الشخص المسؤول"
                      name="tenantContactPosition"
                      value={formData.tenantContactPosition || ''}
                      onChange={handleInputChange}
                      error={errors.tenantContactPosition}
                    />
                  </>
                )}
              </div>

              {/* Document uploads for new tenant */}
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-900 mb-4">وثائق المستأجر</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileInput
                    label="صورة الهوية (الوجه الأمامي)"
                    accept={FILE_TYPES.IMAGES.join(',')}
                    onChange={handleFileChange('identityImageFront')}
                    error={errors.identityImageFront || fileErrors.identityImageFront}
                    required
                    helpText="صورة واضحة للوجه الأمامي للهوية"
                  />

                  <FileInput
                    label="صورة الهوية (الوجه الخلفي)"
                    accept={FILE_TYPES.IMAGES.join(',')}
                    onChange={handleFileChange('identityImageBack')}
                    error={errors.identityImageBack || fileErrors.identityImageBack}
                    required
                    helpText="صورة واضحة للوجه الخلفي للهوية"
                  />

                  {formData.tenantType && ['partnership', 'commercial_register', 'foreign_company'].includes(formData.tenantType) && (
                    <FileInput
                      label="السجل التجاري"
                      accept={[...FILE_TYPES.IMAGES, ...FILE_TYPES.DOCUMENTS].join(',')}
                      onChange={handleFileChange('commercialRegisterImage')}
                      error={errors.commercialRegisterImage || fileErrors.commercialRegisterImage}
                      required
                      helpText="صورة أو ملف السجل التجاري"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </FormSection>

        {/* Contract Details */}
        <FormSection 
          title="تفاصيل العقد"
          description="معلومات العقد وشروط الإيجار"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="نوع العقد"
              name="contractType"
              value={formData.contractType}
              onChange={handleInputChange}
              options={CONTRACT_TYPE_OPTIONS}
              error={errors.contractType}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="تاريخ البداية"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                error={errors.startDate}
                required
              />

              <Input
                label="تاريخ النهاية"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                error={errors.endDate}
                required
              />
            </div>

            <Select
              label="طريقة الدفع"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              options={PAYMENT_METHOD_OPTIONS}
              error={errors.paymentMethod}
              required
            />

            <Select
              label="جدولة الدفع"
              name="paymentSchedule"
              value={formData.paymentSchedule}
              onChange={handleInputChange}
              options={PAYMENT_SCHEDULE_OPTIONS}
              error={errors.paymentSchedule}
              required
            />
          </div>

          {/* Deposit */}
          <div className="space-y-4">
            <Checkbox
              label="يتضمن تأمين"
              checked={formData.includesDeposit}
              onChange={(e) => updateField('includesDeposit', e.target.checked)}
              error={errors.includesDeposit}
            />

            {formData.includesDeposit && (
              <Input
                label="مبلغ التأمين"
                name="depositAmount"
                type="number"
                min="0"
                step="0.001"
                value={formData.depositAmount?.toString() || ''}
                onChange={handleInputChange}
                error={errors.depositAmount}
                required
                helpText="مبلغ التأمين بالريال العماني"
              />
            )}
          </div>

          <TextArea
            label="ملاحظات"
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            error={errors.notes}
            rows={3}
            helpText="ملاحظات إضافية حول الحجز (اختياري)"
          />
        </FormSection>

        {/* Contract Documents */}
        <FormSection 
          title="وثائق العقد"
          description="رفع نسخ من العقد والوثائق ذات الصلة"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileInput
              label="صورة العقد"
              accept={FILE_TYPES.IMAGES.join(',')}
              onChange={handleFileChange('contractImage')}
              error={errors.contractImage || fileErrors.contractImage}
              helpText="صورة من العقد الموقع (اختياري)"
            />

            <FileInput
              label="ملف العقد (PDF)"
              accept={FILE_TYPES.DOCUMENTS.join(',')}
              onChange={handleFileChange('contractPdf')}
              error={errors.contractPdf || fileErrors.contractPdf}
              helpText="نسخة PDF من العقد (اختياري)"
            />
          </div>
        </FormSection>

        {/* Form Actions */}
        <FormActions
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitText={isEdit ? 'تحديث الحجز' : 'إنشاء الحجز'}
          cancelText="إلغاء"
          isLoading={isSubmitting}
          disabled={isSubmitting || loadingUnits || loadingTenants}
        />
      </div>
    </Card>
  );
}
