import {
  createRequiredRule,
  createMinLengthRule,
  createMaxLengthRule,
  createFileValidationRule,
  FILE_TYPES,
  FILE_SIZE_LIMITS,
} from './common';

export const serviceValidation = {
  reservationId: {
    ...createRequiredRule('الحجز مطلوب'),
    validate: {
      validSelection: (value: any) => {
        const num = Number(value);
        return (!isNaN(num) && num > 0) || 'يرجى اختيار حجز صالح';
      },
    },
  },
  
  serviceType: {
    ...createRequiredRule('نوع الخدمة مطلوب'),
    validate: {
      validType: (value: string) => {
        const validTypes = ['financial', 'maintenance', 'administrative'];
        return validTypes.includes(value) || 'نوع الخدمة غير صالح';
      },
    },
  },
  
  serviceSubtype: {
    ...createRequiredRule('نوع الخدمة الفرعي مطلوب'),
    ...createMinLengthRule(2, 'نوع الخدمة الفرعي قصير جداً'),
    ...createMaxLengthRule(100, 'نوع الخدمة الفرعي طويل جداً'),
  },
  
  description: {
    ...createRequiredRule('وصف الخدمة مطلوب'),
    ...createMinLengthRule(10, 'وصف الخدمة قصير جداً (10 أحرف على الأقل)'),
    ...createMaxLengthRule(1000, 'وصف الخدمة طويل جداً (الحد الأقصى 1000 حرف)'),
  },
  
  attachmentFile: {
    ...createFileValidationRule(
      [...FILE_TYPES.IMAGES, ...FILE_TYPES.DOCUMENTS],
      FILE_SIZE_LIMITS.DOCUMENT,
      'يرجى تحميل ملف مناسب (صور: JPEG, PNG, GIF - مستندات: PDF, DOC, DOCX)'
    ),
  },
  
  status: {
    validate: {
      validStatus: (value: string) => {
        if (!value) return true; // Optional field for creation
        const validStatuses = ['pending', 'in-progress', 'completed', 'rejected'];
        return validStatuses.includes(value) || 'حالة الخدمة غير صالحة';
      },
    },
  },
};

// Helper function to validate complete service form
export const validateServiceForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required field checks
  if (!data.reservationId || Number(data.reservationId) <= 0) {
    errors.reservationId = 'يرجى اختيار حجز صالح';
  }
  
  if (!data.serviceType) {
    errors.serviceType = 'نوع الخدمة مطلوب';
  }
  
  if (!data.serviceSubtype?.trim()) {
    errors.serviceSubtype = 'نوع الخدمة الفرعي مطلوب';
  }
  
  if (!data.description?.trim()) {
    errors.description = 'وصف الخدمة مطلوب';
  } else if (data.description.trim().length < 10) {
    errors.description = 'وصف الخدمة قصير جداً (10 أحرف على الأقل)';
  }

  return errors;
};

// Service type options
export const SERVICE_TYPE_OPTIONS = [
  { value: 'financial', label: 'مالية' },
  { value: 'maintenance', label: 'صيانة' },
  { value: 'administrative', label: 'إدارية' },
];

// Service subtypes based on type
export const SERVICE_SUBTYPE_OPTIONS = {
  financial: [
    { value: 'payment_inquiry', label: 'استفسار عن دفعة' },
    { value: 'refund_request', label: 'طلب استرداد' },
    { value: 'payment_plan', label: 'خطة دفع' },
    { value: 'invoice_request', label: 'طلب فاتورة' },
    { value: 'other_financial', label: 'أخرى مالية' },
  ],
  maintenance: [
    { value: 'plumbing', label: 'سباكة' },
    { value: 'electrical', label: 'كهرباء' },
    { value: 'air_conditioning', label: 'تكييف' },
    { value: 'appliance_repair', label: 'إصلاح أجهزة' },
    { value: 'painting', label: 'دهانات' },
    { value: 'cleaning', label: 'تنظيف' },
    { value: 'pest_control', label: 'مكافحة حشرات' },
    { value: 'other_maintenance', label: 'أخرى صيانة' },
  ],
  administrative: [
    { value: 'contract_modification', label: 'تعديل عقد' },
    { value: 'document_request', label: 'طلب وثائق' },
    { value: 'complaint', label: 'شكوى' },
    { value: 'suggestion', label: 'اقتراح' },
    { value: 'information_request', label: 'طلب معلومات' },
    { value: 'other_administrative', label: 'أخرى إدارية' },
  ],
};

// Service status options
export const SERVICE_STATUS_OPTIONS = [
  { value: 'pending', label: 'في الانتظار', color: 'yellow' },
  { value: 'in-progress', label: 'قيد التنفيذ', color: 'blue' },
  { value: 'completed', label: 'مكتملة', color: 'green' },
  { value: 'rejected', label: 'مرفوضة', color: 'red' },
];

// Comment validation for service comments
export const serviceCommentValidation = {
  message: {
    ...createRequiredRule('نص التعليق مطلوب'),
    ...createMinLengthRule(5, 'التعليق قصير جداً (5 أحرف على الأقل)'),
    ...createMaxLengthRule(500, 'التعليق طويل جداً (الحد الأقصى 500 حرف)'),
  },
  
  attachment: {
    ...createFileValidationRule(
      [...FILE_TYPES.IMAGES, ...FILE_TYPES.DOCUMENTS],
      FILE_SIZE_LIMITS.DOCUMENT,
      'يرجى تحميل ملف مناسب (صور: JPEG, PNG - مستندات: PDF)'
    ),
  },
};
