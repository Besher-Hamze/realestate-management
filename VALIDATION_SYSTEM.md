# 🎯 Enhanced Validation System with Yup & React Hook Form

This document outlines the new validation system implemented for the Real Estate Management System using **Yup** schema validation and **React Hook Form** for better performance and developer experience.

## 🚀 **Overview**

The enhanced validation system provides:
- **Type-safe form validation** using Yup schemas
- **Better performance** with React Hook Form
- **Comprehensive validation rules** for all form fields
- **Arabic validation support** with custom validation methods
- **File upload validation** with size and format checks
- **Conditional validation** based on form state
- **Real-time validation feedback**

## 📦 **Installation**

First, install the required packages:

```bash
npm install react-hook-form @hookform/resolvers yup
npm install -D @types/yup
```

## 🏗️ **Architecture**

### **File Structure**
```
src/
├── lib/validations/
│   └── schemas.ts                 # Yup validation schemas
├── hooks/
│   └── useYupForm.ts             # Custom form hooks
├── components/
│   ├── ui/
│   │   └── FormInputs.tsx        # React Hook Form components
│   ├── companies/
│   │   └── CompanyFormYup.tsx    # Enhanced company form
│   ├── buildings/
│   │   └── BuildingFormYup.tsx   # Enhanced building form
│   └── units/
│       └── UnitFormYup.tsx       # Enhanced unit form
```

## 🔧 **Core Components**

### **1. Validation Schemas (`schemas.ts`)**

Comprehensive Yup schemas with custom validation methods:

```typescript
// Custom Arabic text validation
yup.addMethod(yup.string, 'arabicText', function (message = 'النص يجب أن يحتوي على أحرف عربية أو إنجليزية فقط') {
  return this.matches(arabicTextRegex, { message, excludeEmptyString: true });
});

// Saudi phone validation
yup.addMethod(yup.string, 'saudiPhone', function (message = 'رقم الهاتف غير صالح') {
  return this.matches(saudiPhoneRegex, { message, excludeEmptyString: true });
});

// File validation
yup.addMethod(yup.mixed, 'fileSize', function (maxSize: number, message = 'حجم الملف كبير جداً') {
  return this.test('fileSize', message, function (value) {
    if (!value) return true;
    if (value instanceof File) {
      return value.size <= maxSize;
    }
    return true;
  });
});
```

### **2. Custom Hooks (`useYupForm.ts`)**

Multiple hooks for different use cases:

- **`useYupForm`**: Basic form with Yup validation
- **`useAsyncForm`**: Form with async submission handling
- **`useFileForm`**: Form with file upload support
- **`useMultiStepForm`**: Multi-step form validation

### **3. Form Components (`FormInputs.tsx`)**

React Hook Form compatible components:

- **`FormInput`**: Text input with validation
- **`FormTextArea`**: Textarea with validation  
- **`FormSelect`**: Select dropdown with validation
- **`FormFileInput`**: File upload with drag & drop

## 📋 **Validation Rules**

### **Company Validation**
```typescript
export const companySchema = yup.object({
  name: yup
    .string()
    .required('اسم الشركة مطلوب')
    .min(2, 'اسم الشركة يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم الشركة طويل جداً')
    .arabicText(),

  email: yup
    .string()
    .required('البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صالح'),

  phone: yup
    .string()
    .required('رقم الهاتف مطلوب')
    .saudiPhone(),

  // File validations
  logoImage: yup
    .mixed()
    .nullable()
    .fileSize(MAX_FILE_SIZE, 'حجم الشعار يجب أن يكون أقل من 10 ميجابايت')
    .fileFormat(SUPPORTED_IMAGE_FORMATS, 'يجب أن يكون الشعار صورة'),

  // Conditional validation for manager
  managerFullName: yup
    .string()
    .when('$isCreating', {
      is: true,
      then: (schema) => schema.required('اسم المدير مطلوب'),
      otherwise: (schema) => schema.nullable()
    }),
});
```

### **Building Validation**
```typescript
export const buildingSchema = yup.object({
  companyId: yup
    .number()
    .required('الشركة مطلوبة')
    .positive('يرجى اختيار شركة صالحة'),

  totalUnits: yup
    .number()
    .required('إجمالي الوحدات مطلوب')
    .positive('يجب أن يكون عدد الوحدات أكبر من صفر')
    .max(1000, 'عدد الوحدات كبير جداً'),
});
```

### **Payment Validation**
```typescript
export const paymentSchema = yup.object({
  reservationId: yup
    .number()
    .required('الحجز مطلوب')
    .positive('يرجى اختيار حجز صالح'),

  amount: yup
    .number()
    .required('المبلغ مطلوب')
    .positive('المبلغ يجب أن يكون أكبر من صفر')
    .max(10000000, 'المبلغ كبير جداً'),

  paymentDate: yup
    .date()
    .required('تاريخ الدفع مطلوب')
    .max(new Date(), 'تاريخ الدفع لا يمكن أن يكون في المستقبل'),

  paymentMethod: yup
    .string()
    .required('طريقة الدفع مطلوبة')
    .oneOf(['cash', 'bank_transfer', 'check', 'credit_card', 'online']),

  // Conditional validation for check payments
  checkNumber: yup
    .string()
    .when('paymentMethod', {
      is: 'check',
      then: (schema) => schema.required('رقم الشيك مطلوب'),
      otherwise: (schema) => schema.nullable()
    }),

  // File validation for check image
  checkImage: yup
    .mixed()
    .when('paymentMethod', {
      is: 'check',
      then: (schema) => schema
        .required('صورة الشيك مطلوبة')
        .fileSize(MAX_FILE_SIZE)
        .fileFormat(SUPPORTED_IMAGE_FORMATS),
      otherwise: (schema) => schema.nullable()
    }),
});
```

## 🎯 **Usage Examples**

### **Basic Form Usage**
```typescript
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useAsyncForm<CompanyFormData>(companySchema, defaultValues);

const onSubmit = async (data: CompanyFormData) => {
  // Handle form submission
  const response = await companiesApi.create(data);
  // Success handling
};

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <FormInput
      label="اسم الشركة"
      register={register}
      name="name"
      error={errors.name}
      required
    />
  </form>
);
```

### **File Upload Usage**
```typescript
const { control, setValue } = useFileForm<CompanyFormData>(companySchema);

const handleFileChange = (fieldName: keyof CompanyFormData) => (files: FileList | null) => {
  const file = files?.[0] || null;
  setValue(fieldName, file as any, { shouldValidate: true });
};

return (
  <Controller
    name="logoImage"
    control={control}
    render={({ field, fieldState }) => (
      <FormFileInput
        label="شعار الشركة"
        name="logoImage"
        accept="image/jpeg,image/png"
        onChange={handleFileChange('logoImage')}
        error={fieldState.error}
      />
    )}
  />
);
```

### **Conditional Validation**
```typescript
// In schema definition
unitLayout: yup
  .string()
  .nullable()
  .when('unitType', {
    is: 'apartment',
    then: (schema) => schema.required('تخطيط الوحدة مطلوب للشقق'),
    otherwise: (schema) => schema.nullable()
  }),

// In component
const watchedUnitType = watch('unitType');

useEffect(() => {
  if (watchedUnitType !== 'apartment') {
    setValue('unitLayout', null);
  }
}, [watchedUnitType, setValue]);

// Conditional rendering
{watchedUnitType === 'apartment' && (
  <FormSelect
    label="تخطيط الوحدة"
    register={register}
    name="unitLayout"
    error={errors.unitLayout}
    options={UNIT_LAYOUT_OPTIONS}
  />
)}
```

## ✨ **Key Features**

### **1. Arabic Language Support**
- **RTL layout** compatibility
- **Arabic text validation** with regex patterns
- **Saudi phone number** validation
- **Localized error messages** in Arabic

### **2. File Upload Validation**
- **File size limits** (10MB max)
- **File format validation** (JPEG, PNG, PDF, etc.)
- **Drag & drop interface**
- **File preview support**

### **3. Advanced Validation**
- **Conditional validation** based on field values
- **Cross-field validation** for related fields
- **Real-time validation** on field change
- **Form-level validation** on submit

### **4. Performance Optimizations**
- **Minimal re-renders** with React Hook Form
- **On-demand validation** (validate on change)
- **Efficient error handling**
- **Optimized component updates**

## 🎨 **Form Sections**

Each form is organized into logical sections:

### **Company Form Sections**
1. **Basic Company Information** - Name, type, contact details
2. **Documents and Images** - Logo and identity verification  
3. **Manager Information** - Auto-creates manager account

### **Payment Form Sections**
1. **Basic Payment Information** - Reservation, amount, date, method, status
2. **Payment Method Details** - Conditional fields based on payment method
3. **File Attachments** - Check images, receipts, and documents
4. **Additional Information** - Late fees, due dates, and notes

### **Unit Form Sections**
1. **Basic Unit Information** - Building, number, type
2. **Unit Specifications** - Layout, floor, area, price
3. **Additional Information** - Description and features

## 🔄 **Migration Guide**

To migrate from the old validation system:

1. **Install dependencies**:
   ```bash
   npm install react-hook-form @hookform/resolvers yup
   ```

2. **Replace old forms** with new Yup versions:
   ```typescript
   // Old
   import CompanyForm from '@/components/companies/CompanyForm';
   
   // New
   import CompanyFormYup from '@/components/companies/CompanyFormYup';
   ```

3. **Update imports** for form components:
   ```typescript
   // Old
   import { Input, Select } from '@/components/ui/FormInput';
   
   // New  
   import { FormInput, FormSelect } from '@/components/ui/FormInputs';
   ```

4. **Update validation usage**:
   ```typescript
   // Old - Custom validation
   const [errors, setErrors] = useState({});
   
   // New - Yup validation
   const { formState: { errors } } = useYupForm(schema);
   ```

## 🛠️ **Best Practices**

1. **Schema Organization**: Keep schemas in separate files by domain
2. **Error Messages**: Use clear, actionable Arabic error messages
3. **File Validation**: Always validate file size and format
4. **Conditional Logic**: Use Yup's `when()` for complex conditional validation
5. **Performance**: Use `mode: 'onChange'` for real-time validation
6. **TypeScript**: Leverage `yup.InferType` for type safety

## 🎯 **Benefits**

✅ **Type Safety**: Full TypeScript support with inferred types  
✅ **Performance**: Minimal re-renders and optimized validation  
✅ **Developer Experience**: Better error handling and debugging  
✅ **User Experience**: Real-time validation and clear error messages  
✅ **Maintainability**: Centralized validation logic and reusable components  
✅ **Scalability**: Easy to extend and add new validation rules  
✅ **Accessibility**: Proper ARIA attributes and semantic HTML  

## 🎉 **Conclusion**

The new Yup validation system provides a robust, performant, and user-friendly solution for form validation in the Real Estate Management System. It combines the power of Yup schema validation with React Hook Form's performance optimizations to deliver an excellent developer and user experience.
