export const tenantValidation = {
  // User account details
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
  
  // Personal information
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
  },
  whatsappNumber: {
    pattern: {
      value: /^[0-9+\-\s()]{8,}$/,
      message: 'رقم الواتساب غير صالح'
    }
  },
  idNumber: {
    required: 'رقم الهوية مطلوب',
    minLength: {
      value: 4,
      message: 'يجب أن يحتوي رقم الهوية على 4 أحرف على الأقل'
    }
  },
  
  // Tenant type and business information
  tenantType: {
    required: 'نوع المستأجر مطلوب'
  },
  businessActivities: {
    maxLength: {
      value: 500,
      message: 'يجب أن لا تتجاوز الأنشطة التجارية 500 حرف'
    }
  },
  contactPerson: {
    maxLength: {
      value: 100,
      message: 'يجب أن لا يتجاوز اسم جهة الاتصال 100 حرف'
    }
  },
  contactPosition: {
    maxLength: {
      value: 100,
      message: 'يجب أن لا يتجاوز المنصب الوظيفي 100 حرف'
    }
  },
  notes: {
    maxLength: {
      value: 1000,
      message: 'يجب أن لا تتجاوز الملاحظات 1000 حرف'
    }
  },
  
  // Document uploads
  identityImageFront: {
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
  },
  identityImageBack: {
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
  },
  commercialRegisterImage: {
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