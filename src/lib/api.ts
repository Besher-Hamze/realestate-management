import { apiRequest, formDataRequest } from '@/utils/axios';
import {  AuthResponse, User } from './types';


// Authentication
export const authApi = {
  login: (username: string, password: string) => 
    apiRequest<AuthResponse>({
      url: '/auth/login',
      method: 'POST',
      data: { username, password },
    }),
  
  getMe: () => 
    apiRequest<User>({
      url: '/auth/me',
      method: 'GET',
    }),
    
  registerAdmin: (data: Record<string, any>) => 
    apiRequest<any>({
      url: '/auth/admin/register',
      method: 'POST',
      data,
    }),
    
  registerManager: (data: Record<string, any>) => 
    apiRequest<any>({
      url: '/auth/manager/register',
      method: 'POST',
      data,
    }),
    
  changePassword: (currentPassword: string, newPassword: string) => 
    apiRequest<any>({
      url: '/auth/change-password',
      method: 'POST',
      data: { currentPassword, newPassword },
    }),
    
  resetManagerPassword: (managerId: number, newPassword: string) => 
    apiRequest<any>({
      url: '/auth/reset-manager-password',
      method: 'POST',
      data: { managerId, newPassword },
    }),
};

// Buildings
export const buildingsApi = {
  getAll: () => 
    apiRequest<any>({
      url: '/buildings',
      method: 'GET',
    }),
    
  getById: (id: number | string) => 
    apiRequest<any>({
      url: `/buildings/${id}`,
      method: 'GET',
    }),
    
  create: (data: Record<string, any>) => 
    apiRequest<any>({
      url: '/buildings',
      method: 'POST',
      data,
    }),
    
  update: (id: number | string, data: Record<string, any>) => 
    apiRequest<any>({
      url: `/buildings/${id}`,
      method: 'PUT',
      data,
    }),
    
  delete: (id: number | string) => 
    apiRequest<any>({
      url: `/buildings/${id}`,
      method: 'DELETE',
    }),
};

// Companies
export const companiesApi = {
  getAll: () => 
    apiRequest<any>({
      url: '/companies',
      method: 'GET',
    }),
    
  getById: (id: number | string) => 
    apiRequest<any>({
      url: `/companies/${id}`,
      method: 'GET',
    }),
    
  create: (data: Record<string, any>, logoImage?: File) => 
    formDataRequest(
      '/companies',
      'POST',
      data,
      logoImage ? { logoImage } : undefined
    ),
    
  update: (id: number | string, data: Record<string, any>, logoImage?: File) => 
    formDataRequest(
      `/companies/${id}`,
      'PUT',
      data,
      logoImage ? { logoImage } : undefined
    ),
    
  delete: (id: number | string) => 
    apiRequest<any>({
      url: `/companies/${id}`,
      method: 'DELETE',
    }),
};

// Units
export const unitsApi = {
  getAll: () => 
    apiRequest<any>({
      url: '/units',
      method: 'GET',
    }),
    
  getAvailable: () => 
    apiRequest<any>({
      url: '/units/available',
      method: 'GET',
    }),
    
  getById: (id: number | string) => 
    apiRequest<any>({
      url: `/units/${id}`,
      method: 'GET',
    }),
    
  getByBuildingId: (buildingId: number | string) => 
    apiRequest<any>({
      url: `/units/building/${buildingId}`,
      method: 'GET',
    }),
    
  create: (data: Record<string, any>) => 
    apiRequest<any>({
      url: '/units',
      method: 'POST',
      data,
    }),
    
  update: (id: number | string, data: Record<string, any>) => 
    apiRequest<any>({
      url: `/units/${id}`,
      method: 'PUT',
      data,
    }),
    
  delete: (id: number | string) => 
    apiRequest<any>({
      url: `/units/${id}`,
      method: 'DELETE',
    }),
};

// Reservations
export const reservationsApi = {
  getAll: () => 
    apiRequest<any>({
      url: '/reservations',
      method: 'GET',
    }),
    
  getMy: () => 
    apiRequest<any>({
      url: '/reservations/my',
      method: 'GET',
    }),
    
  getById: (id: number | string) => 
    apiRequest<any>({
      url: `/reservations/${id}`,
      method: 'GET',
    }),
    
  getByUnitId: (unitId: number | string) => 
    apiRequest<any>({
      url: `/reservations/unit/${unitId}`,
      method: 'GET',
    }),
    
  getByUserId: (userId: number | string) => 
    apiRequest<any>({
      url: `/reservations/user/${userId}`,
      method: 'GET',
    }),
    
  create: (data: Record<string, any>, files?: Record<string, File | undefined>) => 
    formDataRequest(
      '/reservations',
      'POST',
      data,
      files
    ),
    
  update: (id: number | string, data: Record<string, any>, contractImage?: File) => 
    formDataRequest(
      `/reservations/${id}`,
      'PUT',
      data,
      contractImage ? { contractImage } : undefined
    ),
    
  delete: (id: number | string) => 
    apiRequest<any>({
      url: `/reservations/${id}`,
      method: 'DELETE',
    }),
};

// Service Orders
export const servicesApi = {
  getAll: () => 
    apiRequest<any>({
      url: '/services',
      method: 'GET',
    }),
    
  getById: (id: number | string) => 
    apiRequest<any>({
      url: `/services/${id}`,
      method: 'GET',
    }),
    
  getByReservationId: (reservationId: number | string) => 
    apiRequest<any>({
      url: `/services/reservation/${reservationId}`,
      method: 'GET',
    }),
    
  create: (data: Record<string, any>, attachmentFile?: File) => 
    formDataRequest(
      '/services',
      'POST',
      data,
      attachmentFile ? { attachmentFile } : undefined
    ),
    
  update: (id: number | string, data: Record<string, any>, attachmentFile?: File) => 
    formDataRequest(
      `/services/${id}`,
      'PUT',
      data,
      attachmentFile ? { attachmentFile } : undefined
    ),
    
  delete: (id: number | string) => 
    apiRequest<any>({
      url: `/services/${id}`,
      method: 'DELETE',
    }),
};

// Payments
export const paymentsApi = {
  getAll: () => 
    apiRequest<any>({
      url: '/payments',
      method: 'GET',
    }),
    
  getById: (id: number | string) => 
    apiRequest<any>({
      url: `/payments/${id}`,
      method: 'GET',
    }),
    
  getByReservationId: (reservationId: number | string) => 
    apiRequest<any>({
      url: `/payments/reservation/${reservationId}`,
      method: 'GET',
    }),
    
  create: (data: Record<string, any>, checkImage?: File) => 
    formDataRequest(
      '/payments',
      'POST',
      data,
      checkImage ? { checkImage } : undefined
    ),
    
  update: (id: number | string, data: Record<string, any>, checkImage?: File) => 
    formDataRequest(
      `/payments/${id}`,
      'PUT',
      data,
      checkImage ? { checkImage } : undefined
    ),
    
  delete: (id: number | string) => 
    apiRequest<any>({
      url: `/payments/${id}`,
      method: 'DELETE',
    }),
};

// Users
export const usersApi = {
  getAll: () => 
    apiRequest<any>({
      url: '/users',
      method: 'GET',
    }),
    
  getById: (id: number | string) => 
    apiRequest<any>({
      url: `/users/${id}`,
      method: 'GET',
    }),
    
  update: (id: number | string, data: Record<string, any>, files?: Record<string, File | undefined>) => 
    formDataRequest(
      `/users/${id}`,
      'PUT',
      data,
      files
    ),
    
  delete: (id: number | string) => 
    apiRequest<any>({
      url: `/users/${id}`,
      method: 'DELETE',
    }),
};

// Dashboard
export const dashboardApi = {
  getStatistics: () => 
    apiRequest<any>({
      url: '/dashboard/statistics',
      method: 'GET',
    }),
    
  getUnitsStatus: () => 
    apiRequest<any>({
      url: '/dashboard/units-status',
      method: 'GET',
    }),
    
  getServicesStatus: () => 
    apiRequest<any>({
      url: '/dashboard/services-status',
      method: 'GET',
    }),
};