export const paymentValidation = {
  reservationId: {
    required: 'الحجز مطلوب'
  },
  amount: {
    required: 'المبلغ مطلوب',
    min: {
      value: 1,
      message: 'يجب أن يكون المبلغ 1 على الأقل'
    }
  },
  paymentDate: {
    required: 'تاريخ الدفع مطلوب',
    validate: {
      isValidDate: (value: string) => {
        return !isNaN(Date.parse(value)) || 'تاريخ الدفع غير صالح';
      }
    }
  },
  paymentMethod: {
    required: 'طريقة الدفع مطلوبة'
  },
  status: {
    required: 'حالة الدفع مطلوبة'
  },
  notes: {
    maxLength: {
      value: 500,
      message: 'يجب أن لا تتجاوز الملاحظات 500 حرف'
    }
  },
  checkImage: {
    validate: {
      requiredIfCheck: (file: File | undefined, formValues: any) => {
        if (formValues.paymentMethod === 'check' && !file) {
          return 'صورة الشيك مطلوبة عند اختيار طريقة الدفع بالشيك';
        }
        return true;
      },
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