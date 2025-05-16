import { 
  Reservation, 
  ContractType, 
  PaymentMethod, 
  PaymentSchedule, 
  ReservationStatus,
  TenantType
} from '@/lib/types';

export interface CreateReservationFormData {
  // With existing tenant
  userId?: number;
  
  // Or create new tenant
  tenantFullName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  tenantWhatsappNumber?: string;
  tenantIdNumber?: string;
  tenantType?: TenantType;
  tenantBusinessActivities?: string;
  tenantContactPerson?: string;
  tenantContactPosition?: string;
  tenantNotes?: string;
  identityImageFront?: File;
  identityImageBack?: File;
  commercialRegisterImage?: File;
  
  // Common fields
  unitId: number;
  contractType: ContractType;
  startDate: string;
  endDate: string;
  paymentMethod: PaymentMethod;
  paymentSchedule: PaymentSchedule;
  includesDeposit: boolean;
  depositAmount?: number;
  notes?: string;
  contractImage?: File;
  contractPdf?: File;
}

export interface UpdateReservationFormData {
  contractType?: ContractType;
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  paymentSchedule?: PaymentSchedule;
  includesDeposit?: boolean;
  depositAmount?: number;
  status?: ReservationStatus;
  notes?: string;
  contractImage?: File;
  contractPdf?: File;
}

export interface ReservationDetailsProps {
  reservation: Reservation;
  onUpdate?: (id: number, data: UpdateReservationFormData) => Promise<void>;
}

export interface ReservationFormProps {
  initialData?: Partial<CreateReservationFormData>;
  onSubmit: (data: CreateReservationFormData) => Promise<void>;
  isUpdate?: boolean;
}

export interface ReservationListItemProps {
  reservation: Reservation;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface ReservationListProps {
  reservations: Reservation[];
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface ReservationFilterProps {
  status?: ReservationStatus;
  contractType?: ContractType;
  startDate?: string;
  endDate?: string;
  onFilterChange: (filters: { 
    status?: ReservationStatus, 
    contractType?: ContractType,
    startDate?: string,
    endDate?: string
  }) => void;
}