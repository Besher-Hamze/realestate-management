import { 
  ServiceOrder, 
  ServiceType, 
  ServiceStatus 
} from '@/lib/types';

export interface CreateServiceOrderFormData {
  reservationId: number;
  serviceType: ServiceType;
  serviceSubtype: string;
  description: string;
  attachmentFile?: File;
}

export interface UpdateServiceOrderFormData {
  serviceType?: ServiceType;
  serviceSubtype?: string;
  description?: string;
  status?: ServiceStatus;
  attachmentFile?: File;
}

export interface ServiceOrderDetailsProps {
  serviceOrder: ServiceOrder;
  onUpdate?: (id: number, data: UpdateServiceOrderFormData) => Promise<void>;
}

export interface ServiceOrderFormProps {
  initialData?: Partial<CreateServiceOrderFormData>;
  onSubmit: (data: CreateServiceOrderFormData) => Promise<void>;
  isUpdate?: boolean;
  reservationOptions?: Array<{value: number, label: string}>;
}

export interface ServiceOrderListItemProps {
  serviceOrder: ServiceOrder;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface ServiceOrderListProps {
  serviceOrders: ServiceOrder[];
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface ServiceOrderFilterProps {
  status?: ServiceStatus;
  serviceType?: ServiceType;
  reservationId?: number;
  startDate?: string;
  endDate?: string;
  onFilterChange: (filters: { 
    status?: ServiceStatus, 
    serviceType?: ServiceType,
    reservationId?: number,
    startDate?: string,
    endDate?: string
  }) => void;
}

// Common service subtypes
export const maintenanceSubtypes = [
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

export const financialSubtypes = [
  { value: 'payment_issue', label: 'مشكلة في الدفع' },
  { value: 'contract_renewal', label: 'تجديد العقد' },
  { value: 'deposit_refund', label: 'استرداد التأمين' },
  { value: 'payment_schedule', label: 'جدول الدفع' },
  { value: 'invoice_request', label: 'طلب فاتورة' },
  { value: 'other', label: 'أخرى' }
];

export const administrativeSubtypes = [
  { value: 'contract_change', label: 'تغيير العقد' },
  { value: 'tenant_info_update', label: 'تحديث معلومات المستأجر' },
  { value: 'complaint', label: 'شكوى' },
  { value: 'neighbor_issue', label: 'مشكلة مع الجيران' },
  { value: 'permission_request', label: 'طلب إذن' },
  { value: 'early_termination', label: 'إنهاء مبكر للعقد' },
  { value: 'other', label: 'أخرى' }
];