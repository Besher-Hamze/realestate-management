import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  helpText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      className,
      fullWidth = false,
      leftIcon,
      rightIcon,
      helpText,
      required,
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
          
          <input
            ref={ref}
            className={cn(
              'shadow-sm bg-white focus:ring-primary-500 focus:border-primary-500 block border-gray-300 rounded-md',
              leftIcon ? 'pl-10' : 'pl-3',
              rightIcon ? 'pr-10' : 'pr-3',
              'py-2 sm:text-sm w-full',
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
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';

export default Input;