import { useEffect, useState } from 'react';
import { Coins, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import type { Quest, RewardPreview } from '@/types/database';
import { ATTRIBUTE_META } from '@/types/database';

interface QuestCompletionModalProps {
  quest: Quest;
  onCancel: () => void;
  onClaim: () => void;
  loading: boolean;
}

export function QuestCompletionModal({ quest, onCancel, onClaim, loading }: QuestCompletionModalProps) {
  const [preview, setPreview] = useState<RewardPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setPreviewLoading(true);
    supabase.rpc('preview_quest_reward', { p_quest_id: quest.id }).then(({ data, error }) => {
      if (cancelled) return;
      if (!error && data && !(data as RewardPreview).error) setPreview(data as RewardPreview);
      setPreviewLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [quest.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onCancel]);

  const attributeLabel = preview?.attribute ? ATTRIBUTE_META[preview.attribute].label : 'your primary attribute';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-md animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="claim-quest-title">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-primary-400/25 bg-gradient-to-br from-neutral-900 via-neutral-950 to-primary-950/30 shadow-2xl shadow-black/50 animate-scale-in">
        <div className="h-1 bg-gradient-to-r from-primary-400 via-secondary-300 to-primary-500" />
        <button onClick={onCancel} disabled={loading} aria-label="Close completion confirmation" className="absolute right-4 top-4 rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-800 hover:text-white disabled:opacity-40">
          <X className="h-4 w-4" />
        </button>
        <div className="p-6 sm:p-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-400/25 bg-primary-400/10">
            <ShieldCheck className="h-7 w-7 text-primary-300" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-300">Quest verification</p>
          <h2 id="claim-quest-title" className="mt-2 font-display text-2xl font-bold text-white">Did you complete this quest?</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            Confirm the real-world work before LifeForge claims your reward. The final values are validated by the server.
          </p>
          <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
            <p className="font-display text-lg font-semibold text-white">{quest.title}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">{quest.difficulty} · {quest.category || 'general'} quest</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-secondary-400/15 bg-secondary-400/5 p-3">
              <Zap className="h-4 w-4 text-secondary-300" />
              <p className="mt-3 text-[11px] uppercase tracking-wider text-neutral-500">XP</p>
              <p className="mt-1 font-display text-lg font-bold text-secondary-200">{previewLoading ? '—' : `+${preview?.xp_gained ?? '?'}`}</p>
            </div>
            <div className="rounded-xl border border-secondary-400/15 bg-secondary-400/5 p-3">
              <Coins className="h-4 w-4 text-secondary-300" />
              <p className="mt-3 text-[11px] uppercase tracking-wider text-neutral-500">Gold</p>
              <p className="mt-1 font-display text-lg font-bold text-secondary-200">{previewLoading ? '—' : `+${preview?.coins_gained ?? '?'}`}</p>
            </div>
            <div className="rounded-xl border border-primary-400/15 bg-primary-400/5 p-3">
              <Sparkles className="h-4 w-4 text-primary-300" />
              <p className="mt-3 text-[11px] uppercase tracking-wider text-neutral-500">Attribute</p>
              <p className="mt-1 truncate font-display text-sm font-bold text-primary-200">{preview ? `+${preview.attribute_gained} ${attributeLabel}` : 'Server-set'}</p>
            </div>
          </div>
          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onCancel} disabled={loading}>Not Yet</Button>
            <Button onClick={onClaim} loading={loading} disabled={previewLoading}>
              <Sparkles className="h-4 w-4" /> Claim Reward
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}