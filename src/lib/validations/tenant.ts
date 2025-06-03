import {
  createRequiredRule,
  createMinLengthRule,
  createMaxLengthRule,
  createEmailRule,
  createPhoneRule,
  createIdNumberRule,
  createFileValidationRule,
  FILE_TYPES,
  FILE_SIZE_LIMITS,
  VALIDATION_MESSAGES,
} from './common';

export const tenantValidation = {
  username: {
    ...createRequiredRule('اسم المستخدم مطلوب'),
    ...createMinLengthRule(3, 'اسم المستخدم قصير جداً'),
    ...createMaxLengthRule(50, 'اسم المستخدم طويل جداً'),
    validate: {
      validUsername: (value: string) => {
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        return usernameRegex.test(value) || 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام و _ فقط';
      },
    },
  },

  password: {
    ...createRequiredRule('كلمة المرور مطلوبة'),
    ...createMinLengthRule(8, 'كلمة المرور قصيرة جداً (8 أحرف على الأقل)'),
    validate: {
      strongPassword: (value: string) => {
        if (!/(?=.*[a-zA-Z])/.test(value)) {
          return 'كلمة المرور يجب أن تحتوي على أحرف';
        }
        if (!/(?=.*\d)/.test(value)) {
          return 'كلمة المرور يجب أن تحتوي على أرقام';
        }
        return true;
      },
    },
  },

  fullName: {
    ...createRequiredRule('الاسم الكامل مطلوب'),
    ...createMinLengthRule(2, 'الاسم الكامل قصير جداً'),
    ...createMaxLengthRule(100, 'الاسم الكامل طويل جداً'),
  },

  email: {
    ...createRequiredRule('البريد الإلكتروني مطلوب'),
    ...createEmailRule(),
  },

  phone: {
    ...createRequiredRule('رقم الهاتف مطلوب'),
    ...createPhoneRule(),
  },

  whatsappNumber: {
    ...createRequiredRule('رقم الواتساب مطلوب'),
    ...createPhoneRule('رقم الواتساب غير صالح'),
  },

  idNumber: {
    ...createRequiredRule('رقم الهوية مطلوب'),
    ...createIdNumberRule(),
  },

  tenantType: {
    ...createRequiredRule('نوع المستأجر مطلوب'),
    validate: {
      validType: (value: string) => {
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

  businessActivities: {
    ...createMaxLengthRule(500, 'الأنشطة التجارية طويلة جداً'),
  },

  contactPerson: {
    ...createMaxLengthRule(100, 'اسم الشخص المسؤول طويل جداً'),
  },

  contactPosition: {
    ...createMaxLengthRule(100, 'منصب الشخص المسؤول طويل جداً'),
  },

  notes: {
    ...createMaxLengthRule(1000, 'الملاحظات طويلة جداً'),
  },

  identityImageFront: {
    ...createRequiredRule('صورة الوجه الأمامي للهوية مطلوبة'),
    ...createFileValidationRule(
      FILE_TYPES.IMAGES,
      FILE_SIZE_LIMITS.IMAGE,
      'يرجى تحميل صورة واضحة للوجه الأمامي للهوية (JPEG, PNG فقط)'
    ),
  },

  identityImageBack: {
    ...createRequiredRule('صورة الوجه الخلفي للهوية مطلوبة'),
    ...createFileValidationRule(
      FILE_TYPES.IMAGES,
      FILE_SIZE_LIMITS.IMAGE,
      'يرجى تحميل صورة واضحة للوجه الخلفي للهوية (JPEG, PNG فقط)'
    ),
  },

  commercialRegisterImage: {
    ...createFileValidationRule(
      FILE_TYPES.ALL_DOCUMENTS,
      FILE_SIZE_LIMITS.DOCUMENT,
      'يرجى تحميل صورة أو ملف السجل التجاري (PDF, JPEG, PNG)'
    ),
  },
};

// Helper function to validate complete tenant form
export const validateTenantForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required field checks
  if (!data.username?.trim()) {
    errors.username = 'اسم المستخدم مطلوب';
  }

  if (!data.password?.trim()) {
    errors.password = 'كلمة المرور مطلوبة';
  }

  if (!data.fullName?.trim()) {
    errors.fullName = 'الاسم الكامل مطلوب';
  }

  if (!data.email?.trim()) {
    errors.email = 'البريد الإلكتروني مطلوب';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'رقم الهاتف مطلوب';
  }

  if (!data.whatsappNumber?.trim()) {
    errors.whatsappNumber = 'رقم الواتساب مطلوب';
  }

  if (!data.idNumber?.trim()) {
    errors.idNumber = 'رقم الهوية مطلوب';
  }

  if (!data.tenantType) {
    errors.tenantType = 'نوع المستأجر مطلوب';
  }

  // File validation
  if (!data.identityImageFront) {
    errors.identityImageFront = 'صورة الوجه الأمامي للهوية مطلوبة';
  }

  if (!data.identityImageBack) {
    errors.identityImageBack = 'صورة الوجه الخلفي للهوية مطلوبة';
  }

  // Conditional validation for commercial register
  const businessTypes = ['partnership', 'commercial_register', 'foreign_company'];
  if (businessTypes.includes(data.tenantType) && !data.commercialRegisterImage) {
    errors.commercialRegisterImage = 'صورة السجل التجاري مطلوبة لهذا النوع من المستأجرين';
  }

  return errors;
};

// Tenant type options for dropdown
export const TENANT_TYPE_OPTIONS = [
  { value: 'person', label: 'شخص طبيعي' },
  { value: 'partnership', label: 'شراكة' },
  { value: 'commercial_register', label: 'سجل تجاري' },
  { value: 'embassy', label: 'سفارة' },
  { value: 'foreign_company', label: 'شركة أجنبية' },
  { value: 'government', label: 'حكومية' },
  { value: 'inheritance', label: 'ميراث' },
  { value: 'civil_registry', label: 'سجل مدني' },
];
