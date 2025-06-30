import * as yup from 'yup';

// Common validation patterns
const arabicTextRegex = /^[\u0600-\u06FF\s\w\d\-_().]+$/;
const phoneRegex = /^[+]?[0-9\s\-()]{7,20}$/;
const generalPhoneRegex = /^\+?[\d\s()-]{7,15}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// File validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_IMAGE_FORMATS = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_DOCUMENT_FORMATS = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Custom validation methods
yup.addMethod(yup.string, 'arabicText', function (message = 'النص يجب أن يحتوي على أحرف عربية أو إنجليزية فقط') {
  return this.matches(arabicTextRegex, { message, excludeEmptyString: true });
});

yup.addMethod(yup.string, 'anyPhone', function (message = 'Invalid phone number') {
  return this.matches(generalPhoneRegex, {
    message,
    excludeEmptyString: true
  });
});

yup.addMethod(yup.mixed, 'fileSize', function (maxSize: number, message = 'حجم الملف كبير جداً') {
  return this.test('fileSize', message, function (value) {
    if (!value) return true; // Allow empty files if not required
    if (value instanceof File) {
      return value.size <= maxSize;
    }
    return true;
  });
});

yup.addMethod(yup.mixed, 'fileFormat', function (supportedFormats: string[], message = 'نوع الملف غير مدعوم') {
  return this.test('fileFormat', message, function (value) {
    if (!value) return true; // Allow empty files if not required
    if (value instanceof File) {
      return supportedFormats.includes(value.type);
    }
    return true;
  });
});

// Extend Yup interface for TypeScript
declare module 'yup' {
  interface StringSchema {
    arabicText(message?: string): StringSchema;
    saudiPhone(message?: string): StringSchema;
  }
  interface MixedSchema {
    fileSize(maxSize: number, message?: string): MixedSchema;
    fileFormat(supportedFormats: string[], message?: string): MixedSchema;
  }
}

// ===== COMPANY VALIDATION SCHEMA =====
export const companySchema = yup.object({
  name: yup
    .string()
    .required('اسم الشركة مطلوب')
    .min(2, 'اسم الشركة يجب أن يكون حرفين على الأقل')
    .max(100, 'اسم الشركة طويل جداً')
    .arabicText(),

  companyType: yup
    .string()
    .required('نوع الشركة مطلوب')
    .oneOf(['owner', 'agency'], 'نوع الشركة غير صالح'),

  email: yup
    .string()
    .required('البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صالح')
    .matches(emailRegex, 'صيغة البريد الإلكتروني غير صحيحة'),

  phone: yup
    .string()
    .required('رقم الهاتف مطلوب'),
  whatsappNumber: yup
    .string()
    .nullable(),
  secondaryPhone: yup
    .string()
    .nullable()
    .matches(phoneRegex, 'رقم الهاتف الثانوي غير صالح'),

  address: yup
    .string()
    .required('عنوان الشركة مطلوب')
    .min(5, 'العنوان قصير جداً')
    .max(255, 'العنوان طويل جداً'),

  registrationNumber: yup
    .string()
    .when('companyType', {
      is: 'agency',
      then: (schema) => schema
        .required('رقم التسجيل مطلوب للشركات المالكة')
        .min(1, 'رقم التسجيل قصير جداً')
        .max(50, 'رقم التسجيل طويل جداً'),
      otherwise: (schema) => schema
        .nullable()
        .min(1, 'رقم التسجيل قصير جداً')
        .max(50, 'رقم التسجيل طويل جداً')
    }),

  delegateName: yup
    .string()
    .nullable()
    .min(2, 'اسم المفوض قصير جداً')
    .max(100, 'اسم المفوض طويل جداً')
    .arabicText(),

  // File validations
  logoImage: yup
    .mixed()
    .nullable()
    .fileSize(MAX_FILE_SIZE, 'حجم الشعار يجب أن يكون أقل من 10 ميجابايت')
    .fileFormat(SUPPORTED_IMAGE_FORMATS, 'يجب أن يكون الشعار صورة (JPEG, PNG, GIF, WebP)'),

  identityImageFront: yup
    .mixed()
    .required('صورة الهوية الأمامية مطلوبة')
    .fileSize(MAX_FILE_SIZE, 'حجم صورة الهوية كبير جداً')
    .fileFormat(SUPPORTED_IMAGE_FORMATS, 'يجب أن تكون صورة الهوية بصيغة صورة صحيحة'),

  identityImageBack: yup
    .mixed()
    .required('صورة الهوية الخلفية مطلوبة')
    .fileSize(MAX_FILE_SIZE, 'حجم صورة الهوية كبير جداً')
    .fileFormat(SUPPORTED_IMAGE_FORMATS, 'يجب أن تكون صورة الهوية بصيغة صورة صحيحة'),

  // Manager fields (conditional)
  managerFullName: yup
    .string()
    .when('$isCreating', {
      is: true,
      then: (schema) => schema
        .required('اسم المدير مطلوب')
        .min(2, 'اسم المدير قصير جداً')
        .max(100, 'اسم المدير طويل جداً')
        .arabicText(),
      otherwise: (schema) => schema.nullable()
    }),

  managerEmail: yup
    .string()
    .when('$isCreating', {
      is: true,
      then: (schema) => schema
        .required('البريد الإلكتروني للمدير مطلوب')
        .email('البريد الإلكتروني للمدير غير صالح'),
      otherwise: (schema) => schema.nullable()
    }),

  managerPhone: yup
    .string()
    .when('$isCreating', {
      is: true,
      then: (schema) => schema
        .required('رقم هاتف المدير مطلوب'), otherwise: (schema) => schema.nullable()
    }),
});


// Export schema types for TypeScript
export type CompanyFormData = yup.InferType<typeof companySchema>;
export type BuildingFormData = yup.InferType<typeof buildingSchema>;
export type UnitFormData = yup.InferType<typeof unitSchema>;
export type UserFormData = yup.InferType<typeof userSchema>;
export type PaymentFormData = yup.InferType<typeof paymentSchema>;
export type ReservationFormData = yup.InferType<typeof reservationSchema>;

// ===== BUILDING VALIDATION SCHEMA =====
export const buildingSchema = yup.object({

  buildingNumber: yup
    .string()
    .required('رقم المبنى مطلوب')
    .min(1, 'رقم المبنى قصير جداً')
    .max(50, 'رقم المبنى طويل جداً'),

  name: yup
    .string()
    .required('اسم المبنى مطلوب')
    .min(2, 'اسم المبنى قصير جداً')
    .max(100, 'اسم المبنى طويل جداً')
    .arabicText(),

  address: yup
    .string()
    .required('عنوان المبنى مطلوب')
    .min(5, 'العنوان قصير جداً')
    .max(255, 'العنوان طويل جداً'),

  buildingType: yup
    .string()
    .required('نوع المبنى مطلوب')
    .oneOf(['residential', 'commercial', 'mixed'], 'نوع المبنى غير صالح'),

  totalUnits: yup
    .number()
    .transform((value, originalValue) => {
      // If it's an empty string, return undefined to trigger required validation
      if (originalValue === '') return undefined;
      // If it's not a number, return NaN to trigger typeError
      return Number(originalValue);
    })
    .required('إجمالي الوحدات مطلوب')
    .positive('يجب أن يكون عدد الوحدات أكبر من صفر')
    .integer('عدد الوحدات يجب أن يكون رقماً صحيحاً')
    .max(1000, 'عدد الوحدات كبير جداً (الحد الأقصى 1000)')
    .typeError('يرجى إدخال رقم صالح فقط'),

  totalFloors: yup
    .number()
    .transform((value, originalValue) => {
      // If it's an empty string, return undefined to trigger required validation
      if (originalValue === '') return undefined;
      // If it's not a number, return NaN to trigger typeError
      return Number(originalValue);
    })
    .required('إجمالي الطوابق مطلوب')
    .positive('يجب أن يكون عدد الطوابق أكبر من صفر')
    .integer('عدد الطوابق يجب أن يكون رقماً صحيحاً')
    .max(200, 'عدد الطوابق كبير جداً (الحد الأقصى 200)')
    .typeError('يرجى إدخال رقم صالح فقط'),

  internalParkingSpaces: yup
    .number()
    .transform((value, originalValue) => {
      // If it's an empty string, return null for nullable fields
      if (originalValue === '') return null;
      // If it's not a number, return NaN to trigger typeError
      return Number(originalValue);
    })
    .nullable()
    .min(0, 'عدد مواقف السيارات لا يمكن أن يكون سالباً')
    .integer('عدد مواقف السيارات يجب أن يكون رقماً صحيحاً')
    .max(10000, 'عدد مواقف السيارات كبير جداً')
    .typeError('يرجى إدخال رقم صالح فقط'),

  description: yup
    .string()
    .nullable()
    .max(500, 'الوصف طويل جداً (الحد الأقصى 500 حرف)'),
});

// ===== UNIT VALIDATION SCHEMA =====
export const unitSchema = yup.object({
  buildingId: yup
    .number()
    .required('المبنى مطلوب')
    .positive('يرجى اختيار مبنى صالح')
    .integer('معرف المبنى غير صالح'),
  ownerId: yup
    .number()
    .required('المالك مطلوب')
    .positive('يرجى اختيار مالك صالح')
    .integer('معرف المالك غير صالح'),
  unitNumber: yup
    .string()
    .required('رقم الوحدة مطلوب')
    .min(1, 'رقم الوحدة قصير جداً')
    .max(20, 'رقم الوحدة طويل جداً'),

  unitType: yup
    .string()
    .required('نوع الوحدة مطلوب')
    .oneOf(['studio', 'apartment', 'shop', 'office', 'villa', 'room'], 'نوع الوحدة غير صالح'),

  unitLayout: yup
    .string()
    .nullable()
    .when('unitType', {
      is: 'apartment',
      then: (schema) => schema.oneOf(['studio', '1bhk', '2bhk', '3bhk', '4bhk', '5bhk', '6bhk', '7bhk', 'other'], 'تخطيط الوحدة غير صالح'),
      otherwise: (schema) => schema.nullable()
    }),

  floor: yup
    .string()
    .required('الطابق مطلوب')
    .max(10, 'رقم الطابق طويل جداً'),

  area: yup
    .number()
    .transform((value, originalValue) => {
      // If it's an empty string, return undefined to trigger required validation
      if (originalValue === '') return undefined;
      // If it's not a number, return NaN to trigger typeError
      return Number(originalValue);
    })
    .required('المساحة مطلوبة')
    .positive('المساحة يجب أن تكون أكبر من صفر')
    .max(100000, 'المساحة كبيرة جداً (الحد الأقصى 100,000 متر مربع)')
    .typeError('يرجى إدخال رقم صالح للمساحة'),

  bathrooms: yup
    .number()
    .transform((value, originalValue) => {
      // If it's an empty string, return undefined to trigger required validation
      if (originalValue === '') return undefined;
      // If it's not a number, return NaN to trigger typeError
      return Number(originalValue);
    })
    .required('عدد دورات المياه مطلوب')
    .min(0, 'عدد دورات المياه لا يمكن أن يكون سالباً')
    .integer('عدد دورات المياه يجب أن يكون رقماً صحيحاً')
    .max(50, 'عدد دورات المياه كبير جداً')
    .typeError('يرجى إدخال رقم صالح لعدد الحمامات'),

  price: yup
    .number()
    .transform((value, originalValue) => {
      // If it's an empty string, return undefined to trigger required validation
      if (originalValue === '') return undefined;
      // If it's not a number, return NaN to trigger typeError
      return Number(originalValue);
    })
    .required('السعر مطلوب')
    .positive('السعر يجب أن يكون أكبر من صفر')
    .max(1000000000, 'السعر كبير جداً')
    .typeError('يرجى إدخال مبلغ صالح للسعر'),

  status: yup
    .string()
    .required('حالة الوحدة مطلوبة')
    .oneOf(['available', 'rented', 'maintenance'], 'حالة الوحدة غير صالحة'),

  description: yup
    .string()
    .nullable()
    .max(1000, 'الوصف طويل جداً (الحد الأقصى 1000 حرف)'),
});

// ===== USER/TENANT VALIDATION SCHEMA =====
export const userSchema = yup.object({
  username: yup
    .string()
    .required('اسم المستخدم مطلوب')
    .min(3, 'اسم المستخدم قصير جداً')
    .max(50, 'اسم المستخدم طويل جداً')
    .matches(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط'),

  password: yup
    .string()
    .required('كلمة المرور مطلوبة')
    .min(8, 'كلمة المرور قصيرة جداً (8 أحرف على الأقل)')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم'),

  fullName: yup
    .string()
    .required('الاسم الكامل مطلوب')
    .min(2, 'الاسم الكامل قصير جداً')
    .max(100, 'الاسم الكامل طويل جداً')
    .arabicText(),

  email: yup
    .string()
    .required('البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صالح'),

  phone: yup
    .string()
    .required('رقم الهاتف مطلوب'),

  whatsappNumber: yup
    .string()
    .nullable(),
  idNumber: yup
    .string()
    .required('رقم الهوية مطلوب')
    .matches(/^[0-9]{10}$/, 'رقم الهوية يجب أن يكون 10 أرقام'),
});

// ===== RESERVATION VALIDATION SCHEMA =====


// ===== EXPENSE VALIDATION SCHEMA =====
export const expenseSchema = yup.object({
  unitId: yup
    .number()
    .required('الوحدة مطلوبة')
    .positive('يرجى اختيار وحدة صالحة')
    .integer('معرف الوحدة غير صالح'),

  expenseType: yup
    .string()
    .required('نوع المصروف مطلوب')
    .oneOf([
      'maintenance',
      'utilities',
      'insurance',
      'cleaning',
      'security',
      'management',
      'repairs',
      'other'
    ], 'نوع المصروف غير صالح'),

  amount: yup
    .number()
    .transform((value, originalValue) => {
      if (originalValue === '') return undefined;
      return Number(originalValue);
    })
    .required('المبلغ مطلوب')
    .positive('المبلغ يجب أن يكون أكبر من صفر')
    .max(1000000, 'المبلغ كبير جداً (الحد الأقصى مليون)')
    .typeError('يرجى إدخال مبلغ صالح بالأرقام فقط'),

  // Updated expenseDate validation - accept string in YYYY-MM-DD format
  expenseDate: yup
    .string()
    .required('تاريخ المصروف مطلوب')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ المصروف يجب أن يكون بصيغة صحيحة (YYYY-MM-DD)')
    .test('not-future', 'تاريخ المصروف لا يمكن أن يكون في المستقبل', function (value) {
      if (!value) return true;
      const inputDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today
      return inputDate <= today;
    }),

  notes: yup
    .string()
    .nullable()
    .max(1000, 'الملاحظات طويلة جداً (الحد الأقصى 1000 حرف)'),
});

export type ExpenseFormData = yup.InferType<typeof expenseSchema>;

// Base reservation schema with all fields (edit mode)
export const reservationSchema = yup.object({
  // Common reservation fields
  userId: yup
    .number()
    .nullable()
    .positive('يرجى اختيار مستأجر صالح'),

  unitId: yup
    .number()
    .nullable()
    .positive('يرجى اختيار وحدة صالحة'),

  contractType: yup
    .string()
    .nullable()
    .oneOf(['residential', 'commercial'], 'نوع العقد غير صالح'),

  startDate: yup
    .string()
    .nullable()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ البداية يجب أن يكون بصيغة صحيحة'),

  endDate: yup
    .string()
    .nullable()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ النهاية يجب أن يكون بصيغة صحيحة')
    .test('end-after-start', 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية', function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) > new Date(startDate);
    }),

  paymentMethod: yup
    .string()
    .nullable()
    .oneOf(['cash', 'checks'], 'طريقة الدفع غير صالحة'),

  paymentSchedule: yup
    .string()
    .nullable()
    .oneOf(['monthly', 'quarterly', 'triannual', 'biannual', 'annual'], 'جدول الدفع غير صالح'),

  // Deposit fields
  includesDeposit: yup
    .boolean()
    .nullable(),

  depositAmount: yup
    .number()
    .transform((value, originalValue) => {
      if (originalValue === '') return undefined;
      return Number(originalValue);
    })
    .nullable()
    .when('includesDeposit', {
      is: true,
      then: (schema) => schema
        .positive('مبلغ التأمين يجب أن يكون أكبر من صفر')
        .typeError('يرجى إدخال مبلغ صالح للتأمين'),
      otherwise: (schema) => schema.nullable()
    }),

  depositPaymentMethod: yup
    .string()
    .nullable()
    .when('includesDeposit', {
      is: true,
      then: (schema) => schema.oneOf(['cash', 'check'], 'طريقة دفع التأمين غير صالحة'),
      otherwise: (schema) => schema.nullable()
    }),

  depositStatus: yup
    .string()
    .nullable()
    .when('includesDeposit', {
      is: true,
      then: (schema) => schema.oneOf(['unpaid', 'paid', 'returned'], 'حالة التأمين غير صالحة'),
      otherwise: (schema) => schema.nullable()
    }),

  depositPaidDate: yup
    .string()
    .nullable()
    .when(['includesDeposit', 'depositStatus'], {
      is: (includesDeposit, depositStatus) => includesDeposit && depositStatus === 'paid',
      then: (schema) => schema.matches(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ دفع التأمين يجب أن يكون بصيغة صحيحة'),
      otherwise: (schema) => schema.nullable()
    }),

  depositReturnedDate: yup
    .string()
    .nullable()
    .when(['includesDeposit', 'depositStatus'], {
      is: (includesDeposit, depositStatus) => includesDeposit && depositStatus === 'returned',
      then: (schema) => schema.matches(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ استرجاع التأمين يجب أن يكون بصيغة صحيحة'),
      otherwise: (schema) => schema.nullable()
    }),

  depositNotes: yup
    .string()
    .nullable()
    .max(500, 'ملاحظات التأمين طويلة جداً'),

  depositCheckImage: yup
    .mixed<File>()
    .nullable()
    .when(['includesDeposit', 'depositPaymentMethod'], {
      is: (includesDeposit, depositPaymentMethod) => includesDeposit && depositPaymentMethod === 'check',
      then: (schema) => schema
        .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
          return !value || ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
        }),
      otherwise: (schema) => schema.nullable()
    }),

  // Other fields
  notes: yup
    .string()
    .nullable()
    .max(1000, 'الملاحظات طويلة جداً'),

  contractImage: yup
    .mixed<File>()
    .nullable()
    .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
      return !value || ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
    }),

  contractPdf: yup
    .mixed<File>()
    .nullable()
    .test('fileType', 'يجب أن يكون ملف PDF', (value) => {
      return !value || value.type === 'application/pdf';
    }),

  // New tenant fields
  tenantFullName: yup
    .string()
    .nullable()
    .min(2, 'الاسم الكامل قصير جداً')
    .max(100, 'الاسم الكامل طويل جداً')
    .matches(arabicTextRegex, 'النص يجب أن يحتوي على أحرف عربية أو إنجليزية فقط', { excludeEmptyString: true }),

  tenantEmail: yup
    .string()
    .nullable()
    .matches(emailRegex, 'صيغة البريد الإلكتروني غير صحيحة', { excludeEmptyString: true }),

  tenantPhone: yup
    .string()
    .nullable()
    .matches(phoneRegex, 'رقم الهاتف غير صالح', { excludeEmptyString: true }),

  tenantWhatsappNumber: yup
    .string()
    .nullable()
    .matches(phoneRegex, 'رقم الواتساب غير صالح', { excludeEmptyString: true }),

  tenantIdNumber: yup
    .string()
    .nullable()
    .matches(/^[0-9]{10}$/, 'رقم الهوية يجب أن يكون 10 أرقام', { excludeEmptyString: true }),

  tenantType: yup
    .string()
    .nullable()
    .oneOf(['partnership', 'commercial_register', 'person', 'embassy', 'foreign_company', 'government', 'inheritance', 'civil_registry'], 'نوع المستأجر غير صالح'),

  tenantBusinessActivities: yup
    .string()
    .nullable()
    .min(10, 'وصف الأنشطة التجارية قصير جداً')
    .max(500, 'وصف الأنشطة التجارية طويل جداً'),

  tenantContactPerson: yup
    .string()
    .nullable()
    .min(2, 'اسم الشخص المسؤول قصير جداً')
    .max(100, 'اسم الشخص المسؤول طويل جداً')
    .matches(arabicTextRegex, 'النص يجب أن يحتوي على أحرف عربية أو إنجليزية فقط', { excludeEmptyString: true }),

  tenantContactPosition: yup
    .string()
    .nullable()
    .min(2, 'منصب الشخص المسؤول قصير جداً')
    .max(100, 'منصب الشخص المسؤول طويل جداً'),

  tenantNotes: yup
    .string()
    .nullable()
    .max(1000, 'ملاحظات المستأجر طويلة جداً'),

  // Identity documents
  identityImageFront: yup
    .mixed<File>()
    .nullable()
    .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
      return !value || ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
    }),

  identityImageBack: yup
    .mixed<File>()
    .nullable()
    .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
      return !value || ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
    }),

  commercialRegisterImage: yup
    .mixed<File>()
    .nullable()
    .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
      return !value || ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
    }),
});

// Create reservation schema (extended with required fields for create mode)
export const createReservationSchema = yup.object({
  // Basic required fields
  unitId: yup
    .number()
    .required('الوحدة مطلوبة')
    .positive('يرجى اختيار وحدة صالحة'),

  contractType: yup
    .string()
    .required('نوع العقد مطلوب')
    .oneOf(['residential', 'commercial'], 'نوع العقد غير صالح'),

  startDate: yup
    .string()
    .required('تاريخ البداية مطلوب')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ البداية يجب أن يكون بصيغة صحيحة'),

  endDate: yup
    .string()
    .required('تاريخ النهاية مطلوب')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ النهاية يجب أن يكون بصيغة صحيحة')
    .test('end-after-start', 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية', function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) > new Date(startDate);
    }),

  paymentMethod: yup
    .string()
    .required('طريقة الدفع مطلوبة')
    .oneOf(['cash', 'checks'], 'طريقة الدفع غير صالحة'),

  paymentSchedule: yup
    .string()
    .required('جدول الدفع مطلوب')
    .oneOf(['monthly', 'quarterly', 'triannual', 'biannual', 'annual'], 'جدول الدفع غير صالح'),

  includesDeposit: yup
    .boolean()
    .required('الرجاء تحديد ما إذا كان يتضمن تأمين'),

  // Contract documents - required for create mode
  contractImage: yup
    .mixed<File>()
    .required('صورة العقد مطلوبة')
    .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
      return value ? ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type) : false;
    }),

  contractPdf: yup
    .mixed<File>()
    .required('ملف PDF للعقد مطلوب')
    .test('fileType', 'يجب أن يكون ملف PDF', (value) => {
      return value ? value.type === 'application/pdf' : false;
    }),

  // Enhanced deposit fields validation
  depositAmount: yup
    .number()
    .transform((value, originalValue) => {
      if (originalValue === '') return undefined;
      return Number(originalValue);
    })
    .when('includesDeposit', {
      is: true,
      then: (schema) => schema
        .required('مبلغ التأمين مطلوب')
        .positive('مبلغ التأمين يجب أن يكون أكبر من صفر')
        .typeError('يرجى إدخال مبلغ صالح للتأمين'),
      otherwise: (schema) => schema.nullable()
    }),

  depositPaymentMethod: yup
    .string()
    .when('includesDeposit', {
      is: true,
      then: (schema) => schema
        .required('طريقة دفع التأمين مطلوبة')
        .oneOf(['cash', 'check'], 'طريقة دفع التأمين غير صالحة'),
      otherwise: (schema) => schema.nullable()
    }),

  depositStatus: yup
    .string()
    .when('includesDeposit', {
      is: true,
      then: (schema) => schema
        .required('حالة التأمين مطلوبة')
        .oneOf(['unpaid', 'paid', 'returned'], 'حالة التأمين غير صالحة'),
      otherwise: (schema) => schema.nullable()
    }),

  depositPaidDate: yup
    .string()
    .nullable()
    .when(['includesDeposit', 'depositStatus'], {
      is: (includesDeposit, depositStatus) => includesDeposit && depositStatus === 'paid',
      then: (schema) => schema
        .required('تاريخ دفع التأمين مطلوب')
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ دفع التأمين يجب أن يكون بصيغة صحيحة'),
      otherwise: (schema) => schema.nullable()
    }),

  depositReturnedDate: yup
    .string()
    .nullable()
    .when(['includesDeposit', 'depositStatus'], {
      is: (includesDeposit, depositStatus) => includesDeposit && depositStatus === 'returned',
      then: (schema) => schema
        .required('تاريخ استرجاع التأمين مطلوب')
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ استرجاع التأمين يجب أن يكون بصيغة صحيحة'),
      otherwise: (schema) => schema.nullable()
    }),

  depositCheckImage: yup
    .mixed<File>()
    .when(['includesDeposit', 'depositPaymentMethod'], {
      is: (includesDeposit, depositPaymentMethod) => includesDeposit && depositPaymentMethod === 'check',
      then: (schema) => schema
        .required('صورة شيك التأمين مطلوبة')
        .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
          return value ? ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type) : false;
        }),
      otherwise: (schema) => schema.nullable()
    }),

  // Tenant validation (conditional based on createNewTenant context)
  userId: yup
    .number()
    .when('$createNewTenant', {
      is: false,
      then: (schema) => schema
        .required('المستأجر مطلوب')
        .positive('يرجى اختيار مستأجر صالح'),
      otherwise: (schema) => schema.nullable()
    }),

  // New tenant fields (conditional based on createNewTenant context)
  tenantFullName: yup
    .string()
    .required('الاسم الكامل مطلوب')
    .min(2, 'الاسم الكامل قصير جداً')
    .max(100, 'الاسم الكامل طويل جداً')
    .matches(arabicTextRegex, 'النص يجب أن يحتوي على أحرف عربية أو إنجليزية فقط', { excludeEmptyString: true }),

  tenantEmail: yup
    .string()
    .required('البريد الإلكتروني مطلوب')
    .matches(emailRegex, 'صيغة البريد الإلكتروني غير صحيحة', { excludeEmptyString: true }),

  tenantPhone: yup
    .string()
    .required('رقم الهاتف مطلوب')
    .matches(phoneRegex, 'رقم الهاتف غير صالح', { excludeEmptyString: true }),

  tenantIdNumber: yup
    .string()
    .required('رقم الهوية مطلوب')
    .matches(/^[0-9]{10}$/, 'رقم الهوية يجب أن يكون 10 أرقام', { excludeEmptyString: true }),

  tenantType: yup
    .string()
    .required('نوع المستأجر مطلوب')
    .oneOf(['partnership', 'commercial_register', 'person', 'embassy', 'foreign_company', 'government', 'inheritance', 'civil_registry'], 'نوع المستأجر غير صالح'),

  // Business tenant fields (conditional based on tenant type only)
  tenantBusinessActivities: yup
    .string()
    .nullable()
    .when('tenantType', {
      is: (tenantType) => ['commercial_register', 'partnership', 'foreign_company'].includes(tenantType || ''),
      then: (schema) => schema
        .required('وصف الأنشطة التجارية مطلوب')
        .min(10, 'وصف الأنشطة التجارية قصير جداً')
        .max(500, 'وصف الأنشطة التجارية طويل جداً'),
      otherwise: (schema) => schema.nullable()
    }),

  tenantContactPerson: yup
    .string()
    .nullable()
    .when('tenantType', {
      is: (tenantType) => tenantType !== 'person' && tenantType !== null && tenantType !== undefined,
      then: (schema) => schema
        .required('اسم الشخص المسؤول مطلوب')
        .min(2, 'اسم الشخص المسؤول قصير جداً')
        .max(100, 'اسم الشخص المسؤول طويل جداً')
        .matches(arabicTextRegex, 'النص يجب أن يحتوي على أحرف عربية أو إنجليزية فقط', { excludeEmptyString: true }),
      otherwise: (schema) => schema.nullable()
    }),

  tenantContactPosition: yup
    .string()
    .nullable()
    .when('tenantType', {
      is: (tenantType) => tenantType !== 'person' && tenantType !== null && tenantType !== undefined,
      then: (schema) => schema
        .required('منصب الشخص المسؤول مطلوب')
        .min(2, 'منصب الشخص المسؤول قصير جداً')
        .max(100, 'منصب الشخص المسؤول طويل جداً'),
      otherwise: (schema) => schema.nullable()
    }),
  // Identity documents (required for new tenants)
  identityImageFront: yup
    .mixed<File>()
    .required('صورة الهوية (الوجه الأمامي) مطلوبة')
    .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
      return value ? ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type) : false;
    }),

  identityImageBack: yup
    .mixed<File>()
    .required('صورة الهوية (الوجه الخلفي) مطلوبة')
    .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
      return value ? ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type) : false;
    }),

  commercialRegisterImage: yup
    .mixed<File>()
    .nullable()
    .when(['$createNewTenant', 'tenantType'], {
      is: (createNewTenant, tenantType) => createNewTenant && ['commercial_register', 'partnership', 'foreign_company'].includes(tenantType || ''),
      then: (schema) => schema
        .required('صورة السجل التجاري مطلوبة')
        .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
          return value ? ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type) : false;
        }),
      otherwise: (schema) => schema.nullable()
    }),
});

// Edit mode uses the base schema (with fewer required fields)


// ===== RESERVATION VALIDATION SCHEMA =====

// Base reservation schema with all fields optional (edit mode)
export const editReservationSchema = yup.object({
  // Common reservation fields
  userId: yup
    .number()
    .nullable()
    .positive('يرجى اختيار مستأجر صالح')
    .optional(),

  unitId: yup
    .number()
    .nullable()
    .positive('يرجى اختيار وحدة صالحة')
    .optional(),

  contractType: yup
    .string()
    .nullable()
    .oneOf(['residential', 'commercial', ''], 'نوع العقد غير صالح')
    .optional(),

  startDate: yup
    .string()
    .nullable()
    .matches(/^\d{4}-\d{2}-\d{2}$|^$/, 'تاريخ البداية يجب أن يكون بصيغة صحيحة')
    .optional(),

  endDate: yup
    .string()
    .nullable()
    .matches(/^\d{4}-\d{2}-\d{2}$|^$/, 'تاريخ النهاية يجب أن يكون بصيغة صحيحة')
    .test('end-after-start', 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية', function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) > new Date(startDate);
    })
    .optional(),

  paymentMethod: yup
    .string()
    .nullable()
    .oneOf(['cash', 'checks', ''], 'طريقة الدفع غير صالحة')
    .optional(),

  paymentSchedule: yup
    .string()
    .nullable()
    .oneOf(['monthly', 'quarterly', 'triannual', 'biannual', 'annual', ''], 'جدول الدفع غير صالح')
    .optional(),

  // Deposit fields
  includesDeposit: yup
    .boolean()
    .nullable()
    .optional(),

  depositAmount: yup
    .number()
    .transform((value, originalValue) => {
      if (originalValue === '' || originalValue == null) return undefined;
      return Number(originalValue);
    })
    .nullable()
    .when('includesDeposit', {
      is: true,
      then: (schema) =>
        schema
          .positive('مبلغ التأمين يجب أن يكون أكبر من صفر')
          .typeError('يرجى إدخال مبلغ صالح للتأمين'),
      otherwise: (schema) => schema.nullable(),
    })
    .optional(),

  depositPaymentMethod: yup
    .string()
    .nullable()
    .when('includesDeposit', {
      is: true,
      then: (schema) => schema.oneOf(['cash', 'check', ''], 'طريقة دفع التأمين غير صالحة'),
      otherwise: (schema) => schema.nullable(),
    })
    .optional(),

  depositStatus: yup
    .string()
    .nullable()
    .when('includesDeposit', {
      is: true,
      then: (schema) => schema.oneOf(['unpaid', 'paid', 'returned', ''], 'حالة التأمين غير صالحة'),
      otherwise: (schema) => schema.nullable(),
    })
    .optional(),

  depositPaidDate: yup
    .string()
    .nullable()
    .when(['includesDeposit', 'depositStatus'], {
      is: (includesDeposit, depositStatus) => includesDeposit && depositStatus === 'paid',
      then: (schema) =>
        schema.matches(/^\d{4}-\d{2}-\d{2}$|^$/, 'تاريخ دفع التأمين يجب أن يكون بصيغة صحيحة'),
      otherwise: (schema) => schema.nullable(),
    })
    .optional(),

  depositReturnedDate: yup
    .string()
    .nullable()
    .when(['includesDeposit', 'depositStatus'], {
      is: (includesDeposit, depositStatus) => includesDeposit && depositStatus === 'returned',
      then: (schema) =>
        schema.matches(/^\d{4}-\d{2}-\d{2}$|^$/, 'تاريخ استرجاع التأمين يجب أن يكون بصيغة صحيحة'),
      otherwise: (schema) => schema.nullable(),
    })
    .optional(),

  depositNotes: yup
    .string()
    .nullable()
    .max(500, 'ملاحظات التأمين طويلة جداً')
    .optional(),

  depositCheckImage: yup
    .mixed<File>()
    .nullable()
    .when(['includesDeposit', 'depositPaymentMethod'], {
      is: (includesDeposit, depositPaymentMethod) => includesDeposit && depositPaymentMethod === 'check',
      then: (schema) =>
        schema.test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
          return !value || ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
        }),
      otherwise: (schema) => schema.nullable(),
    })
    .optional(),

  // Other fields
  notes: yup
    .string()
    .nullable()
    .max(1000, 'الملاحظات طويلة جداً')
    .optional(),

  contractImage: yup
    .mixed<File>()
    .nullable()
    .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
      return !value || ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
    })
    .optional(),

  contractPdf: yup
    .mixed<File>()
    .nullable()
    .test('fileType', 'يجب أن يكون ملف PDF', (value) => {
      return !value || value.type === 'application/pdf';
    })
    .optional(),


  commercialRegisterImage: yup
    .mixed<File>()
    .nullable()
    .test('fileType', 'يجب أن تكون صورة (JPEG, PNG, JPG)', (value) => {
      return !value || ['image/jpeg', 'image/png', 'image/jpg'].includes(value.type);
    })
    .optional(),
});
// ===== PAYMENT VALIDATION SCHEMA =====
export const paymentSchema = yup.object({
  reservationId: yup
    .number()
    .required('الحجز مطلوب')
    .positive('يرجى اختيار حجز صالح')
    .integer('معرف الحجز غير صالح'),

  amount: yup
    .number()
    .transform((value, originalValue) => {
      // If it's an empty string, return undefined to trigger required validation
      if (originalValue === '') return undefined;
      // If it's not a number, return NaN to trigger typeError
      return Number(originalValue);
    })
    .required('المبلغ مطلوب')
    .positive('المبلغ يجب أن يكون أكبر من صفر')
    .max(10000000, 'المبلغ كبير جداً (الحد الأقصى 10 مليون)')
    .typeError('يرجى إدخال مبلغ صالح بالأرقام فقط'),

  paymentDate: yup
    .date()
    .required('تاريخ الدفع مطلوب')
    .max(new Date(), 'تاريخ الدفع لا يمكن أن يكون في المستقبل')
    .typeError('تاريخ الدفع غير صالح'),

  paymentMethod: yup
    .string()
    .required('طريقة الدفع مطلوبة')
    .oneOf(['cash', 'bank_transfer', 'check', 'credit_card', 'online'], 'طريقة الدفع غير صالحة'),

  status: yup
    .string()
    .required('حالة الدفع مطلوبة')
    .oneOf(['paid', 'pending', 'delayed', 'cancelled', 'refunded'], 'حالة الدفع غير صالحة'),

  notes: yup
    .string()
    .nullable()
    .max(1000, 'الملاحظات طويلة جداً (الحد الأقصى 1000 حرف)'),

  // Check-specific fields
  checkNumber: yup
    .string()
    .when('paymentMethod', {
      is: 'check',
      then: (schema) => schema
        .required('رقم الشيك مطلوب')
        .min(3, 'رقم الشيك قصير جداً')
        .max(50, 'رقم الشيك طويل جداً'),
      otherwise: (schema) => schema.nullable()
    }),

  bankName: yup
    .string()
    .when('paymentMethod', {
      is: (value: string) => ['check', 'bank_transfer'].includes(value),
      then: (schema) => schema
        .required('اسم البنك مطلوب')
        .min(2, 'اسم البنك قصير جداً')
        .max(100, 'اسم البنك طويل جداً')
        .arabicText(),
      otherwise: (schema) => schema.nullable()
    }),

  checkDate: yup
    .date()
    .when('paymentMethod', {
      is: 'check',
      then: (schema) => schema
        .required('تاريخ الشيك مطلوب')
        .min(new Date(), 'تاريخ الشيك يجب أن يكون في المستقبل أو اليوم'),
      otherwise: (schema) => schema.nullable()
    }),

  // Bank transfer specific fields
  transferReference: yup
    .string()
    .when('paymentMethod', {
      is: 'bank_transfer',
      then: (schema) => schema
        .required('رقم المرجع مطلوب')
        .min(3, 'رقم المرجع قصير جداً')
        .max(100, 'رقم المرجع طويل جداً'),
      otherwise: (schema) => schema.nullable()
    }),

  // File attachments
  checkImage: yup
    .mixed()
    .when('paymentMethod', {
      is: 'check',
      then: (schema) => schema
        .required('صورة الشيك مطلوبة')
        .fileSize(MAX_FILE_SIZE, 'حجم صورة الشيك كبير جداً')
        .fileFormat(SUPPORTED_IMAGE_FORMATS, 'يجب أن تكون صورة الشيك بصيغة صورة صحيحة'),
      otherwise: (schema) => schema.nullable()
    }),

  receiptImage: yup
    .mixed()
    .nullable()
    .fileSize(MAX_FILE_SIZE, 'حجم صورة الإيصال كبير جداً')
    .fileFormat(SUPPORTED_IMAGE_FORMATS, 'يجب أن تكون صورة الإيصال بصيغة صورة صحيحة'),

  // Late payment fields
  lateFee: yup
    .number()
    .transform((value, originalValue) => {
      // If it's an empty string, return null for nullable fields
      if (originalValue === '') return null;
      // If it's not a number, return NaN to trigger typeError
      return Number(originalValue);
    })
    .when('status', {
      is: 'delayed',
      then: (schema) => schema
        .min(0, 'رسوم التأخير لا يمكن أن تكون سالبة')
        .max(100000, 'رسوم التأخير كبيرة جداً')
        .typeError('يرجى إدخال مبلغ صالح لرسوم التأخير'),
      otherwise: (schema) => schema.nullable()
    }),

  dueDate: yup
    .date()
    .nullable()
    .when('status', {
      is: (value: string) => ['pending', 'delayed'].includes(value),
      then: (schema) => schema.required('تاريخ الاستحقاق مطلوب'),
      otherwise: (schema) => schema.nullable()
    }),
});
