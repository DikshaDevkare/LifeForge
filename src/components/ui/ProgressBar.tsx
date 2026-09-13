interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const colorClasses = {
  primary: 'from-primary-500 to-primary-400',
  secondary: 'from-secondary-500 to-secondary-400',
  accent: 'from-accent-500 to-accent-400',
  success: 'from-success-500 to-success-400',
  warning: 'from-warning-500 to-warning-400',
  error: 'from-error-500 to-error-400',
  neutral: 'from-neutral-500 to-neutral-400',
};

export function ProgressBar({
  value,
  max,
  label,
  showValue = false,
  size = 'md',
  color = 'primary',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm text-neutral-400">{label}</span>}
          {showValue && (
            <span className="text-sm font-mono text-neutral-300">
              {value.toLocaleString()} / {max.toLocaleString()}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-neutral-800 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
