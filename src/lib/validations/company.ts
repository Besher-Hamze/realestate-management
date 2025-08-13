import {
  createRequiredRule,
  createMinLengthRule,
  createMaxLengthRule,
  createEmailRule,
  createPhoneRule,
  createFileValidationRule,
  FILE_TYPES,
  FILE_SIZE_LIMITS,
  VALIDATION_MESSAGES,
} from './common';

export const companyValidation = {
  name: {
    ...createRequiredRule('اسم الشركة مطلوب'),
    ...createMinLengthRule(2, 'يجب أن يحتوي اسم الشركة على حرفين على الأقل'),
    ...createMaxLengthRule(100, 'اسم الشركة طويل جداً'),
  },

  companyType: {
    ...createRequiredRule('نوع الشركة مطلوب'),
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
    ...createPhoneRule('رقم الواتساب غير صالح'),
  },

  secondaryPhone: {
    ...createPhoneRule('رقم الهاتف الثانوي غير صالح'),
  },

  address: {
    ...createRequiredRule('عنوان الشركة مطلوب'),
    ...createMinLengthRule(5, 'يجب أن يحتوي العنوان على 5 أحرف على الأقل'),
    ...createMaxLengthRule(255, 'العنوان طويل جداً'),
  },

  registrationNumber: {
    required: {
      value: true,
      message: 'رقم التسجيل مطلوب للشركات المالكة',
      condition: (formData: any) => formData.companyType === 'Owner'
    },
    ...createMinLengthRule(1, 'رقم التسجيل قصير جداً'),
    ...createMaxLengthRule(50, 'رقم التسجيل طويل جداً'),
  },

  delegateName: {
    ...createMinLengthRule(2, 'اسم المفوض قصير جداً'),
    ...createMaxLengthRule(100, 'اسم المفوض طويل جداً'),
  },

  managerFullName: {
    ...createMinLengthRule(2, 'اسم المدير قصير جداً'),
    ...createMaxLengthRule(100, 'اسم المدير طويل جداً'),
  },

  managerEmail: {
    ...createEmailRule('البريد الإلكتروني للمدير غير صالح'),
  },

  managerPhone: {
    ...createPhoneRule('رقم هاتف المدير غير صالح'),
  },

  logoImage: {
    ...createFileValidationRule(
      FILE_TYPES.IMAGES,
      FILE_SIZE_LIMITS.IMAGE,
      'يرجى تحميل صورة شعار بتنسيق صالح (JPEG, PNG, GIF, WebP)'
    ),
  },

  identityImageFront: {
    ...createFileValidationRule(
      FILE_TYPES.IMAGES,
      FILE_SIZE_LIMITS.IMAGE,
      'يرجى تحميل ملف PDF يحوي الوجهين الأمامي و الخلفي (JPEG, PNG فقط)'
    ),
  },


};

// Helper function to validate complete company form
export const validateCompanyForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required field checks
  if (!data.name?.trim()) {
    errors.name = 'اسم الشركة مطلوب';
  }

  if (!data.companyType) {
    errors.companyType = 'نوع الشركة مطلوب';
  }

  if (!data.email?.trim()) {
    errors.email = 'البريد الإلكتروني مطلوب';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'رقم الهاتف مطلوب';
  }

  if (!data.address?.trim()) {
    errors.address = 'عنوان الشركة مطلوب';
  }

  // Conditional validation for manager fields
  const hasManagerInfo = data.managerFullName || data.managerEmail || data.managerPhone;

  if (hasManagerInfo) {
    if (!data.managerFullName?.trim()) {
      errors.managerFullName = 'اسم المدير مطلوب عند إضافة بيانات المدير';
    }

    if (!data.managerEmail?.trim()) {
      errors.managerEmail = 'البريد الإلكتروني للمدير مطلوب عند إضافة بيانات المدير';
    }

    if (!data.managerPhone?.trim()) {
      errors.managerPhone = 'رقم هاتف المدير مطلوب عند إضافة بيانات المدير';
    }
  }

  return errors;
};
