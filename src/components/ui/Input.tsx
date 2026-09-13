import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-400 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-colors ${icon ? 'pl-10' : ''} ${error ? 'border-error-600 focus:border-error-600 focus:ring-error-600' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-error-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
