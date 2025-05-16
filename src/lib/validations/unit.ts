export const unitValidation = {
  buildingId: {
    required: 'المبنى مطلوب'
  },
  unitNumber: {
    required: 'رقم الوحدة مطلوب',
    minLength: {
      value: 1,
      message: 'يجب أن يحتوي رقم الوحدة على حرف واحد على الأقل'
    }
  },
  unitType: {
    required: 'نوع الوحدة مطلوب'
  },
  floor: {
    required: 'الطابق مطلوب',
    min: {
      value: 0,
      message: 'يجب أن يكون الطابق 0 أو أكثر'
    }
  },
  area: {
    required: 'المساحة مطلوبة',
    min: {
      value: 1,
      message: 'يجب أن تكون المساحة 1 متر مربع على الأقل'
    }
  },
  bedrooms: {
    required: 'عدد غرف النوم مطلوب',
    min: {
      value: 0,
      message: 'يجب أن يكون عدد غرف النوم 0 أو أكثر'
    }
  },
  bathrooms: {
    required: 'عدد الحمامات مطلوب',
    min: {
      value: 0,
      message: 'يجب أن يكون عدد الحمامات 0 أو أكثر'
    }
  },
  price: {
    required: 'السعر مطلوب',
    min: {
      value: 1,
      message: 'يجب أن يكون السعر 1 على الأقل'
    }
  },
  status: {
    required: 'حالة الوحدة مطلوبة'
  },
  description: {
    maxLength: {
      value: 1000,
      message: 'يجب أن لا يتجاوز الوصف 1000 حرف'
    }
  }
};