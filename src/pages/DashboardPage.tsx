import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { CharacterSheet } from '@/components/character/CharacterSheet';
import { WordCollection } from '@/components/rewards/WordCollection';
import { CHARACTER_CLASS_META, type ChestOpenResult, type Quest, type RelicProgress, type RewardChest } from '@/types/database';
import { 
  Flame, Star, Target, TrendingUp, Zap, Coins, Award, CheckCircle, Gift, Sparkles,
  Volume2, VolumeX, Lock, Check, X, Plane, Trophy, LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// 🔊 Instant Audio Engine
let globalAudioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) globalAudioCtx = new AudioCtx();
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
};

const playArcadeSound = (type: 'airplane' | 'coin' | 'level' | 'click' | 'streak' | 'quest') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'coin') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'streak' || type === 'quest') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'airplane') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
      osc.frequency.exponentialRampToValueAtTime(250, now + 1.0);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.0);
    } else if (type === 'level') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    }
  } catch {
    // Audio Context fallback
  }
};

// 🌟 3D Lighting & Particle Emitter Overlay for Modals
function Light3DEffectCanvas({ glowColor }: { glowColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = 450);
    let height = (canvas.height = 450);

    const lightRays = Array.from({ length: 18 }, (_, i) => ({
      angle: (i * Math.PI) / 9,
      speed: 0.005 + Math.random() * 0.005,
      length: 180 + Math.random() * 80,
    }));

    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3 + 1,
      vy: -(Math.random() * 1.2 + 0.3),
      alpha: Math.random(),
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Center 3D Radial Glow Source
      const radialGradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 200);
      radialGradient.addColorStop(0, glowColor);
      radialGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
      radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      // Rotating 3D Light Rays
      lightRays.forEach((ray) => {
        ray.angle += ray.speed;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, ray.length, ray.angle, ray.angle + 0.15);
        ctx.fillStyle = glowColor.replace(/[\d.]+\)$/g, '0.08)');
        ctx.fill();
      });

      // Floating Light Sparks
      particles.forEach((p) => {
        p.y += p.vy;
        if (p.y < 0) p.y = height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = glowColor.replace(/[\d.]+\)$/g, `${p.alpha})`);
        ctx.shadowBlur = 10;
        ctx.shadowColor = glowColor;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [glowColor]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl z-0" />;
}

export function DashboardPage() {
  const { user, profile } = useAuth();
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [recentLogs, setRecentLogs] = useState<{ id: string; quest_title: string; xp_earned: number; completed_at: string }[]>([]);
  const [relicProgress, setRelicProgress] = useState<RelicProgress | null>(null);
  const [pendingChest, setPendingChest] = useState<RewardChest | null>(null);
  const [openingChest, setOpeningChest] = useState(false);
  const [chestMessage, setChestMessage] = useState<string | null>(null);

  const [soundMuted, setSoundMuted] = useState(false);
  const [activeModal, setActiveModal] = useState<'level' | 'xp' | 'coins' | 'streak' | 'quests' | null>(null);
  const [counterValue, setCounterValue] = useState<number>(0);
  const [isAirplaneFlying, setIsAirplaneFlying] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'started', 'focused'])
        .order('updated_at', { ascending: false })
        .limit(3),
      supabase
        .from('quest_logs')
        .select('id, quest_title, xp_earned, completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(3),
      supabase
        .from('user_relic_progress')
        .select('*, relic:relic_definitions(word, name, description)')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('reward_chests')
        .select('*')
        .eq('user_id', user.id)
        .is('opened_at', null)
        .order('created_at', { ascending: false })
        .limit(1),
    ]).then(([questsResult, logsResult, relicResult, chestResult]) => {
      if (!questsResult.error) setActiveQuests((questsResult.data ?? []) as Quest[]);
      if (!logsResult.error) setRecentLogs((logsResult.data ?? []) as typeof recentLogs);
      if (!relicResult.error) setRelicProgress((relicResult.data ?? null) as RelicProgress | null);
      if (!chestResult.error) setPendingChest(((chestResult.data ?? [])[0] ?? null) as RewardChest | null);
    });
  }, [user]);

  const triggerClickSFX = useCallback(() => {
    if (!soundMuted) playArcadeSound('click');
  }, [soundMuted]);

  const openModal = useCallback((type: 'level' | 'xp' | 'coins' | 'streak' | 'quests') => {
    triggerClickSFX();
    setActiveModal(type);
    setCounterValue(0);

    if (!profile) return;

    if (type === 'level') {
      if (!soundMuted) playArcadeSound('level');
    } else if (type === 'xp') {
      if (!soundMuted) playArcadeSound('airplane');
      setIsAirplaneFlying(true);
      setTimeout(() => setIsAirplaneFlying(false), 1200);

      let current = 0;
      const target = profile.total_xp || 100;
      const step = Math.max(1, Math.floor(target / 30));
      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          setCounterValue(target);
          clearInterval(interval);
        } else {
          setCounterValue(current);
          if (!soundMuted) playArcadeSound('quest');
        }
      }, 30);
    } else if (type === 'coins') {
      let current = 0;
      const target = profile.coins || 100;
      const step = Math.max(1, Math.floor(target / 25));
      const interval = setInterval(() => {
        current += step;
        if (!soundMuted) playArcadeSound('coin');
        if (current >= target) {
          setCounterValue(target);
          clearInterval(interval);
        } else {
          setCounterValue(current);
        }
      }, 45);
    } else if (type === 'streak' || type === 'quests') {
      let current = 0;
      const target = type === 'streak' ? profile.streak_days : profile.quests_completed;
      const step = 1;
      const interval = setInterval(() => {
        current += step;
        if (!soundMuted) playArcadeSound(type === 'streak' ? 'streak' : 'quest');
        if (current >= target) {
          setCounterValue(target);
          clearInterval(interval);
        } else {
          setCounterValue(current);
        }
      }, 80);
    }
  }, [profile, soundMuted, triggerClickSFX]);

  if (!profile) return null;

  const classMeta = CHARACTER_CLASS_META[profile.character_class];

  const openPendingChest = async () => {
    triggerClickSFX();
    if (!pendingChest || openingChest) return;
    if (!soundMuted) playArcadeSound('level');
    setOpeningChest(true);
    setChestMessage(null);
    const { data, error } = await supabase.rpc('open_reward_chest', { p_chest_id: pendingChest.id });
    const result = data as ChestOpenResult | null;
    if (error || !result || result.error) {
      setChestMessage(error?.message ?? result?.error ?? 'The chest could not be opened.');
    } else {
      setPendingChest(null);
      setRelicProgress((current) => current ? {
        ...current,
        fragments_unlocked: result.fragments_unlocked,
        final_reward_claimed: result.final_reward_claimed,
      } : current);
      setChestMessage(result.final_reward ? `${result.final_reward.name} was added to your inventory.` : `Fragment ${result.fragment ?? 'recovered'} added to your relic.`);
    }
    setOpeningChest(false);
  };

  return (
    <div className="space-y-6" onClick={() => triggerClickSFX()}>

      {/* ================================================================= */}
      {/* 🕹️ Header Banner — matches the Mystic Bazaar / Hero Control Panel */}
      {/* neon-bordered gradient banner used across the Shop & Settings pages */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950/80 via-neutral-950 to-neutral-950 border-2 border-purple-500/60 rounded-3xl p-5 shadow-[0_0_35px_rgba(168,85,247,0.25)]">
        {/* faint starfield dots, same texture as the Bazaar / Settings screens */}
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(1px_1px_at_20px_30px,rgba(255,255,255,0.5)_1px,transparent_0),radial-gradient(1px_1px_at_120px_80px,rgba(255,255,255,0.4)_1px,transparent_0),radial-gradient(1px_1px_at_220px_20px,rgba(255,255,255,0.5)_1px,transparent_0)] [background-size:250px_120px]" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 border-2 border-purple-300/60 shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
                <span className="bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full border border-black uppercase tracking-widest shadow">
                  Live
                </span>
              </div>
              <p className="text-xs text-neutral-400">Your adventure at a glance</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Coin / XP style pills, matching the top-right pills on the Bazaar screen */}
            <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-amber-400/50 rounded-xl px-3 py-1.5 shadow-inner">
              <Coins className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-black text-amber-200">{profile.coins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-cyan-400/50 rounded-xl px-3 py-1.5 shadow-inner">
              <Zap className="w-4 h-4 text-cyan-300" />
              <span className="text-xs font-black text-cyan-200">{profile.total_xp.toLocaleString()}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerClickSFX();
                setSoundMuted(!soundMuted);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-yellow-400 text-black font-black text-xs shadow-[0_4px_0_#b28900] active:translate-y-1 transition-all"
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{soundMuted ? 'SFX OFF' : 'SFX ON'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🕹️ 5 Stat Boxes with Glow Light Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Level Box */}
        <button 
          onClick={(e) => { e.stopPropagation(); openModal('level'); }} 
          className="relative bg-gradient-to-b from-purple-600/90 to-indigo-900 border-2 border-purple-400/80 p-4 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:brightness-125 active:translate-y-1 transition-all flex flex-col items-center justify-center text-center overflow-hidden group"
        >
          <div className="absolute top-1.5 right-1.5 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black shadow">
            TAP
          </div>
          <Award className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)] mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase text-purple-200 tracking-wider">LEVEL</span>
          <span className="text-2xl font-black text-white drop-shadow-[0_2px_4px_#000]">{profile.level}</span>
        </button>

        {/* Total XP Box */}
        <button 
          onClick={(e) => { e.stopPropagation(); openModal('xp'); }} 
          className="relative bg-gradient-to-b from-cyan-500/90 to-blue-800 border-2 border-cyan-300/80 p-4 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:brightness-125 active:translate-y-1 transition-all flex flex-col items-center justify-center text-center overflow-hidden group"
        >
          <div className="absolute top-1.5 right-1.5 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black shadow">
            TAP
          </div>
          <Zap className="w-8 h-8 text-cyan-200 drop-shadow-[0_0_10px_rgba(103,232,249,0.8)] mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase text-cyan-100 tracking-wider">TOTAL XP</span>
          <span className="text-xl font-black text-white drop-shadow-[0_2px_4px_#000]">{profile.total_xp.toLocaleString()}</span>
        </button>

        {/* Coins Box */}
        <button 
          onClick={(e) => { e.stopPropagation(); openModal('coins'); }} 
          className="relative bg-gradient-to-b from-amber-400/90 to-yellow-700 border-2 border-amber-300/80 p-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:brightness-125 active:translate-y-1 transition-all flex flex-col items-center justify-center text-center overflow-hidden group"
        >
          <div className="absolute top-1.5 right-1.5 bg-white text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black shadow">
            TAP
          </div>
          <Coins className="w-8 h-8 text-yellow-100 drop-shadow-[0_0_10px_rgba(254,240,138,0.8)] mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase text-amber-100 tracking-wider">COINS</span>
          <span className="text-xl font-black text-white drop-shadow-[0_2px_4px_#000]">{profile.coins.toLocaleString()}</span>
        </button>

        {/* Day Streak Box */}
        <button 
          onClick={(e) => { e.stopPropagation(); openModal('streak'); }} 
          className="relative bg-gradient-to-b from-orange-500/90 to-red-800 border-2 border-orange-400/80 p-4 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] hover:brightness-125 active:translate-y-1 transition-all flex flex-col items-center justify-center text-center overflow-hidden group"
        >
          <div className="absolute top-1.5 right-1.5 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black shadow">
            TAP
          </div>
          <Flame className="w-8 h-8 text-orange-200 drop-shadow-[0_0_10px_rgba(253,186,116,0.8)] mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase text-orange-100 tracking-wider">STREAK</span>
          <span className="text-2xl font-black text-white drop-shadow-[0_2px_4px_#000]">{profile.streak_days}D</span>
        </button>

        {/* Quests Completed Box */}
        <button 
          onClick={(e) => { e.stopPropagation(); openModal('quests'); }} 
          className="relative bg-gradient-to-b from-emerald-500/90 to-teal-800 border-2 border-emerald-300/80 p-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:brightness-125 active:translate-y-1 transition-all flex flex-col items-center justify-center text-center overflow-hidden group"
        >
          <div className="absolute top-1.5 right-1.5 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black shadow">
            TAP
          </div>
          <Target className="w-8 h-8 text-emerald-200 drop-shadow-[0_0_10px_rgba(110,231,183,0.8)] mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase text-emerald-100 tracking-wider">QUESTS DONE</span>
          <span className="text-2xl font-black text-white drop-shadow-[0_2px_4px_#000]">{profile.quests_completed}</span>
        </button>

      </div>

      {/* Main Grid Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Character Sheet */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-neutral-900/90 border-2 border-yellow-400/50 rounded-2xl p-2.5 shadow-xl backdrop-blur-md">
            <div className="bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> SUBWAY RUNNER CHARACTER
            </div>
            <CharacterSheet />
          </div>
        </div>

        {/* Right Column: Progress, Focus, Logs & Relics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Experience Progress Card */}
          <Card className="bg-neutral-900/80 border-neutral-800 backdrop-blur-md">
            <CardHeader
              title="Experience Progress"
              subtitle={`Level ${profile.level} → Level ${profile.level + 1}`}
              icon={<TrendingUp className="w-5 h-5 text-secondary-400" />}
            />
            <ProgressBar
              value={profile.xp}
              max={profile.xp_to_next_level}
              color="secondary"
              size="lg"
              showValue
            />
            <p className="mt-3 text-xs font-medium text-neutral-400">
              {(profile.xp_to_next_level - profile.xp).toLocaleString()} XP until your next level
            </p>
          </Card>

          {/* Today's Focus & Recent Activity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <Card className="bg-neutral-900/80 border-neutral-800 backdrop-blur-md">
              <CardHeader title="Today's Focus" subtitle="Your active quests for today" icon={<Target className="w-5 h-5 text-primary-400" />} />
              <div className="space-y-2">
                {activeQuests.length === 0 ? (
                  <p className="text-sm text-neutral-500">No active quests yet. Head to the Quests page to create your first one.</p>
                ) : (
                  activeQuests.map((quest) => (
                    <div key={quest.id} className="flex items-center gap-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50 px-3 py-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${quest.status === 'focused' ? 'bg-secondary-400 animate-pulse' : 'bg-primary-400'}`} />
                      <p className="text-sm text-neutral-200 font-medium truncate">{quest.title}</p>
                      <span className="ml-auto text-xs text-neutral-400 font-mono">{quest.estimated_duration_minutes}m</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="bg-neutral-900/80 border-neutral-800 backdrop-blur-md">
              <CardHeader title="Recent Activity" subtitle="Your latest completions" icon={<Flame className="w-5 h-5 text-warning-400" />} />
              <div className="space-y-2">
                {recentLogs.length === 0 ? (
                  <p className="text-sm text-neutral-500">No activity yet. Start completing quests to see your history here.</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 rounded-xl bg-neutral-800/50 border border-neutral-700/50 px-3 py-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <p className="text-sm text-neutral-200 font-medium truncate">{log.quest_title}</p>
                      <span className="ml-auto text-xs text-secondary-400 font-bold">+{log.xp_earned} XP</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-1 backdrop-blur-md">
            <WordCollection progress={relicProgress} />
          </div>

          {pendingChest && (
            <Card className="border-secondary-400/40 bg-gradient-to-r from-emerald-950/80 via-teal-900/60 to-neutral-900/90 backdrop-blur-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-secondary-300/40 bg-secondary-400/20 shadow-[0_4px_0_#000]">
                    <Gift className="h-6 w-6 text-yellow-300 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 bg-black/60 px-2 py-0.5 rounded border border-yellow-400/30">
                      MYTHIC LOOT CHEST WAITING
                    </span>
                    <p className="mt-1 text-sm font-semibold text-neutral-200">A completed quest left something for your relic.</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => void openPendingChest()} loading={openingChest} className="bg-yellow-400 text-black font-black border-2 border-black shadow-[0_4px_0_#8c5000]">
                  <Gift className="h-4 w-4" /> Open Chest
                </Button>
              </div>
              {chestMessage && <p className="mt-3 flex items-center gap-2 text-xs font-bold text-yellow-300"><Sparkles className="h-3.5 w-3.5" />{chestMessage}</p>}
            </Card>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔮 Dynamic 3D Neon Glowing Light Popups for Top 5 Boxes */}
      {/* ========================================================================= */}

      {/* Level Modal with 3D Purple Aura */}
      {activeModal === 'level' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
          
          <div className="relative w-full max-w-md bg-neutral-950 border-4 border-purple-400 rounded-3xl p-6 shadow-[0_0_80px_rgba(168,85,247,0.7)] text-center overflow-hidden">
            
            {/* 3D Glowing Rays Emitter Background */}
            <Light3DEffectCanvas glowColor="rgba(168, 85, 247, 0.4)" />

            <div className="relative z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); triggerClickSFX(); setActiveModal(null); }}
                className="absolute top-0 right-0 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-2 rounded-xl border border-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-purple-600 to-yellow-400 border-4 border-black rounded-3xl flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(234,179,8,0.8)] animate-pulse">
                <Trophy className="w-10 h-10 text-black" />
              </div>

              <h3 className="text-2xl font-black text-purple-300 uppercase tracking-wide drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                LEVEL PROGRESS MAP
              </h3>
              <p className="text-xs text-purple-200/80 mb-5">Complete quests to level up your character</p>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const isUnlocked = lvl <= profile.level;
                  const isCurrent = lvl === profile.level;
                  return (
                    <div 
                      key={lvl}
                      className={`p-3 rounded-xl border-2 flex items-center justify-between font-bold text-sm backdrop-blur-md ${
                        isCurrent 
                          ? 'bg-yellow-400 text-black border-black shadow-[0_0_20px_rgba(250,204,21,0.8)]'
                          : isUnlocked 
                            ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isUnlocked ? <Check className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-neutral-600" />}
                        <span>LEVEL {lvl}</span>
                      </div>

                      {isCurrent ? (
                        <span className="text-[10px] bg-black text-yellow-400 px-2.5 py-1 rounded-full font-black uppercase">
                          ACTIVE
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-xs text-neutral-400">UNLOCKED</span>
                      ) : (
                        <span className="text-xs text-neutral-500">{lvl * 500} XP REQUIRED</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button 
                onClick={(e) => { e.stopPropagation(); triggerClickSFX(); setActiveModal(null); }}
                className="mt-5 w-full bg-yellow-400 text-black font-black border-2 border-black shadow-[0_0_20px_rgba(250,204,21,0.6)] hover:brightness-110"
              >
                CONTINUE GAME
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Total XP Modal with Cyan 3D Light Effect */}
      {activeModal === 'xp' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-neutral-950 border-4 border-cyan-400 rounded-3xl p-6 shadow-[0_0_80px_rgba(6,182,212,0.7)] text-center overflow-hidden">
            
            <Light3DEffectCanvas glowColor="rgba(6, 182, 212, 0.4)" />

            <div className="relative z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); triggerClickSFX(); setActiveModal(null); }}
                className="absolute top-0 right-0 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-2 rounded-xl border border-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className={`my-3 flex justify-center ${isAirplaneFlying ? 'animate-bounce scale-110' : ''}`}>
                <div className="w-20 h-20 rounded-3xl bg-cyan-400 border-4 border-black flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.8)]">
                  <Plane className="w-10 h-10 text-black -rotate-45" />
                </div>
              </div>

              <span className="bg-yellow-400 text-black font-black text-[10px] px-3 py-0.5 rounded-full border border-black uppercase tracking-widest shadow">
                ZUUUUUP XP BOOST!
              </span>

              <h3 className="text-xl font-black text-white mt-2 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">TOTAL XP COLLECTED</h3>

              <div className="my-5 py-4 bg-neutral-900/90 border-2 border-cyan-400/80 rounded-2xl shadow-inner backdrop-blur-md">
                <span className="text-4xl font-black text-cyan-300 font-mono tracking-wider drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]">
                  {counterValue.toLocaleString()}
                </span>
                <p className="text-xs font-semibold text-neutral-400 mt-1">/ {profile.xp_to_next_level} XP FOR NEXT LEVEL</p>
              </div>

              <Button 
                onClick={(e) => { e.stopPropagation(); triggerClickSFX(); setActiveModal(null); }}
                className="w-full bg-cyan-400 text-black font-black border-2 border-black shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:brightness-110"
              >
                CLAIM XP
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gold Coins Modal with Golden 3D Light Burst */}
      {activeModal === 'coins' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-neutral-950 border-4 border-amber-400 rounded-3xl p-6 shadow-[0_0_80px_rgba(245,158,11,0.8)] text-center overflow-hidden">
            
            <Light3DEffectCanvas glowColor="rgba(245, 158, 11, 0.45)" />

            <div className="relative z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); triggerClickSFX(); setActiveModal(null); }}
                className="absolute top-0 right-0 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-2 rounded-xl border border-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 mx-auto bg-amber-400 border-4 border-black rounded-full flex items-center justify-center mb-3 shadow-[0_0_35px_rgba(251,191,36,0.9)] animate-pulse">
                <Coins className="w-10 h-10 text-black" />
              </div>

              <h3 className="text-2xl font-black text-amber-300 uppercase drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">GOLD BANK</h3>

              <div className="my-5 py-4 bg-neutral-900/90 border-2 border-amber-400/80 rounded-2xl shadow-inner backdrop-blur-md">
                <span className="text-4xl font-black text-yellow-300 font-mono tracking-wider drop-shadow-[0_0_12px_rgba(253,224,71,0.9)]">
                  {counterValue.toLocaleString()}
                </span>
                <p className="text-xs font-semibold text-neutral-400 mt-1">AVAILABLE GOLD COINS</p>
              </div>

              <Button 
                onClick={(e) => { e.stopPropagation(); triggerClickSFX(); setActiveModal(null); }}
                className="w-full bg-amber-400 text-black font-black border-2 border-black shadow-[0_0_20px_rgba(245,158,11,0.6)] hover:brightness-110"
              >
                COLLECT COINS
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Day Streak Modal with Orange 3D Flame Light Effect */}
      {activeModal === 'streak' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-neutral-950 border-4 border-orange-500 rounded-3xl p-6 shadow-[0_0_80px_rgba(249,115,22,0.8)] text-center overflow-hidden">
            
            <Light3DEffectCanvas glowColor="rgba(249, 115, 22, 0.45)" />

            <div className="relative z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); triggerClickSFX(); setActiveModal(null); }}
                className="absolute top-0 right-0 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-2 rounded-xl border border-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 mx-auto bg-orange-500 border-4 border-black rounded-3xl flex items-center justify-center mb-3 shadow-[0_0_35px_rgba(249,115,22,0.9)] animate-bounce">
                <Flame className="w-10 h-10 text-black" />
              </div>

              <h3 className="text-2xl font-black text-orange-300 uppercase drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">DAY STREAK</h3>

              <div className="my-5 py-4 bg-neutral-900/90 border-2 border-orange-500/80 rounded-2xl shadow-inner backdrop-blur-md">
                <span className="text-4xl font-black text-orange-400 font-mono tracking-wider drop-shadow-[0_0_12px_rgba(249,115,22,0.9)]">
                  {counterValue} DAYS
                </span>
                <p className="text-xs font-semibold text-neutral-400 mt-1">CURRENT ACTIVE STREAK</p>
              </div>

              <Button 
                onClick={(e) => { e.stopPropagation(); triggerClickSFX(); setActiveModal(null); }}
                className="w-full bg-orange-500 text-black font-black border-2 border-black shadow-[0_0_20px_rgba(249,115,22,0.6)] hover:brightness-110"
              >
                KEEP IT UP!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quests Completed Modal with Emerald 3D Light Effect */}
      {activeModal === 'quests' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-neutral-950 border-4 border-emerald-400 rounded-3xl p-6 shadow-[0_0_80px_rgba(16,185,129,0.8)] text-center overflow-hidden">
            
            <Light3DEffectCanvas glowColor="rgba(16, 185, 129, 0.45)" />

            <div className="relative z-10">
              <button 
                onClick={(e) => { e.stopPropagation(); triggerClickSFX(); setActiveModal(null); }}
                className="absolute top-0 right-0 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-2 rounded-xl border border-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 mx-auto bg-emerald-400 border-4 border-black rounded-3xl flex items-center justify-center mb-3 shadow-[0_0_35px_rgba(16,185,129,0.9)] animate-pulse">
                <Target className="w-10 h-10 text-black" />
              </div>

              <h3 className="text-2xl font-black text-emerald-300 uppercase drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">QUESTS DONE</h3>

              <div className="my-5 py-4 bg-neutral-900/90 border-2 border-emerald-400/80 rounded-2xl shadow-inner backdrop-blur-md">
                <span className="text-4xl font-black text-emerald-300 font-mono tracking-wider drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]">
                  {counterValue}
                </span>
                <p className="text-xs font-semibold text-neutral-400 mt-1">TOTAL COMPLETED QUESTS</p>
              </div>

              <Button 
                onClick={(e) => { e.stopPropagation(); triggerClickSFX(); setActiveModal(null); }}
                className="w-full bg-emerald-400 text-black font-black border-2 border-black shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:brightness-110"
              >
                AWESOME
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
