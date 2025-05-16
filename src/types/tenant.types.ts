import { TenantType, Tenant } from '@/lib/types';

export interface CreateTenantFormData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  idNumber: string;
  tenantType: TenantType;
  businessActivities?: string;
  contactPerson?: string;
  contactPosition?: string;
  notes?: string;
  identityImageFront?: File;
  identityImageBack?: File;
  commercialRegisterImage?: File;
}

export interface UpdateTenantFormData {
  fullName?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  idNumber?: string;
  tenantType?: TenantType;
  businessActivities?: string;
  contactPerson?: string;
  contactPosition?: string;
  notes?: string;
  identityImageFront?: File;
  identityImageBack?: File;
  commercialRegisterImage?: File;
}

export interface TenantDetailsProps {
  tenant: Tenant;
  onUpdate?: (id: number, data: UpdateTenantFormData) => Promise<void>;
}

export interface TenantFormProps {
  initialData?: Partial<CreateTenantFormData>;
  onSubmit: (data: CreateTenantFormData) => Promise<void>;
  isUpdate?: boolean;
}

export interface TenantListItemProps {
  tenant: Tenant;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface TenantListProps {
  tenants: Tenant[];
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface TenantFilterProps {
  tenantType?: TenantType;
  onFilterChange: (filters: { tenantType?: TenantType }) => void;
}