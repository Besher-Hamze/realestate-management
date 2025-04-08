import { useState, useCallback } from 'react';
import { ApiResponse } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';

interface UseFormOptions<T, R> {
  onSuccess?: (data: R) => void;
  onError?: (error: string) => void;
  resetAfterSubmit?: boolean;
}

type SubmitFn<T, R> = (data: T) => Promise<ApiResponse<R>>;

export default function useForm<T, R = any>(
  submitFn: SubmitFn<T, R>,
  initialData: T,
  options: UseFormOptions<T, R> = {}
) {
  const {
    onSuccess,
    onError,
    resetAfterSubmit = false,
  } = options;

  const [formData, setFormData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [responseData, setResponseData] = useState<R | null>(null);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement> | Event, data: T = formData) => {
      // Prevent default form submission behavior
      if (e && 'preventDefault' in e) {
        e.preventDefault();
      }
      
      try {
        setIsSubmitting(true);
        setError(null);
        
        const response = await submitFn(data);
        
        if (response.success && response.data) {
          setIsSuccess(true);
          setResponseData(response.data);
          
          if (resetAfterSubmit) {
            setFormData(initialData);
          }
          
          if (onSuccess) {
            onSuccess(response.data);
          }
          
          return response;
        } else {
          const errorMessage = response.message || 'An error occurred';
          setError(errorMessage);
          
          if (onError) {
            onError(errorMessage);
          }
          
          return response;
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        
        if (onError) {
          onError(errorMessage);
        }
        
        return {
          success: false,
          message: errorMessage,
          data: null as unknown as R,
        } as ApiResponse<R>;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, initialData, onError, onSuccess, resetAfterSubmit, submitFn]
  );

  // Update form data
  const updateFormData = useCallback((newData: Partial<T>) => {
    setFormData((prevData) => {
      const updated = { ...prevData, ...newData };
      const hasChanges = Object.keys(newData).some(
        key => prevData[key as keyof T] !== newData[key as keyof T]
      );
      return hasChanges ? updated : prevData;
    });
  }, []);
  

  // Handle form field change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      
      // Handle different input types
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        updateFormData({ [name]: checked } as unknown as Partial<T>);
      } 
      // Only convert specific fields to numbers, not any field with "id" in the name
      else if (type === 'number' || name === 'buildingId') {
        const numericValue = value === '' ? 0 : Number(value);
        updateFormData({ [name]: numericValue } as unknown as Partial<T>);
      } else {
        updateFormData({ [name]: value } as unknown as Partial<T>);
      }
    },
    [updateFormData]
  );
  

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, files } = e.target;
      if (files && files.length > 0) {
        updateFormData({ [name]: files[0] } as unknown as Partial<T>);
      } else {
        // Clear file if no file is selected
        updateFormData({ [name]: null } as unknown as Partial<T>);
      }
    },
    [updateFormData]
  );

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setError(null);
    setIsSuccess(false);
    setResponseData(null);
  }, [initialData]);

  return {
    formData,
    isSubmitting,
    error,
    isSuccess,
    responseData,
    handleSubmit,
    handleChange,
    handleFileChange,
    updateFormData,
    resetForm,
    setFormData,
  };
}