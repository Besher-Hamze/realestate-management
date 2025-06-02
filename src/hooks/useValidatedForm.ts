import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

interface UseValidatedFormOptions<T> {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  validateOnChange?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface UseValidatedFormReturn<T> {
  formData: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  hasErrors: boolean;
  updateField: (field: keyof T, value: any) => void;
  updateFormData: (data: Partial<T>) => void;
  setFormData: (data: T) => void;
  resetForm: () => void;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
  submitForm: (submitFunction: (data: T) => Promise<any>) => Promise<void>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function useValidatedForm<T extends Record<string, any>>(
  initialData: T,
  validationFunction: (data: T) => Record<string, string>,
  options: UseValidatedFormOptions<T> = {}
): UseValidatedFormReturn<T> {
  const {
    onSuccess,
    onError,
    validateOnChange = false,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const [formData, setFormDataState] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasErrors = Object.keys(errors).length > 0;

  // Update single field
  const updateField = useCallback((field: keyof T, value: any) => {
    setFormDataState(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when value changes
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }

    // Validate on change if enabled
    if (validateOnChange) {
      const newData = { ...formData, [field]: value };
      const fieldErrors = validationFunction(newData);
      if (fieldErrors[field as string]) {
        setErrors(prev => ({
          ...prev,
          [field as string]: fieldErrors[field as string],
        }));
      }
    }
  }, [formData, errors, validateOnChange, validationFunction]);

  // Update multiple fields
  const updateFormData = useCallback((data: Partial<T>) => {
    setFormDataState(prev => ({
      ...prev,
      ...data,
    }));
  }, []);

  // Set complete form data
  const setFormData = useCallback((data: T) => {
    setFormDataState(data);
    setErrors({});
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormDataState(initialData);
    setErrors({});
    setIsSubmitting(false);
  }, [initialData]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Clear specific field error
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Validate single field
  const validateField = useCallback((field: keyof T): boolean => {
    const fieldErrors = validationFunction(formData);
    const fieldError = fieldErrors[field as string];

    if (fieldError) {
      setErrors(prev => ({
        ...prev,
        [field as string]: fieldError,
      }));
      return false;
    } else {
      clearFieldError(field as string);
      return true;
    }
  }, [formData, validationFunction, clearFieldError]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const formErrors = validationFunction(formData);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [formData, validationFunction]);

  // Submit form with validation
  const submitForm = useCallback(async (submitFunction: (data: T) => Promise<any>) => {
    // Clear previous errors
    clearErrors();

    // Validate form
    if (!validateForm()) {
      if (showErrorToast) {
        toast.error('يرجى تصحيح الأخطاء في النموذج');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitFunction(formData);
      
      if (result && result.success !== false) {
        if (showSuccessToast) {
          toast.success('تم الحفظ بنجاح');
        }
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        const errorMessage = result?.message || 'حدث خطأ ما';
        if (showErrorToast) {
          toast.error(errorMessage);
        }
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      const errorMessage = error.message || 'حدث خطأ في الإرسال';
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, clearErrors, showSuccessToast, showErrorToast, onSuccess, onError]);

  // Handle standard input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    // Handle different input types
    if (type === 'number') {
      processedValue = value === '' ? 0 : Number(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }

    updateField(name as keyof T, processedValue);
  }, [updateField]);

  return {
    formData,
    errors,
    isSubmitting,
    hasErrors,
    updateField,
    updateFormData,
    setFormData,
    resetForm,
    clearErrors,
    clearFieldError,
    validateField,
    validateForm,
    submitForm,
    handleInputChange,
  };
}

// Hook specifically for file handling in forms
export function useFileUpload() {
  const [files, setFiles] = useState<Record<string, FileList | null>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const updateFile = useCallback((fieldName: string, fileList: FileList | null) => {
    setFiles(prev => ({
      ...prev,
      [fieldName]: fileList,
    }));

    // Clear error when file is selected
    if (fileList && fileList.length > 0) {
      setFileErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, []);

  const getFile = useCallback((fieldName: string): File | null => {
    const fileList = files[fieldName];
    return fileList && fileList.length > 0 ? fileList[0] : null;
  }, [files]);

  const validateFiles = useCallback((validationRules: Record<string, (file: File | null) => string | null>): boolean => {
    const errors: Record<string, string> = {};

    Object.entries(validationRules).forEach(([fieldName, validator]) => {
      const file = getFile(fieldName);
      const error = validator(file);
      if (error) {
        errors[fieldName] = error;
      }
    });

    setFileErrors(errors);
    return Object.keys(errors).length === 0;
  }, [getFile]);

  const clearFileErrors = useCallback(() => {
    setFileErrors({});
  }, []);

  const resetFiles = useCallback(() => {
    setFiles({});
    setFileErrors({});
  }, []);

  return {
    files,
    fileErrors,
    updateFile,
    getFile,
    validateFiles,
    clearFileErrors,
    resetFiles,
  };
}

// Helper hook for managing form steps
export function useFormSteps(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  }, [totalSteps]);

  const markStepCompleted = useCallback((step: number) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  }, []);

  const markStepIncomplete = useCallback((step: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(step);
      return newSet;
    });
  }, []);

  const isStepCompleted = useCallback((step: number): boolean => {
    return completedSteps.has(step);
  }, [completedSteps]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const canGoNext = currentStep < totalSteps - 1;
  const canGoPrev = currentStep > 0;

  return {
    currentStep,
    totalSteps,
    completedSteps,
    nextStep,
    prevStep,
    goToStep,
    markStepCompleted,
    markStepIncomplete,
    isStepCompleted,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,
  };
}

export type { UseValidatedFormOptions, UseValidatedFormReturn };
