export const companyValidation = {
  name: {
    required: 'اسم الشركة مطلوب',
    minLength: {
      value: 3,
      message: 'يجب أن يحتوي اسم الشركة على 3 أحرف على الأقل'
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
  },
  address: {
    required: 'عنوان الشركة مطلوب',
    minLength: {
      value: 5,
      message: 'يجب أن يحتوي العنوان على 5 أحرف على الأقل'
    }
  },
  managerFullName: {
    minLength: {
      value: 3,
      message: 'يجب أن يحتوي اسم المدير على 3 أحرف على الأقل'
    }
  },
  managerEmail: {
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'البريد الإلكتروني للمدير غير صالح'
    }
  },
  managerPhone: {
    pattern: {
      value: /^[0-9+\-\s()]{8,}$/,
      message: 'رقم هاتف المدير غير صالح'
    }
  },
  logoImage: {
    validate: {
      acceptedFormats: (file: File | undefined) => {
        if (!file) return true;
        
        const acceptedFormats = ['image/jpeg', 'image/png', 'image/gif'];
        return acceptedFormats.includes(file.type) || 'يرجى تحميل صورة بتنسيق صالح (JPEG/PNG/GIF)';
      },
      fileSize: (file: File | undefined) => {
        if (!file) return true;
        
        // Max size: 5MB
        const maxSize = 5 * 1024 * 1024;
        return file.size <= maxSize || 'حجم الملف كبير جدًا، الحد الأقصى هو 5 ميجابايت';
      }
    }
  }
};