export const loginValidation = {
  username: {
    required: 'اسم المستخدم مطلوب',
    minLength: {
      value: 3,
      message: 'يجب أن يحتوي اسم المستخدم على 3 أحرف على الأقل'
    }
  },
  password: {
    required: 'كلمة المرور مطلوبة',
    minLength: {
      value: 6,
      message: 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل'
    }
  }
};

export const registerValidation = {
  username: {
    required: 'اسم المستخدم مطلوب',
    minLength: {
      value: 3,
      message: 'يجب أن يحتوي اسم المستخدم على 3 أحرف على الأقل'
    }
  },
  password: {
    required: 'كلمة المرور مطلوبة',
    minLength: {
      value: 6,
      message: 'يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل'
    }
  },
  fullName: {
    required: 'الاسم الكامل مطلوب',
    minLength: {
      value: 3,
      message: 'يجب أن يحتوي الاسم الكامل على 3 أحرف على الأقل'
    }
  },
  email: {
    required: 'البريد الإلكتروني مطلوب',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'البريد الإلكتروني غير صالح'
    }
  },
  phone: {
    required: 'رقم الهاتف مطلوب',
    pattern: {
      value: /^[0-9+\-\s()]{8,}$/,
      message: 'رقم الهاتف غير صالح'
    }
  }
};

export const changePasswordValidation = {
  currentPassword: {
    required: 'كلمة المرور الحالية مطلوبة',
    minLength: {
      value: 6,
      message: 'يجب أن تحتوي كلمة المرور الحالية على 6 أحرف على الأقل'
    }
  },
  newPassword: {
    required: 'كلمة المرور الجديدة مطلوبة',
    minLength: {
      value: 6,
      message: 'يجب أن تحتوي كلمة المرور الجديدة على 6 أحرف على الأقل'
    }
  },
  confirmPassword: {
    required: 'تأكيد كلمة المرور مطلوب',
    validate: (value: string, values: any) => {
      return value === values.newPassword || 'كلمات المرور غير متطابقة';
    }
  }
};