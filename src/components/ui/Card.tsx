import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string | ReactNode;
  footer?: ReactNode;
  bordered?: boolean;
  shadow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
  children,
  className,
  title,
  footer,
  bordered = true,
  shadow = true,
  padding = 'md',
}: CardProps) {
  // Map of padding styles
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg overflow-hidden',
        bordered && 'border border-gray-200',
        shadow && 'shadow-sm',
        className
      )}
    >
      {/* Card Header */}
      {title && (
        <div className="border-b border-gray-200 px-4 py-3">
          {typeof title === 'string' ? (
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      
      {/* Card Body */}
      <div className={cn(paddingStyles[padding])}>{children}</div>
      
      {/* Card Footer */}
      {footer && (
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
}