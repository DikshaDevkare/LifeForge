import { LockKeyhole, Sparkles } from 'lucide-react';
import type { RelicProgress } from '@/types/database';

interface WordCollectionProps {
  progress: RelicProgress | null;
  compact?: boolean;
}

export function WordCollection({ progress, compact = false }: WordCollectionProps) {
  const word = progress?.relic?.word ?? 'FORGE';
  const unlocked = progress?.fragments_unlocked ?? 0;
  const complete = unlocked >= word.length;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-primary-500/20 bg-gradient-to-br from-primary-500/10 via-neutral-900/70 to-secondary-500/5 ${compact ? 'p-4' : 'p-5'}`}>
      <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-300">
              {progress?.relic?.name ?? 'Daily Relic'}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {complete ? 'Relic complete. Your path is marked.' : 'Complete quests to reveal the relic.'}
            </p>
          </div>
          {complete ? <Sparkles className="h-5 w-5 text-secondary-300" /> : <LockKeyhole className="h-4 w-4 text-neutral-600" />}
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 sm:gap-3">
          {word.split('').map((letter, index) => {
            const isUnlocked = index < unlocked;
            return (
              <div key={`${letter}-${index}`} className="text-center">
                <div className={`flex h-10 w-9 items-center justify-center rounded-xl border font-display text-lg font-bold transition-all sm:h-12 sm:w-11 ${
                  isUnlocked
                    ? 'border-secondary-400/50 bg-secondary-400/15 text-secondary-200 shadow-lg shadow-secondary-500/10'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-700'
                }`}>
                  {isUnlocked ? letter : '·'}
                </div>
                <div className={`mx-auto mt-2 h-1 w-1 rounded-full ${isUnlocked ? 'bg-secondary-300' : 'bg-neutral-700'}`} />
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-neutral-500">{Math.min(unlocked, word.length)} / {word.length} fragments</span>
          <span className={complete ? 'text-secondary-300' : 'text-primary-300'}>
            {complete ? 'Complete' : `${word.length - unlocked} to go`}
          </span>
        </div>
      </div>
    </div>
  );
}