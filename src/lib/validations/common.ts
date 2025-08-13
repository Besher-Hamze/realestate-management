// Common validation rules and utilities
export const VALIDATION_MESSAGES = {
  REQUIRED: 'هذا الحقل مطلوب',
  INVALID_EMAIL: 'البريد الإلكتروني غير صالح',
  INVALID_PHONE: 'رقم الهاتف غير صالح',
  INVALID_NUMBER: 'يجب أن يكون الرقم صالحاً',
  MIN_LENGTH: (min: number) => `يجب أن يحتوي على ${min} أحرف على الأقل`,
  MAX_LENGTH: (max: number) => `يجب أن لا يتجاوز ${max} حرف`,
  MIN_VALUE: (min: number) => `يجب أن يكون أكبر من أو يساوي ${min}`,
  MAX_VALUE: (max: number) => `يجب أن يكون أقل من أو يساوي ${max}`,
  PASSWORD_TOO_WEAK: 'كلمة المرور ضعيفة جداً، يجب أن تحتوي على 8 أحرف على الأقل',
  PASSWORDS_DONT_MATCH: 'كلمات المرور غير متطابقة',
  INVALID_DATE: 'التاريخ غير صالح',
  FUTURE_DATE_REQUIRED: 'يجب أن يكون التاريخ في المستقبل',
  PAST_DATE_REQUIRED: 'يجب أن يكون التاريخ في الماضي',
  INVALID_FILE_TYPE: 'نوع الملف غير مدعوم',
  FILE_SIZE_TOO_LARGE: (maxSize: string) => `حجم الملف كبير جداً، الحد الأقصى ${maxSize}`,
  INVALID_URL: 'الرابط غير صالح',
  INVALID_ID_NUMBER: 'رقم الهوية غير صالح',
} as const;

// File validation utilities
export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  EXCEL: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ALL_DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'],
} as const;

export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  LARGE_DOCUMENT: 20 * 1024 * 1024, // 20MB
} as const;

// Common validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Clean the phone number
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  // Accept any non-empty cleaned phone number
  return !!cleanPhone;
};

export const validateIdNumber = (idNumber: string): boolean => {
  // Oman civil ID format: 8 digits
  const omanIdRegex = /^\d{8}$/;
  return true;
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, containing letters and numbers
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateFileType = (file: File | undefined, allowedTypes: string[]): boolean => {
  if (!file) return true;
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File | undefined, maxSize: number): boolean => {
  if (!file) return true;
  return file.size <= maxSize;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Date validation utilities
export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString !== '';
};

export const validateFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
};

export const validatePastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date < today;
};

// Validation rule builders
export const createRequiredRule = (message?: string) => ({
  required: message || VALIDATION_MESSAGES.REQUIRED,
});

export const createMinLengthRule = (min: number, message?: string) => ({
  minLength: {
    value: min,
    message: message || VALIDATION_MESSAGES.MIN_LENGTH(min),
  },
});

export const createMaxLengthRule = (max: number, message?: string) => ({
  maxLength: {
    value: max,
    message: message || VALIDATION_MESSAGES.MAX_LENGTH(max),
  },
});

export const createEmailRule = (message?: string) => ({
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: message || VALIDATION_MESSAGES.INVALID_EMAIL,
  },
});

export const createPhoneRule = (message?: string) => ({
  validate: {
    validPhone: (value: string) =>
      !value || validatePhone(value) || (message || VALIDATION_MESSAGES.INVALID_PHONE),
  },
});

export const createNumberRule = (min?: number, max?: number) => ({
  validate: {
    isNumber: (value: any) => {
      const num = Number(value);
      if (isNaN(num)) return VALIDATION_MESSAGES.INVALID_NUMBER;
      if (min !== undefined && num < min) return VALIDATION_MESSAGES.MIN_VALUE(min);
      if (max !== undefined && num > max) return VALIDATION_MESSAGES.MAX_VALUE(max);
      return true;
    },
  },
});

export const createFileValidationRule = (
  allowedTypes: string[],
  maxSize: number,
  customMessage?: string
) => ({
  validate: {
    fileType: (file: File | undefined) => {
      if (!file) return true;
      const typeNames = allowedTypes.includes('image/jpeg') ? 'الصور' :
        allowedTypes.includes('application/pdf') ? 'ملفات PDF' : 'الملفات المدعومة';
      return validateFileType(file, allowedTypes) ||
        customMessage ||
        `${VALIDATION_MESSAGES.INVALID_FILE_TYPE}. الأنواع المدعومة: ${typeNames}`;
    },
    fileSize: (file: File | undefined) => {
      if (!file) return true;
      return validateFileSize(file, maxSize) ||
        VALIDATION_MESSAGES.FILE_SIZE_TOO_LARGE(formatFileSize(maxSize));
    },
  },
});

export const createPasswordRule = (message?: string) => ({
  validate: {
    strongPassword: (value: string) =>
      !value || validatePassword(value) || (message || VALIDATION_MESSAGES.PASSWORD_TOO_WEAK),
  },
});

export const createIdNumberRule = (message?: string) => ({
  validate: {
    validId: (value: string) =>
      !value || validateIdNumber(value) || (message || VALIDATION_MESSAGES.INVALID_ID_NUMBER),
  },
});

export const createDateRule = (type: 'future' | 'past' | 'any' = 'any', message?: string) => ({
  validate: {
    validDate: (value: string) => {
      if (!value) return true;
      if (!validateDate(value)) return message || VALIDATION_MESSAGES.INVALID_DATE;

      if (type === 'future' && !validateFutureDate(value)) {
        return message || VALIDATION_MESSAGES.FUTURE_DATE_REQUIRED;
      }

      if (type === 'past' && !validatePastDate(value)) {
        return message || VALIDATION_MESSAGES.PAST_DATE_REQUIRED;
      }

      return true;
    },
  },
});
