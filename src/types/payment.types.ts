import { 
  Payment, 
  PaymentStatus 
} from '@/lib/types';

export interface CreatePaymentFormData {
  reservationId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: PaymentStatus;
  notes?: string;
  checkImage?: File;
}

export interface UpdatePaymentFormData {
  amount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  status?: PaymentStatus;
  notes?: string;
  checkImage?: File;
}

export interface PaymentDetailsProps {
  payment: Payment;
  onUpdate?: (id: number, data: UpdatePaymentFormData) => Promise<void>;
}

export interface PaymentFormProps {
  initialData?: Partial<CreatePaymentFormData>;
  onSubmit: (data: CreatePaymentFormData) => Promise<void>;
  isUpdate?: boolean;
  reservationOptions?: Array<{value: number, label: string}>;
}

export interface PaymentListItemProps {
  payment: Payment;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface PaymentListProps {
  payments: Payment[];
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export interface PaymentFilterProps {
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  reservationId?: number;
  onFilterChange: (filters: { 
    status?: PaymentStatus, 
    startDate?: string,
    endDate?: string,
    minAmount?: number,
    maxAmount?: number,
    reservationId?: number
  }) => void;
}