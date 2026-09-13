import { type ReactNode } from 'react';

type BadgeColor = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

const colorClasses: Record<BadgeColor, string> = {
  primary: 'bg-primary-500/15 text-primary-300 border-primary-500/20',
  secondary: 'bg-secondary-500/15 text-secondary-300 border-secondary-500/20',
  accent: 'bg-accent-500/15 text-accent-300 border-accent-500/20',
  success: 'bg-success-500/15 text-success-300 border-success-500/20',
  warning: 'bg-warning-500/15 text-warning-300 border-warning-500/20',
  error: 'bg-error-500/15 text-error-300 border-error-500/20',
  neutral: 'bg-neutral-700/30 text-neutral-400 border-neutral-600/30',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, color = 'neutral', size = 'sm', icon }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${colorClasses[color]} ${sizeClasses[size]}`}
    >
      {icon}
      {children}
    </span>
  );
}
