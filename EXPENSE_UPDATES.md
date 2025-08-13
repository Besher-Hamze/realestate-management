# تحديثات نظام المصروفات

## التغييرات الجديدة

### 1. الحقول الجديدة المطلوبة

تم إضافة الحقول التالية إلى نموذج المصروفات:

#### الحقول الإجبارية:

- **`buildingId`** (number): معرف المبنى - أصبح إجباري بدلاً من unitId
- **`responsibleParty`** (string): الطرف المسؤول - "owner" | "tenant"

#### الحقول الاختيارية:

- **`unitId`** (number): معرف الوحدة - أصبح اختياري
- **`attachmentFile`** (File): ملف مرفق - PDF, DOC, DOCX
- **`attachmentDescription`** (string): وصف المرفق

#### الحقول الموجودة:

- `expenseType`: نوع المصروف
- `amount`: المبلغ
- `expenseDate`: تاريخ المصروف
- `notes`: الملاحظات

### 2. التحديثات في API

#### نقطة النهاية الجديدة:

```
POST /api/expenses
Content-Type: multipart/form-data
```

#### التحديثات في API:

- تم تحديث `expensesApi.create()` ليدعم `multipart/form-data`
- تم تحديث `expensesApi.update()` ليدعم `multipart/form-data`
- تم إضافة `expensesApi.getByBuildingId()` لجلب المصروفات حسب المبنى

### 3. التحديثات في الواجهة

#### نموذج إنشاء/تعديل المصروف:

- إضافة حقل اختيار المبنى (إجباري)
- إضافة حقل اختيار الوحدة (اختياري) - يتم تحميله ديناميكياً حسب المبنى المختار
- إضافة حقل اختيار الطرف المسؤول (إجباري)
- إضافة حقل رفع الملف المرفق (اختياري)
- إضافة حقل وصف المرفق (اختياري)

#### صفحة تفاصيل المصروف:

- عرض معلومات المبنى
- عرض معلومات الوحدة (إذا كانت محددة)
- عرض الطرف المسؤول
- عرض المرفقات مع إمكانية التحميل

### 4. التحديثات في التحقق من الصحة

#### مخطط التحقق الجديد:

```typescript
export const expenseSchema = yup.object({
  buildingId: yup.number().required("المبنى مطلوب").positive().integer(),
  unitId: yup.number().nullable().positive().integer(),
  responsibleParty: yup
    .string()
    .required("الطرف المسؤول مطلوب")
    .oneOf(["owner", "tenant"]),
  expenseType: yup.string().required("نوع المصروف مطلوب"),
  amount: yup.number().required("المبلغ مطلوب").positive(),
  expenseDate: yup.string().required("تاريخ المصروف مطلوب"),
  notes: yup.string().nullable().max(1000),
  attachmentFile: yup
    .mixed()
    .nullable()
    .fileSize(MAX_FILE_SIZE)
    .fileFormat(SUPPORTED_DOCUMENT_FORMATS),
  attachmentDescription: yup.string().nullable().max(200),
});
```

### 5. التحديثات في أنواع البيانات

#### واجهة Expense المحدثة:

```typescript
export interface Expense {
  id: number;
  buildingId: number;
  unitId?: number;
  responsibleParty: "owner" | "tenant";
  expenseType: ExpenseType;
  amount: number;
  expenseDate: string;
  notes?: string;
  attachmentFile?: string;
  attachmentDescription?: string;
  createdAt: string;
  updatedAt: string;
  unit?: RealEstateUnit;
  building?: Building;
}
```

#### واجهة ExpenseFormData المحدثة:

```typescript
export interface ExpenseFormData {
  buildingId: number;
  unitId?: number;
  responsibleParty: "owner" | "tenant";
  expenseType: ExpenseType;
  amount: number;
  expenseDate: string;
  notes?: string;
  attachmentFile?: File;
  attachmentDescription?: string;
}
```

### 6. الميزات الجديدة

#### تحميل ديناميكي للوحدات:

- عند اختيار المبنى، يتم تحميل الوحدات الخاصة به تلقائياً
- الوحدات تصبح متاحة للاختيار فقط بعد اختيار المبنى

#### إدارة المرفقات:

- دعم رفع ملفات PDF, DOC, DOCX
- الحد الأقصى لحجم الملف: 10 ميجابايت
- إمكانية إضافة وصف للمرفق

#### تحسينات في الواجهة:

- تصميم محسن مع أقسام منفصلة للمعلومات الأساسية والمرفقات
- إرشادات مفصلة لأنواع المصاريف
- رسائل خطأ وتحقق محسنة

### 7. التوافق مع النظام الحالي

- جميع المصروفات الموجودة ستحتفظ ببياناتها
- الحقول الجديدة ستكون اختيارية للمصروفات القديمة
- تم الحفاظ على جميع الوظائف الموجودة

### 8. ملاحظات مهمة

1. **الترقية**: يجب تحديث قاعدة البيانات لدعم الحقول الجديدة
2. **الملفات**: تأكد من إعداد تخزين الملفات بشكل صحيح
3. **الأمان**: تم تطبيق التحقق من نوع وحجم الملفات
4. **الأداء**: تم تحسين تحميل البيانات باستخدام التحميل الديناميكي

### 9. الاختبار

يجب اختبار:

- إنشاء مصروف جديد مع جميع الحقول
- إنشاء مصروف بدون وحدة (فقط مبنى)
- رفع الملفات المرفقة
- تحميل الوحدات ديناميكياً
- عرض تفاصيل المصروف مع المرفقات
- تعديل المصروفات الموجودة
