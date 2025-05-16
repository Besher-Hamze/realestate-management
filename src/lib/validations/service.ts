export const serviceOrderValidation = {
  reservationId: {
    required: 'الحجز مطلوب'
  },
  serviceType: {
    required: 'نوع الخدمة مطلوب'
  },
  serviceSubtype: {
    required: 'نوع الخدمة الفرعي مطلوب'
  },
  description: {
    required: 'وصف الخدمة مطلوب',
    minLength: {
      value: 10,
      message: 'يجب أن يحتوي الوصف على 10 أحرف على الأقل'
    },
    maxLength: {
      value: 1000,
      message: 'يجب أن لا يتجاوز الوصف 1000 حرف'
    }
  },
  attachmentFile: {
    validate: {
      acceptedFormats: (file: File | undefined) => {
        if (!file) return true;
        
        const acceptedFormats = [
          'image/jpeg', 
          'image/png', 
          'image/gif', 
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        return acceptedFormats.includes(file.type) || 'يرجى تحميل ملف بتنسيق صالح (صورة/PDF/DOC/DOCX)';
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