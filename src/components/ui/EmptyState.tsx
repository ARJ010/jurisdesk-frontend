import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`text-center py-16 px-4 flex flex-col items-center justify-center ${className}`}>
      <div className="p-4 bg-slate-50 rounded-full text-slate-400 mb-4 border border-slate-100/50">
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 font-heading">
        {title}
      </h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-normal">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} className="text-xs font-semibold">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
