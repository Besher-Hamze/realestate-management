// Export all validation modules
export * from './common';
export * from './auth';
export * from './building';
export * from './company';
export * from './payment';
export * from './reservation';
export * from './service';
export * from './tenant';
export * from './unit';

// Export validation helper functions
export {
  validateEmail,
  validatePhone,
  validateIdNumber,
  validatePassword,
  validateUrl,
  validateFileType,
  validateFileSize,
  validateDate,
  validateFutureDate,
  validatePastDate,
  formatFileSize,
} from './common';

// Export form validation functions
export { validateCompanyForm } from './company';
export { validateBuildingForm } from './building';
export { validateUnitForm } from './unit';
export { validateTenantForm } from './tenant';
export { validateReservationForm } from './reservation';
export { validateServiceForm } from './service';
export { validatePaymentForm } from './payment';
export { 
  validateLoginForm, 
  validateRegistrationForm, 
  validateChangePasswordForm,
  checkPasswordStrength 
} from './auth';

// Export options for dropdowns
export { UNIT_TYPE_OPTIONS, UNIT_LAYOUT_OPTIONS, UNIT_STATUS_OPTIONS } from './unit';
export { TENANT_TYPE_OPTIONS } from './tenant';
export { 
  CONTRACT_TYPE_OPTIONS, 
  PAYMENT_METHOD_OPTIONS, 
  PAYMENT_SCHEDULE_OPTIONS 
} from './reservation';
export { 
  SERVICE_TYPE_OPTIONS, 
  SERVICE_SUBTYPE_OPTIONS, 
  SERVICE_STATUS_OPTIONS 
} from './service';
export { 
  PAYMENT_METHOD_OPTIONS as PAYMENT_FORM_METHOD_OPTIONS, 
  PAYMENT_STATUS_OPTIONS,
  getPaymentStatusColor,
  formatPaymentAmount 
} from './payment';
export { USER_ROLE_OPTIONS } from './auth';
