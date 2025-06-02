import {
  createRequiredRule,
  createMinLengthRule,
  createMaxLengthRule,
  createNumberRule,
  VALIDATION_MESSAGES,
} from './common';

export const unitValidation = {
  buildingId: {
    ...createRequiredRule('المبنى مطلوب'),
    validate: {
      validSelection: (value: any) => {
        const num = Number(value);
        return (!isNaN(num) && num > 0) || 'يرجى اختيار مبنى صالح';
      },
    },
  },
  
  unitNumber: {
    ...createRequiredRule('رقم الوحدة مطلوب'),
    ...createMinLengthRule(1, 'رقم الوحدة قصير جداً'),
    ...createMaxLengthRule(20, 'رقم الوحدة طويل جداً'),
  },
  
  unitType: {
    ...createRequiredRule('نوع الوحدة مطلوب'),
    validate: {
      validType: (value: string) => {
        const validTypes = ['studio', 'apartment', 'shop', 'office', 'villa', 'room'];
        return validTypes.includes(value) || 'نوع الوحدة غير صالح';
      },
    },
  },
  
  unitLayout: {
    validate: {
      validLayout: (value: string) => {
        if (!value) return true; // Optional field
        const validLayouts = ['studio', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk', '6bhk', '7bhk', 'other'];
        return validLayouts.includes(value) || 'تخطيط الوحدة غير صالح';
      },
    },
  },
  
  floor: {
    ...createRequiredRule('الطابق مطلوب'),
    ...createMaxLengthRule(10, 'رقم الطابق طويل جداً'),
  },
  
  area: {
    ...createRequiredRule('المساحة مطلوبة'),
    validate: {
      validArea: (value: any) => {
        const num = Number(value);
        if (isNaN(num)) return 'المساحة يجب أن تكون رقماً صالحاً';
        if (num <= 0) return 'المساحة يجب أن تكون أكبر من صفر';
        if (num > 100000) return 'المساحة كبيرة جداً (الحد الأقصى 100,000 متر مربع)';
        return true;
      },
    },
  },
  
  bathrooms: {
    ...createRequiredRule('عدد دورات المياه مطلوب'),
    validate: {
      validNumber: (value: any) => {
        const num = Number(value);
        if (isNaN(num)) return 'عدد دورات المياه يجب أن يكون رقماً صالحاً';
        if (num < 0) return 'عدد دورات المياه لا يمكن أن يكون سالباً';
        if (num > 50) return 'عدد دورات المياه كبير جداً';
        return true;
      },
    },
  },
  
  price: {
    ...createRequiredRule('السعر مطلوب'),
    validate: {
      validPrice: (value: any) => {
        const num = Number(value);
        if (isNaN(num)) return 'السعر يجب أن يكون رقماً صالحاً';
        if (num <= 0) return 'السعر يجب أن يكون أكبر من صفر';
        if (num > 1000000000) return 'السعر كبير جداً';
        return true;
      },
    },
  },
  
  status: {
    ...createRequiredRule('حالة الوحدة مطلوبة'),
    validate: {
      validStatus: (value: string) => {
        const validStatuses = ['available', 'rented', 'maintenance'];
        return validStatuses.includes(value) || 'حالة الوحدة غير صالحة';
      },
    },
  },
  
  description: {
    ...createMaxLengthRule(1000, 'الوصف طويل جداً (الحد الأقصى 1000 حرف)'),
  },
};

// Helper function to validate complete unit form
export const validateUnitForm = (data: any): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required field checks
  if (!data.buildingId || Number(data.buildingId) <= 0) {
    errors.buildingId = 'يرجى اختيار مبنى صالح';
  }
  
  if (!data.unitNumber?.trim()) {
    errors.unitNumber = 'رقم الوحدة مطلوب';
  }
  
  if (!data.unitType) {
    errors.unitType = 'نوع الوحدة مطلوب';
  }
  
  if (!data.floor?.trim()) {
    errors.floor = 'الطابق مطلوب';
  }
  
  if (!data.status) {
    errors.status = 'حالة الوحدة مطلوبة';
  }
  
  // Number validations
  const area = Number(data.area);
  if (!data.area || isNaN(area) || area <= 0) {
    errors.area = 'يرجى إدخال مساحة صالحة (أكبر من صفر)';
  }
  
  const bathrooms = Number(data.bathrooms);
  if (data.bathrooms === undefined || data.bathrooms === '' || isNaN(bathrooms) || bathrooms < 0) {
    errors.bathrooms = 'يرجى إدخال عدد دورات مياه صالح (صفر أو أكثر)';
  }
  
  const price = Number(data.price);
  if (!data.price || isNaN(price) || price <= 0) {
    errors.price = 'يرجى إدخال سعر صالح (أكبر من صفر)';
  }

  return errors;
};

// Unit type and layout options for dropdowns
export const UNIT_TYPE_OPTIONS = [
  { value: 'studio', label: 'استوديو' },
  { value: 'apartment', label: 'شقة' },
  { value: 'shop', label: 'محل تجاري' },
  { value: 'office', label: 'مكتب' },
  { value: 'villa', label: 'فيلا' },
  { value: 'room', label: 'غرفة' },
];

export const UNIT_LAYOUT_OPTIONS = [
  { value: 'studio', label: 'استوديو' },
  { value: '1bhk', label: 'غرفة وصالة' },
  { value: '2bhk', label: 'غرفتين وصالة' },
  { value: '3bhk', label: '3 غرف وصالة' },
  { value: '4bhk', label: '4 غرف وصالة' },
  { value: '5bhk', label: '5 غرف وصالة' },
  { value: '6bhk', label: '6 غرف وصالة' },
  { value: '7bhk', label: '7 غرف وصالة' },
  { value: 'other', label: 'أخرى' },
];

export const UNIT_STATUS_OPTIONS = [
  { value: 'available', label: 'متاحة' },
  { value: 'rented', label: 'مؤجرة' },
  { value: 'maintenance', label: 'تحت الصيانة' },
];
