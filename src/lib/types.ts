// Auth Types
export type Role = 'admin' | 'manager' | 'tenant';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  companyId?: number;
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
export type BuildingType = 'apartment' | 'commercial' | 'villa' | 'office';

export interface Building {
  id: number;
  name: string;
  address: string;
  buildingType: BuildingType;
  totalUnits: number;
  description: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingFormData {
  name: string;
  address: string;
  buildingType: BuildingType;
  totalUnits: number;
  description: string;
}

// Unit Types
export type UnitStatus = 'available' | 'rented';

export interface Unit {
  id: number;
  buildingId: number;
  unitNumber: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  status: UnitStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  building?: Building;
}

export interface UnitFormData {
  buildingId: number;
  unitNumber: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  status: UnitStatus;
  description: string;
}

// Company Types
export interface Company {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  logoImage?: File;
  managerFullName?: string;
  managerEmail?: string;
  managerPhone?: string;
}

// Reservation Types
export type ReservationStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface Reservation {
  id: number;
  unitId: number;
  userId: number;
  startDate: string;
  endDate: string;
  status: ReservationStatus;
  notes: string;
  contractUrl?: string;
  createdAt: string;
  updatedAt: string;
  unit?: Unit;
  user?: User;
}

export interface ReservationFormData {
  unitId: number;
  userId?: number;
  startDate: string;
  endDate: string;
  notes: string;
  contractImage?: File;
  fullName?: string;
  email?: string;
  phone?: string;
  identityImage?: File;
  commercialRegisterImage?: File;
}

// Service Order Types
export type ServiceType = 'maintenance' | 'cleaning' | 'security' | 'other';
export type ServiceSubtype = 
  | 'electrical' 
  | 'plumbing' 
  | 'hvac' 
  | 'appliance' 
  | 'structural' 
  | 'general';
export type ServiceStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface ServiceOrder {
  id: number;
  reservationId: number;
  serviceType: ServiceType;
  serviceSubtype: ServiceSubtype;
  description: string;
  status: ServiceStatus;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  reservation?: Reservation;
}

export interface ServiceOrderFormData {
  reservationId: number;
  serviceType: ServiceType;
  serviceSubtype: ServiceSubtype;
  description: string;
  attachmentFile?: File;
}

// Payment Types
export type PaymentMethod = 'cash' | 'credit_card' | 'bank_transfer' | 'check' | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface Payment {
  id: number;
  reservationId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  notes: string;
  checkUrl?: string;
  createdAt: string;
  updatedAt: string;
  reservation?: Reservation;
}

export interface PaymentFormData {
  reservationId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  notes: string;
  checkImage?: File;
}

// Dashboard Statistics
export interface GeneralStatistics {
  totalBuildings: number;
  totalUnits: number;
  totalReservations: number;
  totalServices: number;
}

export interface UnitStatusStatistics {
  available: number;
  rented: number;
}

export interface ServiceStatusStatistics {
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
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