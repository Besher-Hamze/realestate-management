import {
  createRequiredRule,
  createMinLengthRule,
  createMaxLengthRule,
  createNumberRule,
  VALIDATION_MESSAGES,
} from './common';

export const buildingValidation = {
  companyId: {
    ...createRequiredRule('الشركة مطلوبة'),
    validate: {
      validSelection: (value: any) => {
        const num = Number(value);
        return (!isNaN(num) && num > 0) || 'يرجى اختيار شركة صالحة';
      },
    },
  },
  
  buildingNumber: {
    ...createRequiredRule('رقم المبنى مطلوب'),
    ...createMinLengthRule(1, 'رقم المبنى قصير جداً'),
    ...createMaxLengthRule(50, 'رقم المبنى طويل جداً'),
  },
  
  name: {
    ...createRequiredRule('اسم المبنى مطلوب'),
    ...createMinLengthRule(2, 'اسم المبنى قصير جداً'),
    ...createMaxLengthRule(100, 'اسم المبنى طويل جداً'),
  },
  
  address: {
    ...createRequiredRule('عنوان المبنى مطلوب'),
    ...createMinLengthRule(5, 'العنوان قصير جداً'),
    ...createMaxLengthRule(255, 'العنوان طويل جداً'),
  },
  
  buildingType: {
    ...createRequiredRule('نوع المبنى مطلوب'),
    validate: {
      validType: (value: string) => {
        const validTypes = ['residential', 'commercial', 'mixed'];
        return validTypes.includes(value) || 'نوع المبنى غير صالح';
      },
    },
  },
  
  totalUnits: {
    ...createRequiredRule('إجمالي الوحدات مطلوب'),
    validate: {
      validNumber: (value: any) => {
        const num = Number(value);
        if (isNaN(num)) return VALIDATION_MESSAGES.INVALID_NUMBER;
        if (num < 1) return 'يجب أن يكون عدد الوحدات أكبر من صفر';
        if (num > 1000) return 'عدد الوحدات كبير جداً (الحد الأقصى 1000)';
        return true;
      },
    },
  },
  
  totalFloors: {
    ...createRequiredRule('إجمالي الطوابق مطلوب'),
    validate: {
      validNumber: (value: any) => {
        const num = Number(value);
        if (isNaN(num)) return VALIDATION_MESSAGES.INVALID_NUMBER;
        if (num < 1) return 'يجب أن يكون عدد الطوابق أكبر من صفر';
        if (num > 200) return 'عدد الطوابق كبير جداً (الحد الأقصى 200)';
        return true;
      },
    },
  },
  
  internalParkingSpaces: {
    validate: {
      validNumber: (value: any) => {
        if (!value || value === '') return true; // Optional field
        const num = Number(value);
        if (isNaN(num)) return VALIDATION_MESSAGES.INVALID_NUMBER;
        if (num < 0) return 'عدد مواقف السيارات لا يمكن أن يكون سالباً';
        if (num > 10000) return 'عدد مواقف السيارات كبير جداً';
        return true;
      },
    },
  },
  
  description: {
    ...createMaxLengthRule(500, 'الوصف طويل جداً (الحد الأقصى 500 حرف)'),
  },
};

// Helper function to validate complete building form
export const validateBuildingForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required field checks
  if (!data.companyId || Number(data.companyId) <= 0) {
    errors.companyId = 'يرجى اختيار شركة صالحة';
  }
  
  if (!data.buildingNumber?.trim()) {
    errors.buildingNumber = 'رقم المبنى مطلوب';
  }
  
  if (!data.name?.trim()) {
    errors.name = 'اسم المبنى مطلوب';
  }
  
  if (!data.address?.trim()) {
    errors.address = 'عنوان المبنى مطلوب';
  }
  
  if (!data.buildingType) {
    errors.buildingType = 'نوع المبنى مطلوب';
  }
  
  // Number validations
  const totalUnits = Number(data.totalUnits);
  if (!data.totalUnits || isNaN(totalUnits) || totalUnits < 1) {
    errors.totalUnits = 'يرجى إدخال عدد وحدات صالح (أكبر من صفر)';
  }
  
  const totalFloors = Number(data.totalFloors);
  if (!data.totalFloors || isNaN(totalFloors) || totalFloors < 1) {
    errors.totalFloors = 'يرجى إدخال عدد طوابق صالح (أكبر من صفر)';
  }
  
  // Optional number validation
  if (data.internalParkingSpaces !== undefined && data.internalParkingSpaces !== '') {
    const parkingSpaces = Number(data.internalParkingSpaces);
    if (isNaN(parkingSpaces) || parkingSpaces < 0) {
      errors.internalParkingSpaces = 'عدد مواقف السيارات غير صالح';
    }
  }

  return errors;
};
