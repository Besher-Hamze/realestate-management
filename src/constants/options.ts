export const COMPANY_TYPE_OPTIONS = [
  { value: 'owner', label: 'مالك' },
  { value: 'agency', label: 'شركة عقارية' }
];

export const BUILDING_TYPE_OPTIONS = [
  { value: 'residential', label: 'سكني' },
  { value: 'commercial', label: 'تجاري' },
  { value: 'mixed', label: ' (سكني وتجاري)' }
];

export const UNIT_TYPE_OPTIONS = [
  { value: 'studio', label: 'ستوديو' },
  { value: 'apartment', label: 'شقة' },
  { value: 'shop', label: 'محل تجاري' },
  { value: 'office', label: 'مكتب' },
  { value: 'villa', label: 'فيلا' },
  { value: 'room', label: 'غرفة' }
];

export const UNIT_LAYOUT_OPTIONS = [
  { value: '1bhk', label: '1bhk' },
  { value: '2bhk', label: '2bhk' },
  { value: '3bhk', label: '3bhk' },
  { value: '4bhk', label: '4bhk' },
  { value: '5bhk', label: '5bhk' },
  { value: '6bhk', label: '6bhk' },
  { value: '7bhk', label: '7bhk' },
];

export const FLOOR_OPTIONS = [
  { value: '-2', label: 'قبو -2' },
  { value: '-1', label: 'قبو -1 ' },
  { value: 'M', label: 'الميزانين' },
  { value: 'G', label: 'الأرضي' },
  { value: '1', label: 'الأول' },
  { value: '2', label: 'الثاني' },
  { value: '3', label: 'الثالث' },
  { value: '4', label: 'الرابع' },
  { value: '5', label: 'الخامس' },
  { value: '6', label: 'السادس' },
  { value: '7', label: 'السابع' },
  { value: '8', label: 'الثامن' },
  { value: '9', label: 'التاسع' },
  { value: '10', label: 'العاشر' },
];

export const UNIT_STATUS_OPTIONS = [
  { value: 'available', label: 'متاح' },
  { value: 'rented', label: 'مؤجر' },
  { value: 'maintenance', label: 'تحت الصيانة' }
];

export const TENANT_TYPE_OPTIONS = [
  { value: 'person', label: 'فرد' },
  { value: 'commercial_register', label: 'سجل تجاري' },
  { value: 'partnership', label: 'شراكة/اتفاقية' },
  { value: 'embassy', label: 'سفارة' },
  { value: 'foreign_company', label: 'شركة أجنبية' },
  { value: 'government', label: 'جهة حكومية' },
  { value: 'inheritance', label: 'ورثة' },
  { value: 'civil_registry', label: 'سجل مدني' }
];

export const CONTRACT_TYPE_OPTIONS = [
  { value: 'residential', label: 'سكني' },
  { value: 'commercial', label: 'تجاري' }
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'نقدًا' },
  { value: 'checks', label: 'شيكات' }
];

export const PAYMENT_SCHEDULE_OPTIONS = [
  { value: 'monthly', label: 'شهري' },
  { value: 'quarterly', label: 'ربع سنوي (كل 3 أشهر)' },
  { value: 'triannual', label: 'كل 4 أشهر (3 دفعات)' },
  { value: 'biannual', label: 'نصف سنوي (كل 6 أشهر)' },
  { value: 'annual', label: 'سنوي (دفعة واحدة)' }
];

export const RESERVATION_STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'expired', label: 'منتهي' },
  { value: 'cancelled', label: 'ملغي' }
];

export const SERVICE_TYPE_OPTIONS = [
  { value: 'maintenance', label: 'صيانة' },
  { value: 'financial', label: 'مالية' },
  { value: 'administrative', label: 'إدارية' }
];

export const MAINTENANCE_SUBTYPE_OPTIONS = [
  { value: 'plumbing', label: 'السباكة' },
  { value: 'electrical', label: 'الكهرباء' },
  { value: 'ac', label: 'تكييف الهواء' },
  { value: 'appliance', label: 'الأجهزة المنزلية' },
  { value: 'structural', label: 'الإصلاحات الهيكلية' },
  { value: 'painting', label: 'الطلاء' },
  { value: 'doors_windows', label: 'الأبواب والنوافذ' },
  { value: 'flooring', label: 'الأرضيات' },
  { value: 'carpentry', label: 'النجارة' },
  { value: 'cleaning', label: 'التنظيف' },
  { value: 'pest_control', label: 'مكافحة الحشرات' },
  { value: 'other', label: 'أخرى' }
];

export const FINANCIAL_SUBTYPE_OPTIONS = [
  { value: 'payment_issue', label: 'مشكلة في الدفع' },
  { value: 'contract_renewal', label: 'تجديد العقد' },
  { value: 'deposit_refund', label: 'استرداد التأمين' },
  { value: 'payment_schedule', label: 'جدول الدفع' },
  { value: 'invoice_request', label: 'طلب فاتورة' },
  { value: 'other', label: 'أخرى' }
];

export const ADMINISTRATIVE_SUBTYPE_OPTIONS = [
  { value: 'contract_change', label: 'تغيير العقد' },
  { value: 'tenant_info_update', label: 'تحديث معلومات المستأجر' },
  { value: 'complaint', label: 'شكوى' },
  { value: 'neighbor_issue', label: 'مشكلة مع الجيران' },
  { value: 'permission_request', label: 'طلب إذن' },
  { value: 'early_termination', label: 'إنهاء مبكر للعقد' },
  { value: 'other', label: 'أخرى' }
];

export const SERVICE_STATUS_OPTIONS = [
  { value: 'pending', label: 'معلق' },
  { value: 'in-progress', label: 'قيد التنفيذ' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'rejected', label: 'مرفوض' }
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'paid', label: 'مدفوع' },
  { value: 'pending', label: 'معلق' },
  { value: 'delayed', label: 'متأخر' },
  { value: 'cancelled', label: 'ملغي' }
];

export const USER_ROLE_OPTIONS = [
  { value: 'admin', label: 'مسؤول' },
  { value: 'manager', label: 'مدير' },
  { value: 'tenant', label: 'مستأجر' }
];

// Mapping functions to get label from value
export const getCompanyTypeLabel = (value: string) => {
  return COMPANY_TYPE_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getBuildingTypeLabel = (value: string) => {
  return BUILDING_TYPE_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getUnitTypeLabel = (value: string) => {
  return UNIT_TYPE_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getUnitLayoutLabel = (value: string) => {
  return UNIT_LAYOUT_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getUnitStatusLabel = (value: string) => {
  return UNIT_STATUS_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getTenantTypeLabel = (value: string) => {
  return TENANT_TYPE_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getContractTypeLabel = (value: string) => {
  return CONTRACT_TYPE_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getPaymentMethodLabel = (value: string) => {
  return PAYMENT_METHOD_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getPaymentScheduleLabel = (value: string) => {
  return PAYMENT_SCHEDULE_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getReservationStatusLabel = (value: string) => {
  return RESERVATION_STATUS_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getServiceTypeLabel = (value: string) => {
  return SERVICE_TYPE_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getServiceSubtypeLabel = (value: string, serviceType: string) => {
  let options: Array<{ value: string, label: string }> = [];

  switch (serviceType) {
    case 'maintenance':
      options = MAINTENANCE_SUBTYPE_OPTIONS;
      break;
    case 'financial':
      options = FINANCIAL_SUBTYPE_OPTIONS;
      break;
    case 'administrative':
      options = ADMINISTRATIVE_SUBTYPE_OPTIONS;
      break;
    default:
      return value;
  }

  return options.find(option => option.value === value)?.label || value;
};

export const getServiceStatusLabel = (value: string) => {
  return SERVICE_STATUS_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getPaymentStatusLabel = (value: string) => {
  return PAYMENT_STATUS_OPTIONS.find(option => option.value === value)?.label || value;
};

export const getUserRoleLabel = (value: string) => {
  return USER_ROLE_OPTIONS.find(option => option.value === value)?.label || value;
};

export const EXPENSE_TYPE_OPTIONS = [
  { value: 'maintenance', label: 'صيانة' },
  { value: 'utilities', label: 'خدمات (كهرباء، ماء، إنترنت)' },
  { value: 'insurance', label: 'تأمين' },
  { value: 'cleaning', label: 'تنظيف' },
  { value: 'security', label: 'أمن' },
  { value: 'management', label: 'إدارة' },
  { value: 'repairs', label: 'إصلاحات' },
  { value: 'other', label: 'أخرى' },
];