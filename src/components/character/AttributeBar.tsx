import { ATTRIBUTE_META, type AttributeKey } from '@/types/database';
import {
  Swords,
  Brain,
  Heart,
  Wind,
  Sparkles,
  Eye,
  Plus,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  sword: Swords,
  brain: Brain,
  heart: Heart,
  wind: Wind,
  sparkles: Sparkles,
  eye: Eye,
};

interface AttributeBarProps {
  attribute: AttributeKey;
  value: number;
  max?: number;
  canAllocate?: boolean;
  onAllocate?: (attribute: AttributeKey) => void;
}

export function AttributeBar({
  attribute,
  value,
  max = 100,
  canAllocate = false,
  onAllocate,
}: AttributeBarProps) {
  const meta = ATTRIBUTE_META[attribute];
  const Icon = iconMap[meta.icon] ?? Swords;
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className="flex items-center gap-3 group">
      <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-neutral-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-neutral-400">{meta.short}</span>
          <span className="text-xs font-mono text-neutral-300">{value}</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      {canAllocate && (
        <button
          onClick={() => onAllocate?.(attribute)}
          className="w-7 h-7 rounded-lg bg-primary-600/20 hover:bg-primary-600/40 border border-primary-500/30 flex items-center justify-center text-primary-300 hover:text-primary-200 transition-all duration-200 flex-shrink-0"
          title={`Spend 1 point on ${meta.label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
