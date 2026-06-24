import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'paid' | 'unpaid' | 'waived' | 'neutral' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({ children, className = '', variant = 'neutral', ...props }) => {
  const baseStyle =
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors';

  const variants = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    unpaid: 'bg-rose-50 text-rose-700 border-rose-200',
    waived: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
