import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  helpText?: string;
  emptyOptionLabel?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      className,
      fullWidth = false,
      leftIcon,
      helpText,
      required,
      emptyOptionLabel = 'Select an option',
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('mb-4', fullWidth ? 'w-full' : '')}>
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          
          <select
            ref={ref}
            className={cn(
              'shadow-sm bg-white focus:ring-primary-500 focus:border-primary-500 block border rounded-md',
              leftIcon ? 'pl-10' : 'pl-3',
              'pr-10 py-2 text-base sm:text-sm w-full',
              error ? 'border-red-500' : 'border-gray-300',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${props.id || props.name}-error`
                : helpText
                ? `${props.id || props.name}-description`
                : undefined
            }
            {...props}
          >
            {/* Empty option */}
            {!props.value && (
              <option value="">{emptyOptionLabel}</option>
            )}
            
            {/* Render options */}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        
        {helpText && !error && (
          <p
            className="mt-1 text-sm text-gray-500"
            id={`${props.id || props.name}-description`}
          >
            {helpText}
          </p>
        )}
        
        {error && (
          <p
            className="mt-1 text-sm text-red-600"
            id={`${props.id || props.name}-error`}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;