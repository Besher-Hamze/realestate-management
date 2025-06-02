import {
  createRequiredRule,
  createMinLengthRule,
  createMaxLengthRule,
  createEmailRule,
  createPhoneRule,
  createPasswordRule,
  VALIDATION_MESSAGES,
} from './common';

export const authValidation = {
  // Login validation
  username: {
    ...createRequiredRule('اسم المستخدم مطلوب'),
    ...createMinLengthRule(3, 'اسم المستخدم قصير جداً'),
  },
  
  password: {
    ...createRequiredRule('كلمة المرور مطلوبة'),
    ...createMinLengthRule(6, 'كلمة المرور قصيرة جداً'),
  },
  
  // Registration validation
  fullName: {
    ...createRequiredRule('الاسم الكامل مطلوب'),
    ...createMinLengthRule(2, 'الاسم الكامل قصير جداً'),
    ...createMaxLengthRule(100, 'الاسم الكامل طويل جداً'),
    validate: {
      validName: (value: string) => {
        const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
        return nameRegex.test(value) || 'الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية فقط';
      },
    },
  },
  
  email: {
    ...createRequiredRule('البريد الإلكتروني مطلوب'),
    ...createEmailRule(),
  },
  
  phone: {
    ...createRequiredRule('رقم الهاتف مطلوب'),
    ...createPhoneRule(),
  },
  
  // Registration username with stronger validation
  registrationUsername: {
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
  
  // Registration password with stronger validation
  registrationPassword: {
    ...createRequiredRule('كلمة المرور مطلوبة'),
    ...createPasswordRule(),
  },
  
  // Password confirmation
  confirmPassword: {
    ...createRequiredRule('تأكيد كلمة المرور مطلوب'),
    validate: {
      passwordMatch: (value: string, formValues: any) => {
        return value === formValues.password || value === formValues.registrationPassword || 
               VALIDATION_MESSAGES.PASSWORDS_DONT_MATCH;
      },
    },
  },
  
  // Change password validation
  currentPassword: {
    ...createRequiredRule('كلمة المرور الحالية مطلوبة'),
  },
  
  newPassword: {
    ...createRequiredRule('كلمة المرور الجديدة مطلوبة'),
    ...createPasswordRule(),
    validate: {
      differentFromCurrent: (value: string, formValues: any) => {
        return value !== formValues.currentPassword || 'كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية';
      },
    },
  },
  
  confirmNewPassword: {
    ...createRequiredRule('تأكيد كلمة المرور الجديدة مطلوب'),
    validate: {
      passwordMatch: (value: string, formValues: any) => {
        return value === formValues.newPassword || VALIDATION_MESSAGES.PASSWORDS_DONT_MATCH;
      },
    },
  },
};

// Helper function to validate login form
export const validateLoginForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.username?.trim()) {
    errors.username = 'اسم المستخدم مطلوب';
  }
  
  if (!data.password?.trim()) {
    errors.password = 'كلمة المرور مطلوبة';
  }

  return errors;
};

// Helper function to validate registration form
export const validateRegistrationForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required field checks
  if (!data.username?.trim()) {
    errors.username = 'اسم المستخدم مطلوب';
  } else {
    // Username format validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(data.username)) {
      errors.username = 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام و _ فقط';
    } else if (data.username.length < 3) {
      errors.username = 'اسم المستخدم قصير جداً (3 أحرف على الأقل)';
    }
  }
  
  if (!data.password?.trim()) {
    errors.password = 'كلمة المرور مطلوبة';
  } else {
    // Password strength validation
    if (data.password.length < 8) {
      errors.password = 'كلمة المرور قصيرة جداً (8 أحرف على الأقل)';
    } else if (!/(?=.*[a-zA-Z])/.test(data.password)) {
      errors.password = 'كلمة المرور يجب أن تحتوي على أحرف';
    } else if (!/(?=.*\d)/.test(data.password)) {
      errors.password = 'كلمة المرور يجب أن تحتوي على أرقام';
    }
  }
  
  if (!data.confirmPassword?.trim()) {
    errors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'كلمات المرور غير متطابقة';
  }
  
  if (!data.fullName?.trim()) {
    errors.fullName = 'الاسم الكامل مطلوب';
  } else {
    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
    if (!nameRegex.test(data.fullName)) {
      errors.fullName = 'الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية فقط';
    }
  }
  
  if (!data.email?.trim()) {
    errors.email = 'البريد الإلكتروني مطلوب';
  } else {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(data.email)) {
      errors.email = 'البريد الإلكتروني غير صالح';
    }
  }
  
  if (!data.phone?.trim()) {
    errors.phone = 'رقم الهاتف مطلوب';
  } else {
    const omanPhoneRegex = /^(\+968|968|00968)?[2-9]\d{7}$/;
    const internationalPhoneRegex = /^(\+\d{1,3}[- ]?)?\d{8,15}$/;
    const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
    
    if (!omanPhoneRegex.test(cleanPhone) && !internationalPhoneRegex.test(cleanPhone)) {
      errors.phone = 'رقم الهاتف غير صالح';
    }
  }

  return errors;
};

// Helper function to validate change password form
export const validateChangePasswordForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.currentPassword?.trim()) {
    errors.currentPassword = 'كلمة المرور الحالية مطلوبة';
  }
  
  if (!data.newPassword?.trim()) {
    errors.newPassword = 'كلمة المرور الجديدة مطلوبة';
  } else {
    // Password strength validation
    if (data.newPassword.length < 8) {
      errors.newPassword = 'كلمة المرور الجديدة قصيرة جداً (8 أحرف على الأقل)';
    } else if (!/(?=.*[a-zA-Z])/.test(data.newPassword)) {
      errors.newPassword = 'كلمة المرور الجديدة يجب أن تحتوي على أحرف';
    } else if (!/(?=.*\d)/.test(data.newPassword)) {
      errors.newPassword = 'كلمة المرور الجديدة يجب أن تحتوي على أرقام';
    } else if (data.newPassword === data.currentPassword) {
      errors.newPassword = 'كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية';
    }
  }
  
  if (!data.confirmNewPassword?.trim()) {
    errors.confirmNewPassword = 'تأكيد كلمة المرور الجديدة مطلوب';
  } else if (data.newPassword !== data.confirmNewPassword) {
    errors.confirmNewPassword = 'كلمات المرور غير متطابقة';
  }

  return errors;
};

// Password strength checker
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('يجب أن تحتوي على 8 أحرف على الأقل');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('يجب أن تحتوي على أحرف صغيرة');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('يجب أن تحتوي على أحرف كبيرة');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('يجب أن تحتوي على أرقام');
  }

  if (/[^a-zA-Z\d]/.test(password)) {
    score += 1;
    feedback.push('قوية جداً - تحتوي على رموز خاصة');
  }

  const isStrong = score >= 4;

  return {
    score,
    feedback,
    isStrong,
  };
};

// User role options
export const USER_ROLE_OPTIONS = [
  { value: 'admin', label: 'مدير النظام' },
  { value: 'manager', label: 'مدير الشركة' },
  { value: 'tenant', label: 'مستأجر' },
];
