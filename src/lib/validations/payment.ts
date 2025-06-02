import {
  createRequiredRule,
  createMinLengthRule,
  createMaxLengthRule,
  createDateRule,
  createFileValidationRule,
  FILE_TYPES,
  FILE_SIZE_LIMITS,
  validateDate,
} from './common';

export const paymentValidation = {
  reservationId: {
    ...createRequiredRule('الحجز مطلوب'),
    validate: {
      validSelection: (value: any) => {
        const num = Number(value);
        return (!isNaN(num) && num > 0) || 'يرجى اختيار حجز صالح';
      },
    },
  },
  
  amount: {
    ...createRequiredRule('مبلغ الدفعة مطلوب'),
    validate: {
      validAmount: (value: any) => {
        const num = Number(value);
        if (isNaN(num)) return 'المبلغ يجب أن يكون رقماً صالحاً';
        if (num <= 0) return 'المبلغ يجب أن يكون أكبر من صفر';
        if (num > 1000000000) return 'المبلغ كبير جداً';
        return true;
      },
    },
  },
  
  paymentDate: {
    ...createRequiredRule('تاريخ الدفع مطلوب'),
    validate: {
      validDate: (value: string) => {
        if (!validateDate(value)) return 'تاريخ الدفع غير صالح';
        
        // Allow past dates and today for payments
        const paymentDate = new Date(value);
        const today = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(today.getDate() + 30); // Allow up to 30 days in future
        
        if (paymentDate > futureLimit) {
          return 'تاريخ الدفع لا يمكن أن يكون في المستقبل البعيد (أكثر من 30 يوم)';
        }
        
        return true;
      },
    },
  },
  
  paymentMethod: {
    ...createRequiredRule('طريقة الدفع مطلوبة'),
    ...createMinLengthRule(2, 'طريقة الدفع قصيرة جداً'),
    ...createMaxLengthRule(50, 'طريقة الدفع طويلة جداً'),
  },
  
  status: {
    ...createRequiredRule('حالة الدفع مطلوبة'),
    validate: {
      validStatus: (value: string) => {
        const validStatuses = ['paid', 'pending', 'delayed', 'cancelled'];
        return validStatuses.includes(value) || 'حالة الدفع غير صالحة';
      },
    },
  },
  
  notes: {
    ...createMaxLengthRule(500, 'الملاحظات طويلة جداً (الحد الأقصى 500 حرف)'),
  },
  
  checkImage: {
    ...createFileValidationRule(
      FILE_TYPES.IMAGES,
      FILE_SIZE_LIMITS.IMAGE,
      'يرجى تحميل صورة الشيك (JPEG, PNG فقط)'
    ),
  },
};

// Helper function to validate complete payment form
export const validatePaymentForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required field checks
  if (!data.reservationId || Number(data.reservationId) <= 0) {
    errors.reservationId = 'يرجى اختيار حجز صالح';
  }
  
  const amount = Number(data.amount);
  if (!data.amount || isNaN(amount) || amount <= 0) {
    errors.amount = 'يرجى إدخال مبلغ صالح (أكبر من صفر)';
  }
  
  if (!data.paymentDate) {
    errors.paymentDate = 'تاريخ الدفع مطلوب';
  } else if (!validateDate(data.paymentDate)) {
    errors.paymentDate = 'تاريخ الدفع غير صالح';
  }
  
  if (!data.paymentMethod?.trim()) {
    errors.paymentMethod = 'طريقة الدفع مطلوبة';
  }
  
  if (!data.status) {
    errors.status = 'حالة الدفع مطلوبة';
  }

  // Conditional validation for check payments
  if (data.paymentMethod?.toLowerCase().includes('check') || 
      data.paymentMethod?.toLowerCase().includes('شيك')) {
    if (!data.checkImage) {
      errors.checkImage = 'صورة الشيك مطلوبة لدفعات الشيكات';
    }
  }

  return errors;
};

// Payment method options
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'نقدي' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'check', label: 'شيك' },
  { value: 'credit_card', label: 'بطاقة ائتمان' },
  { value: 'online_payment', label: 'دفع إلكتروني' },
];

// Payment status options
export const PAYMENT_STATUS_OPTIONS = [
  { value: 'paid', label: 'مدفوع', color: 'green' },
  { value: 'pending', label: 'في الانتظار', color: 'yellow' },
  { value: 'delayed', label: 'متأخر', color: 'red' },
  { value: 'cancelled', label: 'ملغي', color: 'gray' },
];

// Helper function to get payment status color
export const getPaymentStatusColor = (status: string): string => {
  const statusOption = PAYMENT_STATUS_OPTIONS.find(option => option.value === status);
  return statusOption?.color || 'gray';
};

// Helper function to format payment amount
export const formatPaymentAmount = (amount: number): string => {
  return new Intl.NumberFormat('ar-OM', {
    style: 'currency',
    currency: 'OMR',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
};
