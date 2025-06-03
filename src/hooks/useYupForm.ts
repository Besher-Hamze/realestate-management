import { useForm, UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';

// Generic hook for form handling with Yup validation
export function useYupForm<T extends FieldValues>(
  schema: yup.ObjectSchema<any>,
  defaultValues?: DefaultValues<T>,
  context?: Record<string, any>
): UseFormReturn<T> {
  return useForm<T>({
    resolver: yupResolver(schema, { context }),
    defaultValues,
    mode: 'onChange', // Validate on change for better UX
    reValidateMode: 'onChange',
  });
}

// Hook specifically for async form submission
export function useAsyncForm<T extends FieldValues>(
  schema: yup.ObjectSchema<any>,
  defaultValues?: DefaultValues<T>,
  context?: Record<string, any>
) {
  const form = useYupForm<T>(schema, defaultValues, context);

  const submitAsync = async (
    onSubmit: (data: T) => Promise<any>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: any) => void;
      onError?: (error: any) => void;
    }
  ) => {
    return form.handleSubmit(async (data) => {
      try {
        const result = await onSubmit(data);

        if (options?.successMessage) {
          toast.success(options.successMessage);
        }

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error: any) {
        console.error('Form submission error:', error);

        const errorMessage = options?.errorMessage ||
          error.message ||
          'حدث خطأ أثناء العملية';

        toast.error(errorMessage);

        if (options?.onError) {
          options.onError(error);
        }

        throw error;
      }
    });
  };

  return {
    ...form,
    submitAsync,
  };
}

// Hook for file handling in forms
export function useFileForm<T extends FieldValues>(
  schema: yup.ObjectSchema<any>,
  defaultValues?: DefaultValues<T>,
  context?: Record<string, any>
) {
  const form = useYupForm<T>(schema, defaultValues, context);

  const setFileValue = (fieldName: keyof T, file: File | null) => {
    form.setValue(fieldName, file as any, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  const getFilePreview = (fieldName: keyof T): string | null => {
    const file = form.watch(fieldName);
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const clearFile = (fieldName: keyof T) => {
    form.setValue(fieldName, null as any, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  return {
    ...form,
    setFileValue,
    getFilePreview,
    clearFile,
  };
}

// Custom validation trigger for conditional fields
export function useConditionalValidation<T extends FieldValues>(
  form: UseFormReturn<T>,
  dependencies: Array<keyof T>
) {
  const triggerConditionalValidation = async () => {
    // Trigger validation for dependent fields
    await form.trigger(dependencies as string[]);
  };

  return { triggerConditionalValidation };
}

// Hook for managing form steps/sections
export function useMultiStepForm<T extends FieldValues>(
  schema: yup.ObjectSchema<any>,
  defaultValues?: DefaultValues<T>,
  steps?: Array<Array<keyof T>>
) {
  const form = useYupForm<T>(schema, defaultValues);
  const [currentStep, setCurrentStep] = useState(0);

  const validateCurrentStep = async (): Promise<boolean> => {
    if (!steps || !steps[currentStep]) return true;

    const stepFields = steps[currentStep] as string[];
    const result = await form.trigger(stepFields);
    return result;
  };

  const nextStep = async (): Promise<boolean> => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < (steps?.length || 1) - 1) {
      setCurrentStep(prev => prev + 1);
      return true;
    }
    return false;
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = async (stepIndex: number): Promise<boolean> => {
    if (stepIndex >= 0 && stepIndex < (steps?.length || 1)) {
      // Validate all previous steps
      for (let i = 0; i < stepIndex; i++) {
        const stepFields = steps?.[i] as string[] || [];
        const isValid = await form.trigger(stepFields);
        if (!isValid) return false;
      }

      setCurrentStep(stepIndex);
      return true;
    }
    return false;
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === (steps?.length || 1) - 1;

  return {
    ...form,
    currentStep,
    setCurrentStep,
    validateCurrentStep,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep,
    isLastStep,
    totalSteps: steps?.length || 1,
  };
}

// React import for useState
import { useState } from 'react';
