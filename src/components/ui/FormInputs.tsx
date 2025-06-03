import React, { forwardRef } from 'react';
import { UseFormRegister, FieldError, Path, FieldValues } from 'react-hook-form';
import { cn } from '@/lib/utils';

// Legacy Input component for backward compatibility
interface LegacyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const LegacyInput = forwardRef<HTMLInputElement, LegacyInputProps>(
  ({
    className,
    label,
    error,
    helpText,
    required = false,
    startIcon,
    endIcon,
    wrapperClassName,
    type = 'text',
    ...props
  }, ref) => {
    const inputId = React.useId();

    return (
      <div className={cn("space-y-1", wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}

        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {startIcon}
              </div>
            </div>
          )}

          <input
            id={inputId}
            type={type}
            className={cn(
              "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm",
              error && "border-red-300 focus:ring-red-500 focus:border-red-500",
              startIcon && "pl-10",
              endIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />

          {endIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {endIcon}
              </div>
            </div>
          )}
        </div>

        {helpText && !error && (
          <p className="text-xs text-gray-500">{helpText}</p>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
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
        )}
      </div>
    );
  }
);

LegacyInput.displayName = 'LegacyInput';

// New React Hook Form Input component
// New React Hook Form Input component
interface FormInputProps<T extends FieldValues> extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  register: UseFormRegister<T>;
  name: Path<T>;
  error?: FieldError;
  helpText?: string;
  required?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  wrapperClassName?: string;
  preventStep?: boolean;
}

function FormInput<T extends FieldValues>({
  label,
  register,
  name,
  error,
  helpText,
  required = false,
  startIcon,
  endIcon,
  wrapperClassName,
  type = 'text',
  className,
  preventStep = true,
  ...props
}: FormInputProps<T>) {
  const inputId = React.useId();

  // Prevent non-numeric characters for tel input
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    if (type === 'tel') {
      const input = e.currentTarget;
      const value = input.value;
      // Allow only numbers (and optionally +, -, (), or spaces for phone numbers)
      const validPhoneNumber = value.replace(/[^0-9+()-]/g, '');
      if (value !== validPhoneNumber) {
        input.value = validPhoneNumber;
      }
    }
    // Call original onInput if provided
    if (props.onInput) {
      props.onInput(e);
    }
  };

  // Prevent step behavior for number inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (preventStep && type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
    }
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (preventStep && type === 'number') {
      e.currentTarget.blur();
    }
    if (props.onWheel) {
      props.onWheel(e);
    }
  };

  return (
    <div className={cn('space-y-1', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">{startIcon}</div>
          </div>
        )}

        <input
          id={inputId}
          type={type}
          {...register(name, {
            ...(type === 'tel' && {
              pattern: {
                value: /^[0-9+()-]*$/, // Allow numbers, +, -, and () for phone numbers
                message: 'Please enter a valid phone number (numbers, +, -, or () only)',
              },
            }),
          })}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          className={cn(
            'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
            startIcon && 'pl-10',
            endIcon && 'pr-10',
            className
          )}
          {...props}
        />

        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">{endIcon}</div>
          </div>
        )}
      </div>

      {helpText && !error && <p className="text-xs text-gray-500">{helpText}</p>}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
}

export default FormInput;

// For backward compatibility
const Input = LegacyInput;

// TextArea Component
interface FormTextAreaProps<T extends FieldValues> extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  register: UseFormRegister<T>;
  name: Path<T>;
  error?: FieldError;
  helpText?: string;
  required?: boolean;
  wrapperClassName?: string;
}

function FormTextArea<T extends FieldValues>({
  label,
  register,
  name,
  error,
  helpText,
  required = false,
  wrapperClassName,
  rows = 3,
  className,
  ...props
}: FormTextAreaProps<T>) {
  const textareaId = React.useId();

  return (
    <div className={cn("space-y-1", wrapperClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        {...register(name)}
        className={cn(
          "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-vertical",
          error && "border-red-300 focus:ring-red-500 focus:border-red-500",
          className
        )}
        {...props}
      />

      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
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
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
}

// Select Component
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps<T extends FieldValues> extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  register: UseFormRegister<T>;
  name: Path<T>;
  error?: FieldError;
  helpText?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

function FormSelect<T extends FieldValues>({
  label,
  register,
  name,
  error,
  helpText,
  required = false,
  options,
  placeholder,
  wrapperClassName,
  className,
  ...props
}: FormSelectProps<T>) {
  const selectId = React.useId();

  return (
    <div className={cn("space-y-1", wrapperClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      <select
        id={selectId}
        {...register(name)}
        className={cn(
          "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm",
          error && "border-red-300 focus:ring-red-500 focus:border-red-500",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
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
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
}

// File Input Component
interface FormFileInputProps<T extends FieldValues> {
  label?: string;
  name: Path<T>;
  error?: FieldError;
  helpText?: string;
  required?: boolean;
  accept: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  wrapperClassName?: string;
  disabled?: boolean;
  currentFile?: string | null;
  selectedFile?: File | null;
}

function FormFileInput<T extends FieldValues>({
  label,
  name,
  error,
  helpText,
  required = false,
  accept,
  multiple = false,
  onChange,
  wrapperClassName,
  disabled = false,
  currentFile,
  selectedFile,
}: FormFileInputProps<T>) {
  const fileInputId = React.useId();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    onChange(files);

    // Create preview URL for image files
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    onChange(files);

    // Create preview URL for image files
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  };

  // Create preview URL for selectedFile prop
  React.useEffect(() => {
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearFile = () => {
    onChange(null);
    setPreviewUrl(null);
    // Clear the file input
    const input = document.getElementById(fileInputId) as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };

  return (
    <div className={cn("space-y-1", wrapperClassName)}>
      {label && (
        <label
          htmlFor={fileInputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          error
            ? "border-red-300 bg-red-50"
            : isDragOver
              ? "border-primary-400 bg-primary-50"
              : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id={fileInputId}
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

        {/* File Preview Section */}
        {(selectedFile || currentFile || previewUrl) && (
          <div className="mt-4 space-y-3">
            {/* Image Preview */}
            {previewUrl && (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="معاينة الصورة"
                  className="max-w-full h-32 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            )}

            {/* Selected File Info */}
            {selectedFile && (
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      الملف المحدد: {selectedFile.name}
                    </p>
                    <p className="text-xs text-blue-700">
                      الحجم: {(selectedFile.size / 1024 / 1024).toFixed(2)} ميجابايت
                    </p>
                  </div>
                  {!previewUrl && (
                    <button
                      type="button"
                      onClick={clearFile}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      إزالة
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Current File (for edit mode) */}
            {currentFile && !selectedFile && (
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-sm text-gray-700">
                  الملف الحالي: {currentFile}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
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
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
}

export {
  Input,
  LegacyInput,
  FormInput,
  FormTextArea,
  FormSelect,
  FormFileInput
};

export type {
  FormInputProps,
  FormTextAreaProps,
  FormSelectProps,
  FormFileInputProps,
  SelectOption
};
