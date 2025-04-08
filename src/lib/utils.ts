import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine class names with tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to locale string
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format phone number
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Handle international format
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Handle 10-digit US format
  if (phone.length === 10) {
    return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
  }
  
  return phone;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

// Get initials from name
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Check if user has a specific role
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

// Parse query parameters
export function parseQueryParams(
  params: URLSearchParams | Record<string, string>
): Record<string, string> {
  if (params instanceof URLSearchParams) {
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  
  return params;
}

// Create URL with query parameters
export function createUrlWithParams(
  baseUrl: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
}

// Extract error message from API response
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unknown error occurred';
}

// Check if object is empty
export function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

// Deep clone an object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Group array by property
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

// Check if current user is authorized to access resource
export function isAuthorized(userRole: string, requiredRoles: string[]): boolean {
  if (!userRole || !requiredRoles || requiredRoles.length === 0) {
    return false;
  }
  
  return requiredRoles.includes(userRole);
}

// Get status color by status type
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Reservation status
    pending: 'bg-yellow-200 text-yellow-800',
    active: 'bg-green-200 text-green-800',
    expired: 'bg-gray-200 text-gray-800',
    cancelled: 'bg-red-200 text-red-800',
    
    // Unit status
    available: 'bg-green-200 text-green-800',
    rented: 'bg-blue-200 text-blue-800',
    
    // Service status
    'in-progress': 'bg-blue-200 text-blue-800',
    completed: 'bg-green-200 text-green-800',
    
    // Payment status
    paid: 'bg-green-200 text-green-800',
    refunded: 'bg-purple-200 text-purple-800',
    failed: 'bg-red-200 text-red-800',
  };
  
  return statusColors[status.toLowerCase()] || 'bg-gray-200 text-gray-800';
}