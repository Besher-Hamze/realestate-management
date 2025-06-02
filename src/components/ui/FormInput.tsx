import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { FormError } from './FormValidation';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
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
        
        <FormError error={error} />
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  wrapperClassName?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ 
    className, 
    label, 
    error, 
    helpText, 
    required = false,
    wrapperClassName,
    rows = 3,
    ...props 
  }, ref) => {
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
          className={cn(
            "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-vertical",
            error && "border-red-300 focus:ring-red-500 focus:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {helpText && !error && (
          <p className="text-xs text-gray-500">{helpText}</p>
        )}
        
        <FormError error={error} />
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helpText, 
    required = false,
    options,
    placeholder,
    wrapperClassName,
    ...props 
  }, ref) => {
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
          className={cn(
            "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm",
            error && "border-red-300 focus:ring-red-500 focus:border-red-500",
            className
          )}
          ref={ref}
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
        
        <FormError error={error} />
      </div>
    );
  }
);

Select.displayName = 'Select';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  wrapperClassName?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ 
    className, 
    label, 
    description, 
    error,
    wrapperClassName,
    ...props 
  }, ref) => {
    const checkboxId = React.useId();

    return (
      <div className={cn("space-y-1", wrapperClassName)}>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id={checkboxId}
              type="checkbox"
              className={cn(
                "h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500",
                error && "border-red-300 focus:ring-red-500",
                className
              )}
              ref={ref}
              {...props}
            />
          </div>
          <div className="mr-3 text-sm">
            <label 
              htmlFor={checkboxId}
              className="font-medium text-gray-700 cursor-pointer"
            >
              {label}
            </label>
            {description && (
              <p className="text-gray-500">{description}</p>
            )}
          </div>
        </div>
        
        <FormError error={error} />
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

interface RadioGroupProps {
  label?: string;
  name: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  wrapperClassName?: string;
  direction?: 'horizontal' | 'vertical';
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  error,
  helpText,
  required = false,
  wrapperClassName,
  direction = 'vertical',
}) => {
  const groupId = React.useId();

  return (
    <div className={cn("space-y-1", wrapperClassName)}>
      {label && (
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </legend>
        </fieldset>
      )}
      
      <div className={cn(
        "space-y-2",
        direction === 'horizontal' && "flex flex-wrap gap-4 space-y-0"
      )}>
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              id={`${groupId}-${option.value}`}
              name={name}
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={option.disabled}
              className={cn(
                "h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500",
                error && "border-red-300 focus:ring-red-500"
              )}
            />
            <label 
              htmlFor={`${groupId}-${option.value}`}
              className="mr-3 text-sm font-medium text-gray-700 cursor-pointer"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      
      <FormError error={error} />
    </div>
  );
};

interface FileInputProps {
  label?: string;
  accept: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  wrapperClassName?: string;
  disabled?: boolean;
  currentFile?: string | null;
}

const FileInputComponent: React.FC<FileInputProps> = ({
  label,
  accept,
  multiple = false,
  onChange,
  error,
  helpText,
  required = false,
  wrapperClassName,
  disabled = false,
  currentFile,
}) => {
  const fileInputId = React.useId();
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files);
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
    onChange(e.dataTransfer.files);
  };

  const getAcceptedFileTypes = (accept: string): string => {
    const types = accept.split(',').map(type => type.trim());
    const imageTypes = types.filter(type => type.startsWith('image/'));
    const docTypes = types.filter(type => type.includes('pdf') || type.includes('doc'));
    
    let description = '';
    if (imageTypes.length > 0) {
      description += 'الصور (JPEG, PNG, GIF)';
    }
    if (docTypes.length > 0) {
      if (description) description += ' أو ';
      description += 'المستندات (PDF, DOC)';
    }
    
    return description || 'الملفات المدعومة';
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
              {helpText || `الملفات المقبولة: ${getAcceptedFileTypes(accept)}`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              الحد الأقصى للحجم: 10 ميجابايت
            </p>
          </div>
        </div>
        
        {currentFile && (
          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <p className="text-sm text-gray-700">
              الملف الحالي: {currentFile}
            </p>
          </div>
        )}
      </div>
      
      <FormError error={error} />
    </div>
  );
};

export { Input, TextArea, Select, Checkbox, RadioGroup, FileInputComponent as FileInput };
export type { InputProps, TextAreaProps, SelectProps, CheckboxProps, RadioGroupProps, FileInputProps };
