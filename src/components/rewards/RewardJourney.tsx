import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Award,
  ChevronRight,
  Coins,
  Compass,
  Eye,
  Gift,
  Heart,
  Shield,
  SkipForward,
  Sparkles,
  Sword,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { supabase } from '@/lib/supabase';
import type { CharacterClass, ChestOpenResult, CompleteQuestResult, Profile, Quest } from '@/types/database';
import { CHARACTER_CLASS_META } from '@/types/database';

interface RewardJourneyProps {
  quest: Quest;
  reward: CompleteQuestResult;
  profileBefore: Profile | null;
  onDone: () => void;
}

type JourneyStage = 'run' | 'xp' | 'coins' | 'attribute' | 'chest' | 'reveal';

const classIcons: Record<CharacterClass, ComponentType<{ className?: string }>> = {
  warrior: Sword,
  mage: WandSparkles,
  rogue: Eye,
  ranger: Compass,
  cleric: Heart,
};

const stageOrder: JourneyStage[] = ['run', 'xp', 'coins', 'attribute', 'chest', 'reveal'];

function RewardStat({ icon: Icon, label, value, tone }: { icon: ComponentType<{ className?: string }>; label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-2xl border bg-neutral-950/45 p-4 ${tone}`}>
      <Icon className="h-5 w-5" />
      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-white">{value}</p>
    </div>
  );
}

export function RewardJourney({ quest, reward, profileBefore, onDone }: RewardJourneyProps) {
  const [stage, setStage] = useState<JourneyStage>('run');
  const [opening, setOpening] = useState(false);
  const [openedChest, setOpenedChest] = useState<ChestOpenResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const classMeta = CHARACTER_CLASS_META[profileBefore?.character_class ?? 'warrior'];
  const CharacterIcon = classIcons[profileBefore?.character_class ?? 'warrior'];
  const currentIndex = stageOrder.indexOf(stage);
  const xpAfter = reward.xp_after ?? profileBefore?.xp ?? 0;
  const xpToNext = reward.xp_to_next_level_after ?? profileBefore?.xp_to_next_level ?? 100;
  const xpBefore = profileBefore?.xp ?? Math.max(0, xpAfter - reward.xp_gained);
  const xpPercent = Math.min(100, Math.round((xpAfter / Math.max(1, xpToNext)) * 100));
  const runnerPosition = stage === 'run' ? 10 : stage === 'xp' ? 32 : stage === 'coins' ? 52 : stage === 'attribute' ? 70 : 90;

  useEffect(() => {
    if (stage === 'chest' || stage === 'reveal') return;
    const timer = window.setTimeout(() => {
      const next = stageOrder[currentIndex + 1];
      if (next) setStage(next);
    }, stage === 'run' ? 1000 : 1200);
    return () => window.clearTimeout(timer);
  }, [currentIndex, stage]);

  const claimChest = async () => {
    if (!reward.chest_id || opening) return;
    setOpening(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('open_reward_chest', { p_chest_id: reward.chest_id });
    const result = data as ChestOpenResult | null;
    if (rpcError || result?.error) {
      setError(rpcError?.message ?? result?.error ?? 'The chest could not be opened. No progress was lost.');
      setOpening(false);
      return;
    }
    setOpenedChest(result);
    setStage('reveal');
    setOpening(false);
  };

  const skipAnimation = () => {
    if (reward.chest_id) setStage('chest');
    else onDone();
  };

  const revealedFragment = openedChest?.fragment ?? reward.fragment;
  const word = openedChest?.word ?? reward.word ?? 'FORGE';
  const fragmentsUnlocked = openedChest?.fragments_unlocked ?? reward.fragments_unlocked ?? 0;
  const finalReward = openedChest?.final_reward;
  const title = stage === 'reveal'
    ? finalReward ? 'Legendary gift unlocked' : openedChest?.word_complete ? 'Relic complete' : 'Fragment recovered'
    : stage === 'chest' ? 'A reward is waiting' : stage === 'run' ? 'Your victory is moving forward' : stage === 'xp' ? 'Experience collected' : stage === 'coins' ? 'Gold collected' : 'Power increased';

  const stageCaption = useMemo(() => {
    if (stage === 'run') return 'The work is done. Your character is carrying the momentum forward.';
    if (stage === 'xp') return `+${reward.xp_gained} XP is flowing into your progression.`;
    if (stage === 'coins') return `+${reward.coins_gained} gold added to your forge.`;
    if (stage === 'attribute') return `${reward.attribute_gained ?? 1} ${reward.attribute ?? 'attribute'} point earned.`;
    if (stage === 'chest') return 'Open the chest to reveal the next piece of your relic.';
    return finalReward ? 'Five real-world victories forged a permanent mark.' : `Fragment ${fragmentsUnlocked} of ${word.length} is now yours.`;
  }, [finalReward, fragmentsUnlocked, reward, stage, word.length]);

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#050914]/95 p-3 backdrop-blur-xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="reward-journey-title">
      <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center">
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-primary-400/20 bg-gradient-to-br from-[#0b1525] via-[#07101e] to-[#120d25] shadow-2xl shadow-black/60">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_18%_30%,rgba(34,211,238,.16),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(168,85,247,.16),transparent_26%)]" />
          <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-300">Reward journey</p>
              <p className="mt-1 max-w-[15rem] truncate font-display text-sm font-semibold text-white sm:max-w-none">{quest.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {stage !== 'reveal' && <button onClick={skipAnimation} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-neutral-500 transition hover:bg-white/5 hover:text-neutral-200"><SkipForward className="h-3.5 w-3.5" /> Skip</button>}
              {stage === 'reveal' && <button onClick={onDone} aria-label="Close reward journey" className="rounded-lg p-2 text-neutral-500 transition hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>}
            </div>
          </div>

          <div className="relative grid gap-0 lg:grid-cols-[1.35fr_.65fr]">
            <div className="p-5 sm:p-8">
              <div className="relative h-56 overflow-hidden rounded-3xl border border-primary-300/10 bg-[#071321] sm:h-72">
                <div className="absolute inset-x-8 bottom-16 h-px bg-gradient-to-r from-primary-400/10 via-primary-300/70 to-secondary-300/20" />
                <div className="absolute inset-x-8 bottom-[3.65rem] flex justify-between text-[10px] uppercase tracking-[0.2em] text-neutral-700"><span>Start</span><span>Forge gate</span></div>
                {[0, 1, 2, 3, 4].map((dot) => <div key={dot} className="absolute bottom-[3.85rem] h-2 w-2 rounded-full bg-primary-300/60 shadow-[0_0_14px_rgba(34,211,238,.8)]" style={{ left: `${16 + dot * 17}%` }} />)}
                <div className={`absolute bottom-[4.65rem] -translate-x-1/2 transition-all duration-1000 ${stage === 'run' ? 'animate-lifeforge-run' : ''}`} style={{ left: `${runnerPosition}%` }}>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary-300/35 bg-primary-400/10 shadow-[0_0_28px_rgba(34,211,238,.2)]">
                    <div className="absolute -inset-2 rounded-3xl border border-primary-300/10 animate-pulse" />
                    <CharacterIcon className="h-8 w-8 text-primary-200" />
                  </div>
                  <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-primary-300/30 blur-[2px]" />
                </div>
                <div className={`absolute bottom-[7.5rem] left-[31%] transition-all duration-700 ${stage === 'xp' ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="animate-lifeforge-orb rounded-full border border-secondary-200/80 bg-secondary-300 p-2 shadow-[0_0_30px_rgba(252,211,77,.9)]"><Zap className="h-4 w-4 text-secondary-950" /></div>
                  <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-secondary-200">+{reward.xp_gained} XP</span>
                </div>
                <div className={`absolute bottom-[8rem] left-[52%] transition-all duration-700 ${stage === 'coins' ? 'scale-110 opacity-100' : 'opacity-20'}`}>
                  <Coins className="h-8 w-8 text-secondary-300 drop-shadow-[0_0_14px_rgba(252,211,77,.8)]" />
                  <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-secondary-200">+{reward.coins_gained}</span>
                </div>
                <div className={`absolute bottom-[7.5rem] left-[70%] transition-all duration-700 ${stage === 'attribute' ? 'opacity-100' : 'opacity-20'}`}>
                  <Sparkles className="h-8 w-8 text-primary-300 drop-shadow-[0_0_14px_rgba(34,211,238,.8)]" />
                  <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-primary-200">+{reward.attribute_gained ?? 1} {reward.attribute ?? 'power'}</span>
                </div>
                <div className={`absolute bottom-[6.6rem] right-[7%] transition-all duration-700 ${stage === 'chest' || stage === 'reveal' ? 'scale-110 opacity-100' : 'opacity-35'}`}>
                  <Gift className={`h-12 w-12 text-secondary-300 drop-shadow-[0_0_20px_rgba(252,211,77,.8)] ${stage === 'chest' ? 'animate-lifeforge-chest' : ''}`} />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#071321] to-transparent" />
              </div>

              <div className="mt-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-secondary-300">Chapter {currentIndex + 1} / {stageOrder.length}</p>
                  <h2 id="reward-journey-title" className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">{title}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400">{stageCaption}</p>
                </div>
                {stage !== 'reveal' && <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-primary-300/20 bg-primary-300/10 sm:flex"><Sparkles className="h-5 w-5 text-primary-200" /></div>}
              </div>

              {stage === 'xp' && (
                <div className="mt-6 rounded-2xl border border-secondary-300/15 bg-secondary-300/5 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs"><span className="text-neutral-500">Level {reward.level_before ?? profileBefore?.level ?? 1}</span><span className="text-secondary-200">{xpAfter} / {xpToNext} XP</span></div>
                  <ProgressBar value={xpPercent} max={100} color="secondary" size="lg" />
                  <p className="mt-2 text-xs text-neutral-500">{xpBefore} XP before · {reward.xp_gained} gained</p>
                </div>
              )}
              {stage === 'reveal' && (
                <div className="mt-6 rounded-2xl border border-secondary-300/20 bg-gradient-to-br from-secondary-300/10 to-primary-300/5 p-5">
                  {finalReward ? (
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-secondary-300/40 bg-secondary-300/15"><Award className="h-7 w-7 text-secondary-200" /></div>
                      <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary-300">Legendary gift unlocked</p><p className="mt-1 font-display text-xl font-bold text-white">{finalReward.name}</p><p className="mt-1 text-sm text-neutral-400">{finalReward.description}</p><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-secondary-200">{finalReward.rarity} · added to inventory</p></div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-secondary-300/40 bg-secondary-300/15 font-display text-3xl font-bold text-secondary-200">{revealedFragment ?? '✦'}</div>
                      <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary-300">{openedChest?.word_complete ? 'Collection complete' : 'New relic fragment'}</p><p className="mt-1 font-display text-xl font-bold tracking-[0.3em] text-white">{word.split('').map((letter, index) => index < fragmentsUnlocked ? letter : '·').join(' ')}</p><p className="mt-1 text-sm text-neutral-400">{openedChest?.word_complete ? 'You forged your first complete relic.' : `${fragmentsUnlocked} of ${word.length} fragments recovered.`}</p></div>
                    </div>
                  )}
                </div>
              )}

              {error && <p role="alert" className="mt-4 rounded-xl border border-error-500/25 bg-error-500/10 px-4 py-3 text-sm text-error-300">{error}</p>}

              <div className="mt-6 flex justify-end">
                {stage === 'chest' ? (
                  <Button onClick={() => void claimChest()} loading={opening}><Gift className="h-4 w-4" /> Open Chest</Button>
                ) : stage === 'reveal' ? (
                  <Button onClick={onDone}><ChevronRight className="h-4 w-4" /> Continue Journey</Button>
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs text-neutral-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-300" /> Processing reward</span>
                )}
              </div>
            </div>

            <aside className="border-t border-white/10 bg-black/10 p-5 sm:p-8 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-300/20 bg-primary-300/10"><Shield className="h-5 w-5 text-primary-200" /></div>
                <div><p className="text-xs uppercase tracking-wider text-neutral-500">Your {classMeta.label}</p><p className="font-display font-semibold text-white">Progression secured</p></div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-1">
                <RewardStat icon={Zap} label="Experience" value={`+${reward.xp_gained} XP`} tone="border-secondary-300/15 text-secondary-200" />
                <RewardStat icon={Coins} label="Gold" value={`+${reward.coins_gained}`} tone="border-secondary-300/15 text-secondary-200" />
                <RewardStat icon={Sparkles} label="Attribute" value={`+${reward.attribute_gained ?? 1}`} tone="border-primary-300/15 text-primary-200" />
              </div>
              {reward.leveled_up && (
                <div className="mt-4 rounded-2xl border border-secondary-300/30 bg-secondary-300/10 p-4 text-center">
                  <Sparkles className="mx-auto h-5 w-5 text-secondary-200" />
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-secondary-300">Level up</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">{reward.level_before} → {reward.new_level}</p>
                </div>
              )}
              <p className="mt-5 text-xs leading-relaxed text-neutral-600">Real life is the gameplay. Every reward in this journey came from a server-confirmed completion.</p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}