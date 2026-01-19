export interface ValidationResult {
  success: boolean;
  data: {
    phone: string;
    status: string;
    message?: string;
    raw?: any;
  } | null;
  error: {
    code: string;
    message: string;
    field?: string;
  } | null;
  message: string;
}

export interface PhoneValidationFormData {
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}
