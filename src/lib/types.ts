// Auth Types
export type Role = 'admin' | 'manager' | 'accountant' | 'maintenance' | 'owner' | 'tenant';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  copassword?: string;
  whatsappNumber?: string;
  idNumber?: string;
  identityImageFrontUrl?: string;
  identityImageBackUrl?: string;
  commercialRegisterImageUrl?: string;
  role: Role;
  tenantInfo?: TenantInfo;
  companyId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Building Types
export type BuildingType = 'residential' | 'commercial' | 'mixed';
export type CompanyType = 'owner' | 'agency';

export interface Building {
  id: number;
  buildingNumber: string;
  companyId: number;
  name: string;
  address: string;
  buildingType: BuildingType;
  totalUnits: number;
  totalFloors: number;
  internalParkingSpaces: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  units?: RealEstateUnit[];
}

export interface AvaibleParkingData {
  buildingId: number;
  buildingName: string;
  totalParkingSpaces: number;
  usedParkingSpaces: number;
  availableParkingSpaces: number;
  availableSpots: string[];
  usedSpots: string[];
}

export interface BuildingFormData {
  companyId: number;
  buildingNumber: string;
  name: string;
  address: string;
  buildingType: BuildingType;
  totalUnits: number;
  totalFloors: number;
  internalParkingSpaces: number;
  description: string;
}

// Unit Types
export type UnitType = 'studio' | 'apartment' | 'shop' | 'office' | 'villa' | 'room';
export type UnitLayout = 'studio' | '1bhk' | '2bhk' | '3bhk' | '4bhk' | '5bhk' | '6bhk' | '7bhk' | 'other';
export type UnitStatus = 'available' | 'rented' | 'maintenance';

export interface RealEstateUnit {
  id: number;
  buildingId: number;
  ownerId: number;
  ownerName: string;
  unitNumber: string;
  unitType: UnitType;
  parkingNumber: string;
  unitLayout?: UnitLayout;
  floor: string; // Changed from number to string
  area: number;
  bathrooms: number;
  price: number;
  status: UnitStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  building?: Building;
  reservations?: Reservation[];
}

export interface UnitFormData {
  buildingId: number;
  unitNumber: string;
  unitType: UnitType;
  unitLayout?: UnitLayout;
  ownerId: number;
  parkingNumber: number;
  floor: string; // Changed from number to string
  area: number;
  bathrooms: number;
  price: number;
  status: UnitStatus;
  description: string;
}

// Company Types
export interface Company {
  id: number;
  name: string;
  companyType: CompanyType;
  email: string;
  phone: string;
  whatsappNumber?: string;
  secondaryPhone?: string;
  identityImageFront?: string;
  identityImageFrontUrl?: string;
  identityImageBack?: string;
  identityImageBackUrl?: string;
  registrationNumber?: string;
  delegateName?: string;
  address: string;
  logoImage?: string;
  logoImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
  };
  buildings?: Building[];
}

export interface CompanyFormData {
  name: string;
  companyType: CompanyType;
  email: string;
  phone: string;
  whatsappNumber?: string;
  secondaryPhone?: string;
  identityImageFront?: File;
  identityImageBack?: File;
  registrationNumber?: string;
  delegateName?: string;
  address: string;
  logoImage?: File;
  managerFullName?: string;
  managerEmail?: string;
  managerPhone?: string;
}

// Tenant Types
export type TenantType =
  'partnership' |
  'commercial_register' |
  'person' |
  'embassy' |
  'foreign_company' |
  'government' |
  'inheritance' |
  'civil_registry';

export interface Tenant {
  id: number;
  userId: number;
  tenantType: TenantType;
  businessActivities?: string;
  contactPerson?: string;
  contactPosition?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface TenantFormData {
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

// Reservation Types
export type ContractType = 'residential' | 'commercial';
export type PaymentMethod = 'cash' | 'checks';
export type PaymentSchedule = 'monthly' | 'quarterly' | 'triannual' | 'biannual' | 'annual';
export type ReservationStatus = 'active' | 'expired' | 'cancelled';

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
  includesDeposit: boolean;
  depositAmount?: number;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  unit?: RealEstateUnit;
  payments?: Payment[];
  serviceOrders?: ServiceOrder[];
}

export interface TenantInfo {
  tenantType: TenantType;
  businessActivities: string;
  contactPerson: string;
  contactPosition: string;
  notes: string;
}

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



// Enhanced deposit types
export type DepositPaymentMethod = 'cash' | 'check';
export type DepositStatus = 'unpaid' | 'paid' | 'returned';

export interface ReservationFormData {
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

  // Common reservation fields
  unitId: number;
  contractType: ContractType;
  startDate: string;
  endDate: string;
  paymentMethod: PaymentMethod;
  paymentSchedule: PaymentSchedule;

  // Enhanced deposit fields
  includesDeposit: boolean;
  depositAmount?: number;
  depositPaymentMethod?: DepositPaymentMethod;
  depositCheckImage?: File;
  depositStatus?: DepositStatus;
  depositPaidDate?: string;
  depositReturnedDate?: string;
  depositNotes?: string;

  notes?: string;
  contractImage?: File;
  contractPdf?: File;
}

// Service Order Types
export type ServiceType = 'financial' | 'maintenance' | 'administrative';
export type ServiceStatus = 'pending' | 'in-progress' | 'completed' | 'rejected';

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
  serviceHistory: { status: ServiceStatus, date: Date }[],
  createdAt: string;
  updatedAt: string;
  user?: User;
  reservation?: Reservation;
}

export interface ServiceOrderFormData {
  reservationId: number;
  serviceType: ServiceType;
  serviceSubtype: string;
  description: string;
  attachmentFile?: File;
  status: any
}

// Payment Types
export type PaymentStatus = 'paid' | 'pending' | 'delayed' | 'cancelled';

export interface Payment {
  id: number;
  reservationId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  checkImage?: string;
  checkImageUrl?: string;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reservation?: Reservation;
}

export interface PaymentFormData {
  reservationId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: PaymentStatus;
  notes?: string;
  checkImage?: File;
}

// Dashboard Statistics
export interface GeneralStatistics {
  totalBuildings: number;
  totalUnits: number;
  activeReservations: number;
  totalTenants: number;
  totalPendingServices: number;
  totalPayment: number;
}

export interface UnitStatusStatistics {
  available: number;
  rented: number;
  maintenance: number;
  total: number;
}

export interface ServiceStatusStatistics {
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
  total: number;
}

// API response type
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ExpenseType =
  | 'maintenance'    // صيانة
  | 'utilities'      // خدمات (كهرباء، ماء، إنترنت)
  | 'insurance'      // تأمين
  | 'cleaning'       // تنظيف
  | 'security'       // أمن
  | 'management'     // إدارة
  | 'repairs'        // إصلاحات
  | 'other';         // أخرى

export interface Expense {
  id: number;
  unitId: number;
  expenseType: ExpenseType;
  amount: number;
  expenseDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  unit?: RealEstateUnit;
}

export interface ExpenseFormData {
  unitId: number;
  expenseType: ExpenseType;
  amount: number;
  expenseDate: string;
  notes?: string;
}

export interface ExpenseStatistics {
  totalExpenses: number;
  monthlyExpenses: number;
  expensesByType: {
    maintenance: number;
    utilities: number;
    insurance: number;
    cleaning: number;
    security: number;
    management: number;
    repairs: number;
    other: number;
  };
  expensesByMonth: {
    month: string;
    amount: number;
  }[];
}
