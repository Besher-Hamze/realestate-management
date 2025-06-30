import { apiRequest, formDataRequest } from '@/utils/axios';
import {
  ApiResponse,
  AuthResponse,
  User,
  Building,
  BuildingFormData,
  Company,
  CompanyFormData,
  RealEstateUnit,
  UnitFormData,
  Reservation,
  ReservationFormData,
  ServiceOrder,
  ServiceOrderFormData,
  Payment,
  PaymentFormData,
  Tenant,
  TenantFormData,
  GeneralStatistics,
  UnitStatusStatistics,
  ServiceStatusStatistics,
  Expense,
  ExpenseFormData,
  ExpenseStatistics,
  AvaibleParkingData
} from './types';

// Manager credentials interface for company creation response
interface ManagerCredentials {
  companyId: number;
  email: string;
  fullName: string;
  id: number;
  password: string;
  role: string;
  username: string;
}

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

  registerAdmin: (data: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone: string;
  }) =>
    apiRequest<User>({
      url: '/auth/admin/register',
      method: 'POST',
      data,
    }),

  registerManager: (data: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone: string;
  }) =>
    apiRequest<User>({
      url: '/auth/manager/register',
      method: 'POST',
      data,
    }),


  registerAccountant: (data: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone: string;
  }) =>
    apiRequest<User>({
      url: '/auth/accountant/register',
      method: 'POST',
      data,
    }),

  registerMaintenance: (data: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone: string;
  }) =>
    apiRequest<User>({
      url: '/auth/maintenance/register',
      method: 'POST',
      data,
    }),


  registerOwner: (data: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone: string;
  }) =>
    apiRequest<User>({
      url: '/auth/owner/register',
      method: 'POST',
      data,
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<ApiResponse<null>>({
      url: '/auth/change-password',
      method: 'POST',
      data: { currentPassword, newPassword },
    }),

  resetManagerPassword: (managerId: number, newPassword: string) =>
    apiRequest<ApiResponse<null>>({
      url: '/auth/reset-manager-password',
      method: 'POST',
      data: { managerId, newPassword },
    }),
};

// Buildings
export const buildingsApi = {
  getAll: () =>
    apiRequest<Building[]>({
      url: '/buildings',
      method: 'GET',
    }),




  getById: (id: number | string) =>
    apiRequest<Building>({
      url: `/buildings/${id}`,
      method: 'GET',
    }),

  getByCompany: (companyId: number | string) =>
    apiRequest<Building[]>({
      url: `/buildings/company/${companyId}`,
      method: 'GET',
    }),

  create: (data: BuildingFormData) =>
    apiRequest<Building>({
      url: '/buildings',
      method: 'POST',
      data,
    }),

  update: (id: number | string, data: Partial<BuildingFormData>) =>
    apiRequest<Building>({
      url: `/buildings/${id}`,
      method: 'PUT',
      data,
    }),

  delete: (id: number | string) =>
    apiRequest<ApiResponse<null>>({
      url: `/buildings/${id}`,
      method: 'DELETE',
    }),
};

// Companies
export const companiesApi = {
  getAll: () =>
    apiRequest<Company[]>({
      url: '/companies',
      method: 'GET',
    }),

  getById: (id: number | string, includeManager: boolean = false) =>
    apiRequest<Company>({
      url: `/companies/${id}${includeManager ? '?includeManager=true' : ''}`,
      method: 'GET',
    }),

  create: (data: CompanyFormData) =>
    formDataRequest<{ company: Company; manager?: ManagerCredentials }>(
      '/companies',
      'POST',
      {
        name: data.name,
        companyType: data.companyType,
        email: data.email,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber || '',
        secondaryPhone: data.secondaryPhone || '',
        registrationNumber: data.registrationNumber || '',
        delegateName: data.delegateName || '',
        address: data.address,
        managerFullName: data.managerFullName || '',
        managerEmail: data.managerEmail || '',
        managerPhone: data.managerPhone || '',
      },
      {
        logoImage: data.logoImage,
        identityImageFront: data.identityImageFront,
        identityImageBack: data.identityImageBack
      }
    ),

  update: (id: number | string, data: Partial<CompanyFormData>) =>
    formDataRequest<Company>(
      `/companies/${id}`,
      'PUT',
      {
        name: data.name,
        companyType: data.companyType,
        email: data.email,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber || '',
        secondaryPhone: data.secondaryPhone || '',
        registrationNumber: data.registrationNumber || '',
        delegateName: data.delegateName || '',
        address: data.address,
      },
      {
        logoImage: data.logoImage,
        identityImageFront: data.identityImageFront,
        identityImageBack: data.identityImageBack
      }
    ),

  delete: (id: number | string) =>
    apiRequest<ApiResponse<null>>({
      url: `/companies/${id}`,
      method: 'DELETE',
    }),
};

// Units
export const unitsApi = {
  getAll: () =>
    apiRequest<RealEstateUnit[]>({
      url: '/units',
      method: 'GET',
    }),

  getAvaibleParking: (buildingId: number) =>
    apiRequest<AvaibleParkingData>({
      url: `/units/parking/available/${buildingId}`,
      method: 'GET',
    }),
  getAvailable: (filters?: {
    minPrice?: number;
    maxPrice?: number;
    bathrooms?: number;
    buildingId?: number;
    unitType?: string;
    unitLayout?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiRequest<RealEstateUnit[]>({
      url: `/units/unit-building/available${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      method: 'GET',
    });
  },

  getById: (id: number | string) =>
    apiRequest<RealEstateUnit>({
      url: `/units/${id}`,
      method: 'GET',
    }),

  getByBuildingId: (buildingId: number | string) =>
    apiRequest<RealEstateUnit[]>({
      url: `/units/building/${buildingId}`,
      method: 'GET',
    }),

  create: (data: UnitFormData) =>
    apiRequest<RealEstateUnit>({
      url: '/units',
      method: 'POST',
      data,
    }),

  update: (id: number | string, data: Partial<UnitFormData>) =>
    apiRequest<RealEstateUnit>({
      url: `/units/${id}`,
      method: 'PUT',
      data,
    }),

  delete: (id: number | string) =>
    apiRequest<ApiResponse<null>>({
      url: `/units/${id}`,
      method: 'DELETE',
    }),
};

// Tenants
export const tenantsApi = {
  getAll: () =>
    apiRequest<Tenant[]>({
      url: '/tenants',
      method: 'GET',
    }),

  getById: (id: number | string) =>
    apiRequest<Tenant>({
      url: `/tenants/${id}`,
      method: 'GET',
    }),

  getByUserId: (userId: number | string) =>
    apiRequest<Tenant>({
      url: `/tenants/user/${userId}`,
      method: 'GET',
    }),

  getMyInfo: () =>
    apiRequest<Tenant>({
      url: '/tenants/my-info',
      method: 'GET',
    }),

  create: (data: TenantFormData) => {
    const formData = new FormData();

    // Add all fields to formData
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return formDataRequest<Tenant>(
      '/tenants',
      'POST',
      {},
      {
        identityImageFront: data.identityImageFront,
        identityImageBack: data.identityImageBack,
        commercialRegisterImage: data.commercialRegisterImage,
      },
      formData
    );
  },

  update: (id: number | string, data: Partial<TenantFormData>) => {
    const formData = new FormData();

    // Add all fields to formData
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return formDataRequest<Tenant>(
      `/tenants/${id}`,
      'PUT',
      {},
      {
        identityImageFront: data.identityImageFront,
        identityImageBack: data.identityImageBack,
        commercialRegisterImage: data.commercialRegisterImage,
      },
      formData
    );
  },

  delete: (id: number | string) =>
    apiRequest<ApiResponse<null>>({
      url: `/tenants/${id}`,
      method: 'DELETE',
    }),
};

// Reservations
export const reservationsApi = {
  getAll: () =>
    apiRequest<Reservation[]>({
      url: '/reservations',
      method: 'GET',
    }),

  getMy: () =>
    apiRequest<Reservation[]>({
      url: '/reservations/my',
      method: 'GET',
    }),

  getById: (id: number | string) =>
    apiRequest<Reservation>({
      url: `/reservations/${id}`,
      method: 'GET',
    }),

  getByUnitId: (unitId: number | string) =>
    apiRequest<Reservation[]>({
      url: `/reservations/unit/${unitId}`,
      method: 'GET',
    }),

  getByUserId: (userId: number | string) =>
    apiRequest<Reservation[]>({
      url: `/reservations/user/${userId}`,
      method: 'GET',
    }),

  create: (data: ReservationFormData) => {
    const formData = new FormData();

    // Add all fields to formData
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        // formData.append(key, value);
      } else if (value !== undefined && value !== null) {
        console.log(value);

        formData.append(key, String(value));
      }
    });

    return formDataRequest<Reservation>(
      '/reservations',
      'POST',
      {},
      {
        contractImage: data.contractImage,
        contractPdf: data.contractPdf,
        identityImageFront: data.identityImageFront,
        identityImageBack: data.identityImageBack,
        commercialRegisterImage: data.commercialRegisterImage,
        depositCheckImage: data.depositCheckImage
      },
      formData
    );
  },

  update: (id: number | string, data: Partial<ReservationFormData>) => {
    const formData = new FormData();

    // Add all fields to formData
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return formDataRequest<Reservation>(
      `/reservations/${id}`,
      'PUT',
      {},
      {
        contractImage: data.contractImage,
        contractPdf: data.contractPdf,
      },
      formData
    );
  },

  delete: (id: number | string) =>
    apiRequest<ApiResponse<null>>({
      url: `/reservations/${id}`,
      method: 'DELETE',
    }),
};

// Service Orders
export const servicesApi = {
  getAll: () =>
    apiRequest<ServiceOrder[]>({
      url: '/services',
      method: 'GET',
    }),

  getById: (id: number | string) =>
    apiRequest<ServiceOrder>({
      url: `/services/${id}`,
      method: 'GET',
    }),

  getByReservationId: (reservationId: number | string) =>
    apiRequest<ServiceOrder[]>({
      url: `/services/reservation/${reservationId}`,
      method: 'GET',
    }),

  // Service history endpoint
  getServiceHistory: (serviceId: number | string) =>
    apiRequest<{ status: string, date: string, note?: string }[]>({
      url: `/services/${serviceId}/history`,
      method: 'GET',
    }),

  // Added service comments API
  getServiceComments: (serviceId: number | string) =>
    apiRequest<any[]>({
      url: `/services/${serviceId}/comments`,
      method: 'GET',
    }),

  // Add a comment to a service
  addServiceComment: (serviceId: number | string, message: string, file?: File) => {
    const formData = new FormData();
    formData.append('message', message);

    if (file) {
      formData.append('attachment', file);
    }

    return apiRequest<any>({
      url: `/services/${serviceId}/comments`,
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  create: (data: ServiceOrderFormData) => {
    try {
      return formDataRequest<ServiceOrder>(
        '/services',
        'POST',
        {
          reservationId: data.reservationId,
          serviceType: data.serviceType,
          serviceSubtype: data.serviceSubtype,
          description: data.description,
        },
        data.attachmentFile ? { attachmentFile: data.attachmentFile } : undefined
      );
    } catch (error) {
      console.error('Error creating service order:', error);
      return Promise.resolve({
        success: false,
        message: 'Failed to create service order. Please try again.',
        data: {} as ServiceOrder,
      });
    }
  },

  update: (id: number | string, data: Partial<ServiceOrderFormData>) => {
    try {
      return formDataRequest<ServiceOrder>(
        `/services/${id}`,
        'PUT',
        data,
        data.attachmentFile ? { attachmentFile: data.attachmentFile } : undefined
      );
    } catch (error) {
      console.error('Error updating service order:', error);
      return Promise.resolve({
        success: false,
        message: 'Failed to update service order. Please try again.',
        data: {} as ServiceOrder,
      });
    }
  },

  // Added status update method
  updateStatus: (id: number | string, status: string, note?: string) => {
    try {
      return apiRequest<ServiceOrder>({
        url: `/services/${id}/status`,
        method: 'PATCH',
        data: { status, note },
      });
    } catch (error) {
      console.error('Error updating service status:', error);
      return Promise.resolve({
        success: false,
        message: 'Failed to update service status. Please try again.',
        data: {} as ServiceOrder,
      });
    }
  },

  delete: (id: number | string) =>
    apiRequest<ApiResponse<null>>({
      url: `/services/${id}`,
      method: 'DELETE',
    }),
};

// Payments
export const paymentsApi = {
  getAll: () =>
    apiRequest<Payment[]>({
      url: '/payments',
      method: 'GET',
    }),

  getById: (id: number | string) =>
    apiRequest<Payment>({
      url: `/payments/${id}`,
      method: 'GET',
    }),

  getByReservationId: (reservationId: number | string) =>
    apiRequest<Payment[]>({
      url: `/payments/reservation/${reservationId}`,
      method: 'GET',
    }),

  create: (data: PaymentFormData, files?: { checkImage?: File }) => {
    // If there are no files, use regular API request
    if (!files || !files.checkImage) {
      return apiRequest<Payment>({
        url: '/payments',
        method: 'POST',
        data,
      });
    }

    // If we have files, use FormData for uploading
    return formDataRequest<Payment>(
      '/payments',
      'POST',
      {
        reservationId: data.reservationId,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        status: data.status,
        notes: data.notes,
      },
      { checkImage: files.checkImage }
    );
  },

  update: (id: number | string, data: Partial<PaymentFormData>, files?: { checkImage?: File }) => {
    // If there are no files, use regular API request for simple updates
    if (!files || !files.checkImage) {
      return apiRequest<Payment>({
        url: `/payments/${id}`,
        method: 'PUT',
        data,
      });
    }

    // If we have files, use FormData for uploading
    return formDataRequest<Payment>(
      `/payments/${id}`,
      'PUT',
      {
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        status: data.status,
        notes: data.notes,
      },
      { checkImage: files.checkImage }
    );
  },

  delete: (id: number | string) =>
    apiRequest<ApiResponse<null>>({
      url: `/payments/${id}`,
      method: 'DELETE',
    }),
};

// Users
export const usersApi = {
  getAll: () =>
    apiRequest<User[]>({
      url: '/users',
      method: 'GET',
    }),

  getById: (id: number | string) =>
    apiRequest<User>({
      url: `/users/${id}`,
      method: 'GET',
    }),

  update: (id: number | string, data: {
    fullName?: string;
    email?: string;
    phone?: string;
    identityImage?: File;
    commercialRegisterImage?: File;
  }) =>
    formDataRequest<User>(
      `/users/${id}`,
      'PUT',
      {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      },
      {
        identityImage: data.identityImage,
        commercialRegisterImage: data.commercialRegisterImage,
      }
    ),

  delete: (id: number | string) =>
    apiRequest<ApiResponse<null>>({
      url: `/users/${id}`,
      method: 'DELETE',
    }),
};

// Dashboard
export const dashboardApi = {
  getStatistics: () =>
    apiRequest<GeneralStatistics>({
      url: '/dashboard/statistics',
      method: 'GET',
    }),

  getUnitsStatus: () =>
    apiRequest<UnitStatusStatistics>({
      url: '/dashboard/units-status',
      method: 'GET',
    }),

  getServicesStatus: () =>
    apiRequest<ServiceStatusStatistics>({
      url: '/dashboard/services-status',
      method: 'GET',
    }),
};

export const expensesApi = {
  getAll: () =>
    apiRequest<Expense[]>({
      url: '/expenses',
      method: 'GET',
    }),

  getById: (id: number | string) =>
    apiRequest<Expense>({
      url: `/expenses/${id}`,
      method: 'GET',
    }),

  getByUnitId: (unitId: number | string) =>
    apiRequest<Expense[]>({
      url: `/expenses/unit/${unitId}`,
      method: 'GET',
    }),

  getStatistics: () =>
    apiRequest<ExpenseStatistics>({
      url: '/expenses/statistics',
      method: 'GET',
    }),

  create: (data: ExpenseFormData) =>
    apiRequest<Expense>({
      url: '/expenses',
      method: 'POST',
      data,
    }),

  update: (id: number | string, data: Partial<ExpenseFormData>) =>
    apiRequest<Expense>({
      url: `/expenses/${id}`,
      method: 'PUT',
      data,
    }),

  delete: (id: number | string) =>
    apiRequest<ApiResponse<null>>({
      url: `/expenses/${id}`,
      method: 'DELETE',
    }),
};

