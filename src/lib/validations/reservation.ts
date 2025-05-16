export const reservationValidation = {
  // For existing tenant
  userId: {
    validate: {
      atLeastOne: (value: string | undefined, formValues: any) => {
        // Either userId or tenant details must be provided
        const hasTenantDetails = formValues.tenantFullName && formValues.tenantEmail && formValues.tenantPhone;
        return (value || hasTenantDetails) || 'يجب اختيار مستأجر موجود أو إدخال بيانات مستأجر جديد';
      }
    }
  },
  
  // New tenant details
  tenantFullName: {
    validate: {
      requiredIfNoUserId: (value: string | undefined, formValues: any) => {
        if (!formValues.userId && !value) {
          return 'الاسم الكامل للمستأجر مطلوب';
        }
        return true;
      },
      minLength: (value: string | undefined) => {
        if (!value) return true;
        return value.length >= 3 || 'يجب أن يحتوي الاسم الكامل على 3 أحرف على الأقل';
      }
    }
  },
  tenantEmail: {
    validate: {
      requiredIfNoUserId: (value: string | undefined, formValues: any) => {
        if (!formValues.userId && !value) {
          return 'البريد الإلكتروني للمستأجر مطلوب';
        }
        return true;
      },
      validFormat: (value: string | undefined) => {
        if (!value) return true;
        return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) || 'البريد الإلكتروني غير صالح';
      }
    }
  },
  tenantPhone: {
    validate: {
      requiredIfNoUserId: (value: string | undefined, formValues: any) => {
        if (!formValues.userId && !value) {
          return 'رقم هاتف المستأجر مطلوب';
        }
        return true;
      },
      validFormat: (value: string | undefined) => {
        if (!value) return true;
        return /^[0-9+\-\s()]{8,}$/.test(value) || 'رقم الهاتف غير صالح';
      }
    }
  },
  tenantWhatsappNumber: {
    validate: {
      validFormat: (value: string | undefined) => {
        if (!value) return true;
        return /^[0-9+\-\s()]{8,}$/.test(value) || 'رقم الواتساب غير صالح';
      }
    }
  },
  tenantIdNumber: {
    validate: {
      requiredIfNoUserId: (value: string | undefined, formValues: any) => {
        if (!formValues.userId && !value) {
          return 'رقم هوية المستأجر مطلوب';
        }
        return true;
      }
    }
  },
  
  // Reservation details
  unitId: {
    required: 'الوحدة العقارية مطلوبة'
  },
  contractType: {
    required: 'نوع العقد مطلوب'
  },
  startDate: {
    required: 'تاريخ بداية العقد مطلوب',
    validate: {
      isValidDate: (value: string) => {
        return !isNaN(Date.parse(value)) || 'تاريخ البداية غير صالح';
      }
    }
  },
  endDate: {
    required: 'تاريخ نهاية العقد مطلوب',
    validate: {
      isValidDate: (value: string) => {
        return !isNaN(Date.parse(value)) || 'تاريخ النهاية غير صالح';
      },
      isAfterStartDate: (value: string, formValues: any) => {
        if (!value || !formValues.startDate) return true;
        
        const startDate = new Date(formValues.startDate);
        const endDate = new Date(value);
        
        return endDate > startDate || 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية';
      }
    }
  },
  paymentMethod: {
    required: 'طريقة الدفع مطلوبة'
  },
  paymentSchedule: {
    required: 'جدول الدفع مطلوب'
  },
  depositAmount: {
    validate: {
      requiredIfDeposit: (value: number | undefined, formValues: any) => {
        if (formValues.includesDeposit && !value) {
          return 'مبلغ التأمين مطلوب';
        }
        return true;
      },
      minValue: (value: number | undefined) => {
        if (!value) return true;
        return value >= 0 || 'يجب أن يكون مبلغ التأمين 0 أو أكثر';
      }
    }
  },
  
  // Document uploads
  contractImage: {
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
  contractPdf: {
    validate: {
      acceptedFormats: (file: File | undefined) => {
        if (!file) return true;
        
        return file.type === 'application/pdf' || 'يرجى تحميل ملف بتنسيق PDF';
      },
      fileSize: (file: File | undefined) => {
        if (!file) return true;
        
        // Max size: 10MB
        const maxSize = 10 * 1024 * 1024;
        return file.size <= maxSize || 'حجم الملف كبير جدًا، الحد الأقصى هو 10 ميجابايت';
      }
    }
  }
};