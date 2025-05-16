export const buildingValidation = {
  companyId: {
    required: 'الشركة مطلوبة'
  },
  buildingNumber: {
    required: 'رقم المبنى مطلوب',
    minLength: {
      value: 1,
      message: 'يجب أن يحتوي رقم المبنى على حرف واحد على الأقل'
    }
  },
  name: {
    required: 'اسم المبنى مطلوب',
    minLength: {
      value: 3,
      message: 'يجب أن يحتوي اسم المبنى على 3 أحرف على الأقل'
    }
  },
  address: {
    required: 'عنوان المبنى مطلوب',
    minLength: {
      value: 5,
      message: 'يجب أن يحتوي العنوان على 5 أحرف على الأقل'
    }
  },
  buildingType: {
    required: 'نوع المبنى مطلوب'
  },
  totalUnits: {
    required: 'عدد الوحدات مطلوب',
    min: {
      value: 1,
      message: 'يجب أن يكون عدد الوحدات 1 على الأقل'
    }
  },
  totalFloors: {
    required: 'عدد الطوابق مطلوب',
    min: {
      value: 1,
      message: 'يجب أن يكون عدد الطوابق 1 على الأقل'
    }
  },
  internalParkingSpaces: {
    required: 'عدد مواقف السيارات الداخلية مطلوب',
    min: {
      value: 0,
      message: 'يجب أن يكون عدد مواقف السيارات 0 على الأقل'
    }
  },
  description: {
    maxLength: {
      value: 1000,
      message: 'يجب أن لا يتجاوز الوصف 1000 حرف'
    }
  }
};