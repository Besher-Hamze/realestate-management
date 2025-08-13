import {
  createRequiredRule,
  createMinLengthRule,
  createMaxLengthRule,
  createEmailRule,
  createPhoneRule,
  createIdNumberRule,
  createDateRule,
  createFileValidationRule,
  createNumberRule,
  FILE_TYPES,
  FILE_SIZE_LIMITS,
  VALIDATION_MESSAGES,
  validateDate,
  validateFutureDate,
} from './common';

export const reservationValidation = {
  // Existing tenant selection
  userId: {
    validate: {
      validSelection: (value: any) => {
        if (!value || value === '') return true; // Optional when creating new tenant
        const num = Number(value);
        return (!isNaN(num) && num > 0) || 'يرجى اختيار مستأجر صالح';
      },
    },
  },

  // New tenant fields (conditional)
  tenantFullName: {
    ...createMinLengthRule(2, 'اسم المستأجر قصير جداً'),
    ...createMaxLengthRule(100, 'اسم المستأجر طويل جداً'),
  },

  tenantEmail: {
    ...createEmailRule('البريد الإلكتروني للمستأجر غير صالح'),
  },

  tenantPhone: {
    validate: {
      validPhone: (value: string) => {
        if (!value) return true; // Conditional validation
        const phoneRegex = /^(\+968|968|00968)?[2-9]\d{7}$/;
        const internationalPhoneRegex = /^(\+\d{1,3}[- ]?)?\d{8,15}$/;
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleanPhone) || internationalPhoneRegex.test(cleanPhone) || 'رقم هاتف المستأجر غير صالح';
      },
    },
  },

  tenantWhatsappNumber: {
    validate: {
      validWhatsapp: (value: string) => {
        if (!value) return true; // Conditional validation
        const phoneRegex = /^(\+968|968|00968)?[2-9]\d{7}$/;
        const internationalPhoneRegex = /^(\+\d{1,3}[- ]?)?\d{8,15}$/;
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleanPhone) || internationalPhoneRegex.test(cleanPhone) || 'رقم واتساب المستأجر غير صالح';
      },
    },
  },

  tenantIdNumber: {
    validate: {
      validId: (value: string) => {
        if (!value) return true; // Conditional validation
        const omanIdRegex = /^\d{8}$/;
        return omanIdRegex.test(value) || 'رقم هوية المستأجر غير صالح (8 أرقام)';
      },
    },
  },

  tenantType: {
    validate: {
      validType: (value: string) => {
        if (!value) return true; // Conditional validation
        const validTypes = [
          'partnership',
          'commercial_register',
          'person',
          'embassy',
          'foreign_company',
          'government',
          'inheritance',
          'civil_registry'
        ];
        return validTypes.includes(value) || 'نوع المستأجر غير صالح';
      },
    },
  },

  // Common reservation fields
  unitId: {
    ...createRequiredRule('الوحدة مطلوبة'),
    validate: {
      validSelection: (value: any) => {
        const num = Number(value);
        return (!isNaN(num) && num > 0) || 'يرجى اختيار وحدة صالحة';
      },
    },
  },

  contractType: {
    ...createRequiredRule('نوع العقد مطلوب'),
    validate: {
      validType: (value: string) => {
        const validTypes = ['residential', 'commercial'];
        return validTypes.includes(value) || 'نوع العقد غير صالح';
      },
    },
  },

  startDate: {
    ...createRequiredRule('تاريخ بداية العقد مطلوب'),
    validate: {
      validDate: (value: string) => {
        if (!validateDate(value)) return 'تاريخ البداية غير صالح';
        return true;
      },
    },
  },

  endDate: {
    ...createRequiredRule('تاريخ نهاية العقد مطلوب'),
    validate: {
      validDate: (value: string, formValues: any) => {
        if (!validateDate(value)) return 'تاريخ النهاية غير صالح';

        const startDate = new Date(formValues.startDate);
        const endDate = new Date(value);

        if (endDate <= startDate) {
          return 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
        }

        return true;
      },
    },
  },

  paymentMethod: {
    ...createRequiredRule('طريقة الدفع مطلوبة'),
    validate: {
      validMethod: (value: string) => {
        const validMethods = ['cash', 'checks'];
        return validMethods.includes(value) || 'طريقة الدفع غير صالحة';
      },
    },
  },

  paymentSchedule: {
    ...createRequiredRule('جدولة الدفع مطلوبة'),
    validate: {
      validSchedule: (value: string) => {
        const validSchedules = ['monthly', 'quarterly', 'triannual', 'biannual', 'annual'];
        return validSchedules.includes(value) || 'جدولة الدفع غير صالحة';
      },
    },
  },

  includesDeposit: {
    validate: {
      validBoolean: (value: any) => {
        return typeof value === 'boolean' || 'حقل التأمين يجب أن يكون صحيح أو خطأ';
      },
    },
  },

  depositAmount: {
    validate: {
      validAmount: (value: any, formValues: any) => {
        if (!formValues.includesDeposit) return true; // Not required if no deposit

        const num = Number(value);
        if (!value || isNaN(num)) return 'مبلغ التأمين مطلوب عند تحديد وجود تأمين';
        if (num <= 0) return 'مبلغ التأمين يجب أن يكون أكبر من صفر';
        if (num > 1000000000) return 'مبلغ التأمين كبير جداً';

        return true;
      },
    },
  },

  notes: {
    ...createMaxLengthRule(1000, 'الملاحظات طويلة جداً'),
  },

  contractImage: {
    ...createFileValidationRule(
      ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      FILE_SIZE_LIMITS.IMAGE,
      'يرجى تحميل صورة العقد (JPEG, PNG فقط)'
    ),
  },

  contractPdf: {
    ...createFileValidationRule(
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      FILE_SIZE_LIMITS.DOCUMENT,
      'يرجى تحميل ملف العقد (PDF, DOC, DOCX فقط)'
    ),
  },

  identityImageFront: {
    ...createFileValidationRule(
      ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      FILE_SIZE_LIMITS.IMAGE,
      'يرجى تحميل صورة الوجه الأمامي للهوية (JPEG, PNG فقط)'
    ),
  },



  commercialRegisterImage: {
    ...createFileValidationRule(
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'],
      FILE_SIZE_LIMITS.DOCUMENT,
      'يرجى تحميل صورة أو ملف السجل التجاري (PDF, JPEG, PNG)'
    ),
  },
};

// Helper function to validate complete reservation form
export const validateReservationForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Check if using existing tenant or creating new one
  const isCreatingNewTenant = !data.userId || data.userId === '';

  if (isCreatingNewTenant) {
    // Validate new tenant fields
    if (!data.tenantFullName?.trim()) {
      errors.tenantFullName = 'اسم المستأجر مطلوب';
    }

    if (!data.tenantEmail?.trim()) {
      errors.tenantEmail = 'البريد الإلكتروني للمستأجر مطلوب';
    }

    if (!data.tenantPhone?.trim()) {
      errors.tenantPhone = 'رقم هاتف المستأجر مطلوب';
    }

    if (!data.tenantWhatsappNumber?.trim()) {
      errors.tenantWhatsappNumber = 'رقم واتساب المستأجر مطلوب';
    }

    if (!data.tenantIdNumber?.trim()) {
      errors.tenantIdNumber = 'رقم هوية المستأجر مطلوب';
    }

    if (!data.tenantType) {
      errors.tenantType = 'نوع المستأجر مطلوب';
    }

    // File validation for new tenant
    if (!data.identityImageFront) {
      errors.identityImageFront = 'صورة الوجه الأمامي للهوية مطلوبة';
    }


    // Commercial register for business types
    const businessTypes = ['partnership', 'commercial_register', 'foreign_company'];
    if (businessTypes.includes(data.tenantType) && !data.commercialRegisterImage) {
      errors.commercialRegisterImage = 'صورة السجل التجاري مطلوبة لهذا النوع من المستأجرين';
    }
  } else {
    // Validate existing tenant selection
    if (!data.userId || Number(data.userId) <= 0) {
      errors.userId = 'يرجى اختيار مستأجر صالح';
    }
  }

  // Common validation
  if (!data.unitId || Number(data.unitId) <= 0) {
    errors.unitId = 'يرجى اختيار وحدة صالحة';
  }

  if (!data.contractType) {
    errors.contractType = 'نوع العقد مطلوب';
  }

  if (!data.startDate) {
    errors.startDate = 'تاريخ بداية العقد مطلوب';
  }

  if (!data.endDate) {
    errors.endDate = 'تاريخ نهاية العقد مطلوب';
  }

  // Date comparison validation
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      errors.endDate = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
    }
  }

  if (!data.paymentMethod) {
    errors.paymentMethod = 'طريقة الدفع مطلوبة';
  }

  if (!data.paymentSchedule) {
    errors.paymentSchedule = 'جدولة الدفع مطلوبة';
  }

  // Deposit validation
  if (data.includesDeposit) {
    const depositAmount = Number(data.depositAmount);
    if (!data.depositAmount || isNaN(depositAmount) || depositAmount <= 0) {
      errors.depositAmount = 'مبلغ التأمين مطلوب ويجب أن يكون أكبر من صفر';
    }
  }

  return errors;
};

// Contract type options
export const CONTRACT_TYPE_OPTIONS = [
  { value: 'residential', label: 'سكني' },
  { value: 'commercial', label: 'تجاري' },
];

// Payment method options
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'نقدي' },
  { value: 'checks', label: 'شيكات' },
];

// Payment schedule options
export const PAYMENT_SCHEDULE_OPTIONS = [
  { value: 'monthly', label: 'شهرياً' },
  { value: 'quarterly', label: 'كل 3 شهور' },
  { value: 'triannual', label: 'كل 4 شهور' },
  { value: 'biannual', label: 'كل 6 شهور' },
  { value: 'annual', label: 'سنوياً' },
];
