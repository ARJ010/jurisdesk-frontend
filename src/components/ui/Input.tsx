import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full h-10 px-3 rounded-lg border bg-white text-sm text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent ${
            error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
