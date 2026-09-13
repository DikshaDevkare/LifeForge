import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Award, Coins, Flame, Sparkles, Star, Trophy, X, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AttributeKey } from '@/types/database';

export interface RewardFeedbackPayload {
  eventKey: string;
  xpGained: number;
  coinsGained: number;
  attribute?: AttributeKey;
  attributePreviousValue?: number;
  attributeValue?: number;
  streakBefore?: number;
  streakAfter?: number;
  levelBefore?: number;
  levelAfter?: number;
  achievements?: { name: string; description: string }[];
}

interface FeedbackEvent extends RewardFeedbackPayload {
  id: string;
  createdAt: number;
}

interface FeedbackContextValue {
  pushRewardFeedback: (payload: RewardFeedbackPayload) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

const attributeLabels: Record<AttributeKey, string> = {
  strength: 'Strength',
  intelligence: 'Intelligence',
  vitality: 'Vitality',
  dexterity: 'Dexterity',
  charisma: 'Charisma',
  wisdom: 'Wisdom',
};

function RewardToast({ event, onDismiss }: { event: FeedbackEvent; onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-secondary-500/30 bg-neutral-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 p-4 animate-slide-in-right"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary-500/15 flex items-center justify-center flex-shrink-0">
          <Trophy className="w-5 h-5 text-secondary-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display font-semibold text-white">Quest complete</p>
            <button onClick={onDismiss} aria-label="Dismiss reward" className="text-neutral-600 hover:text-neutral-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge color="secondary" icon={<Zap className="w-3 h-3" />}>+{event.xpGained} XP</Badge>
            <Badge color="warning" icon={<Coins className="w-3 h-3" />}>+{event.coinsGained} coins</Badge>
            {event.attribute && event.attributeValue !== undefined && (
              <Badge color="primary" icon={<Sparkles className="w-3 h-3" />}>
                {event.attributePreviousValue !== undefined
                  ? `${event.attributePreviousValue} → ${event.attributeValue}`
                  : `+${event.attributeValue}`} {attributeLabels[event.attribute]}
              </Badge>
            )}
            {event.streakAfter !== undefined && event.streakAfter > (event.streakBefore ?? 0) && (
              <Badge color="warning" icon={<Flame className="w-3 h-3" />}>{event.streakAfter} day streak</Badge>
            )}
          </div>
          {event.achievements && event.achievements.length > 0 && (
            <p className="text-xs text-secondary-300 mt-3">Achievement unlocked: {event.achievements[0].name}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LevelUpOverlay({ event, onDismiss }: { event: FeedbackEvent; onDismiss: () => void }) {
  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  if (event.levelAfter === undefined || event.levelBefore === undefined || event.levelAfter <= event.levelBefore) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="level-up-title">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-primary-400/30 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 text-center shadow-2xl shadow-primary-900/30 animate-scale-in">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-400 to-primary-500" />
        <div className="mx-auto w-20 h-20 rounded-3xl bg-primary-500/15 border border-primary-400/30 flex items-center justify-center">
          <Star className="w-10 h-10 text-secondary-300 animate-pulse" />
        </div>
        <p className="mt-5 text-xs uppercase tracking-[0.25em] text-secondary-300 font-semibold">Progression milestone</p>
        <h2 id="level-up-title" className="font-display text-4xl font-bold text-white mt-2">Level Up</h2>
        <p className="text-lg text-neutral-300 mt-3">
          Level <span className="text-neutral-500">{event.levelBefore}</span>
          <span className="text-primary-300 mx-2">→</span>
          <span className="text-primary-300 font-semibold">{event.levelAfter}</span>
        </p>
        <div className="grid grid-cols-2 gap-3 mt-6 text-left">
          <div className="rounded-xl bg-neutral-800/60 p-3"><Zap className="w-4 h-4 text-secondary-300" /><p className="text-xs text-neutral-500 mt-2">XP earned</p><p className="text-sm font-semibold text-white">+{event.xpGained}</p></div>
          <div className="rounded-xl bg-neutral-800/60 p-3"><Award className="w-4 h-4 text-primary-300" /><p className="text-xs text-neutral-500 mt-2">Attribute points</p><p className="text-sm font-semibold text-white">+3 available</p></div>
        </div>
        <Button className="mt-6" fullWidth onClick={onDismiss}>Continue the forge</Button>
      </div>
    </div>
  );
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<FeedbackEvent[]>([]);
  const seenEvents = useRef(new Set<string>());

  const dismiss = useCallback((id: string) => {
    setEvents((current) => current.filter((event) => event.id !== id));
  }, []);

  const pushRewardFeedback = useCallback((payload: RewardFeedbackPayload) => {
    if (seenEvents.current.has(payload.eventKey)) return;
    seenEvents.current.add(payload.eventKey);
    const event: FeedbackEvent = {
      ...payload,
      id: `${payload.eventKey}-${Date.now()}`,
      createdAt: Date.now(),
    };
    setEvents((current) => [...current.slice(-2), event]);
  }, []);

  useEffect(() => {
    const timers = events.map((event) => window.setTimeout(() => dismiss(event.id), 8000));
    return () => timers.forEach(window.clearTimeout);
  }, [events, dismiss]);

  const levelUpEvent = events.find((event) => (event.levelAfter ?? 0) > (event.levelBefore ?? 0));

  return (
    <FeedbackContext.Provider value={{ pushRewardFeedback }}>
      {children}
      <div className="fixed top-20 right-4 z-[60] space-y-3 pointer-events-none">
        {events.map((event) => (
          <div key={event.id} className="pointer-events-auto">
            <RewardToast event={event} onDismiss={() => dismiss(event.id)} />
          </div>
        ))}
      </div>
      {levelUpEvent && <LevelUpOverlay event={levelUpEvent} onDismiss={() => dismiss(levelUpEvent.id)} />}
    </FeedbackContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRewardFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useRewardFeedback must be used within FeedbackProvider');
  return context;
}