import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  iconClassName?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  description,
  iconClassName = 'text-slate-400 bg-slate-50',
  className = '',
}) => {
  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
      <CardContent className="p-5">
        {Icon && (
          <div className={`absolute right-4 top-4 p-2.5 rounded-lg ${iconClassName}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          {label}
        </span>
        <span className="text-2xl font-bold text-slate-950 mt-2 block font-heading">
          {value}
        </span>
        {description && (
          <span className="text-[10px] text-slate-400 mt-1 block">
            {description}
          </span>
        )}
      </CardContent>
    </Card>
  );
};
