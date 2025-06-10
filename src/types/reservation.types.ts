import {
  TenantType,
  User,
  RealEstateUnit,
  Payment,
  ServiceOrder
} from '@/lib/types';

export type ContractType = 'residential' | 'commercial';
export type PaymentMethod = 'cash' | 'checks';
export type PaymentSchedule = 'monthly' | 'quarterly' | 'triannual' | 'biannual' | 'annual';
export type ReservationStatus = 'active' | 'expired' | 'cancelled';

// Enhanced deposit types
export type DepositPaymentMethod = 'cash' | 'check';
export type DepositStatus = 'unpaid' | 'paid' | 'returned';
export interface Reservation {
  id: number;
  userId: number;
  unitId: number;
  contractType: ContractType;
  startDate: string;
  endDate: string;
  contractDuration?: string;
  contractImage?: string;
  contractImageUrl?: string;
  contractPdf?: string;
  contractPdfUrl?: string;
  paymentMethod: PaymentMethod;
  paymentSchedule: PaymentSchedule;

  // Enhanced deposit fields
  includesDeposit: boolean;
  depositAmount?: number;
  depositPaymentMethod?: DepositPaymentMethod;
  depositCheckImage?: string;
  depositCheckImageUrl?: string;
  depositStatus?: DepositStatus;
  depositPaidDate?: string;
  depositReturnedDate?: string;
  depositNotes?: string;

  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  unit?: RealEstateUnit;
  payments?: Payment[];
  serviceOrders?: ServiceOrder[];
}

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