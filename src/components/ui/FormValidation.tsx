import React from 'react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  error?: string;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ error, className }) => {
  if (!error) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-red-600 mt-1",
      className
    )}>
      <svg
        className="h-4 w-4 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{error}</span>
    </div>
  );
};

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  helpText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  children,
  className,
  helpText,
}) => {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {children}
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      <FormError error={error} />
    </div>
  );
};

interface FileInputProps {
  accept: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  error?: string;
  helpText?: string;
  className?: string;
  disabled?: boolean;
}

export const FileInput: React.FC<FileInputProps> = ({
  accept,
  multiple = false,
  onChange,
  error,
  helpText,
  className,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files);
  };

  return (
    <div className="space-y-1">
      <div className={cn(
        "relative border-2 border-dashed rounded-lg p-6 transition-colors",
        error 
          ? "border-red-300 bg-red-50" 
          : "border-gray-300 hover:border-gray-400",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900">
              اضغط لرفع الملف أو اسحب وأفلت
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {helpText || 'يرجى اختيار ملف مناسب'}
            </p>
          </div>
        </div>
      </div>
      
      <FormError error={error} />
    </div>
  );
};

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

interface ValidationSummaryProps {
  errors: Record<string, string>;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  className,
}) => {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) return null;

  return (
    <div className={cn(
      "bg-red-50 border border-red-200 rounded-md p-4",
      className
    )}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="mr-3">
          <h3 className="text-sm font-medium text-red-800">
            يرجى تصحيح الأخطاء التالية:
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {errorEntries.map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FormActionsProps {
  onSubmit: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onSubmit,
  onCancel,
  submitText = 'حفظ',
  cancelText = 'إلغاء',
  isLoading = false,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn(
      "flex items-center justify-end gap-3 pt-6 border-t border-gray-200",
      className
    )}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
      )}
      
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || isLoading}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading && (
          <svg
            className="w-4 h-4 mr-2 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {submitText}
      </button>
    </div>
  );
};

// Helper hook for form validation
export const useFormValidation = <T extends Record<string, any>>(
  validationFunction: (data: T) => Record<string, string>
) => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = React.useCallback((data: T): boolean => {
    const newErrors = validationFunction(data);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validationFunction]);

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = React.useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validate,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
};
