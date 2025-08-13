# تحديثات نظام طلبات الخدمة

## التغييرات الجديدة

### 1. الحقول الجديدة المطلوبة

تم إضافة الحقول التالية إلى نموذج طلبات الخدمة عند إكمال أو إلغاء الطلب:

#### الحقول الإجبارية عند status = "completed" أو "rejected":

- **`servicePrice`** (number): سعر الخدمة - إجباري
- **`completionAttachment`** (File): مرفق الإكمال - إجباري للصيانة/محاسب

#### الحقول الاختيارية:

- **`completionDescription`** (string): وصف الإكمال - اختياري

#### الحقول الموجودة:

- `status`: حالة الخدمة
- `description`: وصف الخدمة
- `attachmentFile`: المرفق الأصلي

### 2. التحديثات في API

#### نقطة النهاية المحدثة:

```
PUT /api/services/:id
Content-Type: multipart/form-data
```

#### التحديثات في API:

- تم تحديث `servicesApi.update()` ليدعم `multipart/form-data`
- إضافة دعم للحقول الجديدة: `servicePrice`, `completionAttachment`, `completionDescription`

### 3. التحديثات في الواجهة

#### صفحة تفاصيل الخدمة:

- إضافة نافذة جديدة لإكمال الخدمة عند تحديد الحالة كمكتملة أو ملغية
- إضافة حقول إدخال لسعر الخدمة ووصف الإكمال
- إضافة حقل رفع ملف مرفق الإكمال
- عرض معلومات الإكمال في صفحة التفاصيل

#### نافذة إكمال الخدمة:

- حقل إدخال سعر الخدمة (إجباري)
- حقل نصي لوصف الإكمال (اختياري)
- حقل رفع ملف مرفق الإكمال (إجباري)
- تصميم محسن مع إرشادات واضحة

### 4. التحديثات في التحقق من الصحة

#### مخطط التحقق الجديد:

```typescript
export const serviceOrderSchema = yup.object({
  reservationId: yup.number().required("الحجز مطلوب").positive().integer(),
  serviceType: yup
    .string()
    .required("نوع الخدمة مطلوب")
    .oneOf(["financial", "maintenance", "administrative"]),
  serviceSubtype: yup
    .string()
    .required("النوع الفرعي للخدمة مطلوب")
    .min(2)
    .max(50),
  description: yup.string().required("وصف الخدمة مطلوب").min(10).max(1000),
  status: yup
    .string()
    .required("حالة الخدمة مطلوبة")
    .oneOf(["pending", "in-progress", "completed", "rejected"]),
  attachmentFile: yup
    .mixed()
    .nullable()
    .fileSize(MAX_FILE_SIZE)
    .fileFormat([...SUPPORTED_IMAGE_FORMATS, ...SUPPORTED_DOCUMENT_FORMATS]),

  // New fields for completion/rejection
  servicePrice: yup.number().when("status", {
    is: (status: string) => ["completed", "rejected"].includes(status),
    then: (schema) =>
      schema
        .required("سعر الخدمة مطلوب عند إكمال أو إلغاء الطلب")
        .positive()
        .max(100000),
    otherwise: (schema) => schema.nullable(),
  }),

  completionAttachment: yup.mixed().when("status", {
    is: (status: string) => ["completed", "rejected"].includes(status),
    then: (schema) =>
      schema
        .required("المرفق مطلوب عند إكمال أو إلغاء الطلب")
        .fileSize(MAX_FILE_SIZE)
        .fileFormat([
          ...SUPPORTED_IMAGE_FORMATS,
          ...SUPPORTED_DOCUMENT_FORMATS,
        ]),
    otherwise: (schema) => schema.nullable(),
  }),

  completionDescription: yup.string().nullable().max(500),
});
```

### 5. التحديثات في أنواع البيانات

#### واجهة ServiceOrder المحدثة:

```typescript
export interface ServiceOrder {
  id: number;
  userId: number;
  reservationId: number;
  serviceType: ServiceType;
  serviceSubtype: string;
  description: string;
  status: ServiceStatus;
  attachmentFile?: string;
  attachmentFileUrl?: string;
  serviceHistory: { status: ServiceStatus; date: Date }[];
  // New fields for completion/rejection
  servicePrice?: number;
  completionAttachment?: string;
  completionAttachmentUrl?: string;
  completionDescription?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  reservation?: Reservation;
}
```

#### واجهة ServiceOrderFormData المحدثة:

```typescript
export interface ServiceOrderFormData {
  reservationId: number;
  serviceType: ServiceType;
  serviceSubtype: string;
  description: string;
  attachmentFile?: File;
  status: any;
  // New fields for completion/rejection
  servicePrice?: number;
  completionAttachment?: File;
  completionDescription?: string;
}
```

### 6. الميزات الجديدة

#### تدفق إكمال الخدمة:

- عند تحديد الحالة كمكتملة أو ملغية، تفتح نافذة إضافية
- جمع المعلومات المطلوبة: السعر، الوصف، المرفق
- التحقق من صحة البيانات قبل الإرسال

#### إدارة المرفقات:

- دعم رفع ملفات PDF, DOC, DOCX, JPG, PNG
- الحد الأقصى لحجم الملف: 10 ميجابايت
- عرض المرفقات مع إمكانية التحميل

#### تحسينات في الواجهة:

- تصميم محسن لنافذة إكمال الخدمة
- إرشادات واضحة للمستخدم
- رسائل خطأ وتحقق محسنة

### 7. التوافق مع النظام الحالي

- جميع طلبات الخدمة الموجودة ستحتفظ ببياناتها
- الحقول الجديدة ستكون اختيارية للطلبات القديمة
- تم الحفاظ على جميع الوظائف الموجودة

### 8. ملاحظات مهمة

1. **الترقية**: يجب تحديث قاعدة البيانات لدعم الحقول الجديدة
2. **الملفات**: تأكد من إعداد تخزين الملفات بشكل صحيح
3. **الأمان**: تم تطبيق التحقق من نوع وحجم الملفات
4. **الأداء**: تم تحسين معالجة البيانات

### 9. الاختبار

يجب اختبار:

- تحديث حالة الخدمة إلى مكتملة مع جميع البيانات المطلوبة
- تحديث حالة الخدمة إلى ملغية مع جميع البيانات المطلوبة
- رفع الملفات المرفقة للإكمال
- عرض معلومات الإكمال في صفحة التفاصيل
- التحقق من صحة البيانات المدخلة
- معالجة الأخطاء والاستثناءات

### 10. سير العمل الجديد

1. **تحديث الحالة العادية**: pending → in-progress → pending
2. **إكمال الخدمة**: in-progress → completed (مع البيانات الإضافية)
3. **إلغاء الخدمة**: أي حالة → rejected (مع البيانات الإضافية)

### 11. الأدوار والصلاحيات

- **مسؤول الصيانة**: يمكن إكمال وإلغاء طلبات الصيانة
- **المحاسب**: يمكن إكمال وإلغاء الطلبات المالية
- **المدير**: يمكن إكمال وإلغاء جميع أنواع الطلبات
