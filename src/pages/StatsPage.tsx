import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { AttributeBar } from '@/components/character/AttributeBar';
import {
  ATTRIBUTE_KEYS,
  ALL_TITLES,
  CHARACTER_CLASS_META,
  type AchievementDefinition,
  type QuestLog,
  type UserAchievement,
} from '@/types/database';
import { 
  TrendingUp, Award, Flame, Calendar, Coins, Star, Lock,
  Volume2, VolumeX, Shield, Trophy, Plane, X, Sword, Heart,
  Zap, Skull, Target, Sparkles, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// 🔊 Centralized Synth & Gamer Arcade Sound Engine
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

const playArcadeSound = (type: 'airplane' | 'coin' | 'level' | 'click' | 'streak' | 'quest' | 'hover' | 'bossHit' | 'ability') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'hover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.03);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'bossHit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'ability') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'coin') {
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
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
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
    // Audio Fallback
  }
};

// 🌌 Animated 3D Synthwave Grid Canvas
function Retro3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const render = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0a0618');
      bgGrad.addColorStop(0.5, '#120a2a');
      bgGrad.addColorStop(1, '#05020c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const horizon = h * 0.52;
      const horizonX = w / 2;

      ctx.lineWidth = 1.2;
      for (let x = -w * 2; x <= w * 3; x += 70) {
        ctx.beginPath();
        ctx.moveTo(horizonX, horizon);
        ctx.lineTo(x, h);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.stroke();
      }

      offset = (offset + 0.6) % 35;
      for (let y = horizon; y <= h; y += Math.pow((y - horizon) / 22, 1.35) + 5) {
        const lineY = y + (offset * (y - horizon)) / 180;
        if (lineY <= h) {
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(w, lineY);
          const alpha = Math.min(0.45, (lineY - horizon) / (h - horizon));
          ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
          ctx.stroke();
        }
      }

      const sunGrad = ctx.createRadialGradient(horizonX, horizon - 20, 10, horizonX, horizon - 20, 240);
      sunGrad.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
      sunGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.2)');
      sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 w-full h-full pointer-events-none" />;
}

// 🌟 3D Lighting Effect Canvas for Modals
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

      const radialGradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 200);
      radialGradient.addColorStop(0, glowColor);
      radialGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
      radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      lightRays.forEach((ray) => {
        ray.angle += ray.speed;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, ray.length, ray.angle, ray.angle + 0.15);
        ctx.fillStyle = glowColor.replace(/[\d.]+\)$/g, '0.08)');
        ctx.fill();
      });

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

export function StatsPage() {
  const { user, profile } = useAuth();
  const [history, setHistory] = useState<QuestLog[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);

  const [soundMuted, setSoundMuted] = useState(false);
  const [activeModal, setActiveModal] = useState<'level' | 'xp' | 'coins' | 'streak' | null>(null);
  const [counterValue, setCounterValue] = useState<number>(0);
  const [isAirplaneFlying, setIsAirplaneFlying] = useState<boolean>(false);

  // 🎮 Gaming Specific States (Boss HP, Abilities & Combo)
  const [bossHp, setBossHp] = useState<number>(75);
  const [comboMultiplier, setComboMultiplier] = useState<number>(3);
  const [damagePopup, setDamagePopup] = useState<string | null>(null);
  const [abilityCooldowns, setAbilityCooldowns] = useState<{ [key: string]: boolean }>({
    Q: false,
    W: false,
    E: false,
    R: false,
  });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from('quest_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(12),
      supabase
        .from('user_achievements')
        .select('*, achievement:achievement_definitions(*)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false }),
    ]).then(([historyResult, achievementResult]) => {
      if (!historyResult.error) setHistory((historyResult.data ?? []) as QuestLog[]);
      if (!achievementResult.error) setAchievements((achievementResult.data ?? []) as UserAchievement[]);
    });
  }, [user]);

  const difficultyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach((entry) => {
      counts[entry.difficulty] = (counts[entry.difficulty] ?? 0) + 1;
    });
    return counts;
  }, [history]);

  const triggerClickSFX = useCallback(() => {
    if (!soundMuted) playArcadeSound('click');
  }, [soundMuted]);

  const triggerHoverSFX = useCallback(() => {
    if (!soundMuted) playArcadeSound('hover');
  }, [soundMuted]);

  // ⚔️ Gaming Interaction Handlers
  const attackBoss = () => {
    if (!soundMuted) playArcadeSound('bossHit');
    const dmg = Math.floor(Math.random() * 15) + 10;
    setBossHp((prev) => Math.max(0, prev - dmg));
    setDamagePopup(`-${dmg} CRIT!`);
    setComboMultiplier((prev) => prev + 1);
    setTimeout(() => setDamagePopup(null), 800);
  };

  const castAbility = (key: string) => {
    if (abilityCooldowns[key]) return;
    if (!soundMuted) playArcadeSound('ability');

    setAbilityCooldowns((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setAbilityCooldowns((prev) => ({ ...prev, [key]: false }));
    }, 3000);
  };

  const openModal = useCallback((type: 'level' | 'xp' | 'coins' | 'streak') => {
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
        if (!soundMuted) playArcadeSound('coin');
        current += step;
        if (current >= target) {
          setCounterValue(target);
          clearInterval(interval);
        } else {
          setCounterValue(current);
        }
      }, 45);
    } else if (type === 'streak') {
      let current = 0;
      const target = profile.streak_days;
      const interval = setInterval(() => {
        current += 1;
        if (!soundMuted) playArcadeSound('streak');
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

  return (
    <div className="relative min-h-screen text-white space-y-6 animate-fade-in p-2 sm:p-4">
      {/* 3D Synthwave Background */}
      <Retro3DBackground />

      {/* 🎮 TOP GAMER HUD HEADER BAR */}
      <div className="bg-neutral-950/90 border-2 border-cyan-500/50 p-4 rounded-3xl backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.25)] relative overflow-hidden">
        {/* Neon HUD Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Player Gamer Status Banner */}
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-pulse">
                <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                  <Sword className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
                </div>
              </div>
              <span className="absolute -bottom-2 -right-1 bg-yellow-400 text-black font-black text-[10px] px-2 py-0.5 rounded-full border border-black shadow">
                LVL {profile.level}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl text-white tracking-wider uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  PLAYER ONE
                </h1>
                <Badge color="primary" size="sm" className="bg-purple-600/60 text-purple-200 border border-purple-400">
                  {profile.character_class || 'Cyber Knight'}
                </Badge>
              </div>

              {/* Gamer HP & MP Vitals */}
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5 w-28">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden border border-red-500/40">
                    <div className="bg-gradient-to-r from-red-600 to-pink-500 h-full w-[85%]" />
                  </div>
                  <span className="text-[10px] text-red-400 font-mono">850</span>
                </div>

                <div className="flex items-center gap-1.5 w-28">
                  <Zap className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden border border-blue-500/40">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-[100%]" />
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">MAX</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gamer Quick Skill Deck (Q, W, E, R Keys) */}
          <div className="flex items-center gap-2 bg-neutral-900/90 p-2 rounded-2xl border border-purple-500/40 shadow-inner">
            <span className="text-[10px] text-purple-300 font-black tracking-widest px-1 uppercase">SKILLS</span>
            {[
              { key: 'Q', icon: Sword, label: 'Strike' },
              { key: 'W', icon: Shield, label: 'Guard' },
              { key: 'E', icon: Zap, label: 'Boost' },
              { key: 'R', icon: Sparkles, label: 'Ultimate' },
            ].map((skill) => {
              const SkillIcon = skill.icon;
              const isCooling = abilityCooldowns[skill.key];
              return (
                <button
                  key={skill.key}
                  onClick={() => castAbility(skill.key)}
                  onMouseEnter={() => triggerHoverSFX()}
                  className={`relative w-11 h-11 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-150 ${
                    isCooling
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-600 scale-95'
                      : 'bg-gradient-to-b from-purple-900/80 to-neutral-950 border-purple-400 text-purple-200 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] active:scale-90'
                  }`}
                >
                  <span className="absolute top-0.5 left-1 text-[8px] font-black text-cyan-400">{skill.key}</span>
                  <SkillIcon className="w-4 h-4 text-cyan-300" />
                  {isCooling && (
                    <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center text-[10px] font-bold text-red-400">
                      CD
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sound Effect Toggle */}
          <button
            onClick={() => {
              triggerClickSFX();
              setSoundMuted(!soundMuted);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-black font-black text-xs shadow-[0_4px_0_#996f00] hover:brightness-110 active:translate-y-1 transition-all border border-black"
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{soundMuted ? 'SFX OFF' : 'SFX ON'}</span>
          </button>
        </div>
      </div>

      {/* 🐲 GAMER DAILY BOSS RAID WIDGET */}
      <div className="relative bg-gradient-to-r from-red-950/80 via-neutral-950 to-purple-950/80 border-2 border-red-500/60 p-4 rounded-3xl backdrop-blur-xl shadow-[0_0_35px_rgba(239,68,68,0.3)] flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden group">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600/30 border-2 border-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.6)] relative">
            <Skull className="w-8 h-8 text-red-400 animate-bounce" />
            <span className="absolute -top-2 -left-2 bg-red-500 text-black text-[8px] font-black px-1.5 rounded">BOSS</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-red-200 tracking-wide">PROCRASTINATION DRAGON</h3>
              <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/40">
                DAILY RAID
              </span>
            </div>
            <div className="w-48 sm:w-64 bg-neutral-900 border border-red-500/50 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 h-full transition-all duration-300"
                style={{ width: `${bossHp}%` }}
              />
            </div>
            <p className="text-[11px] text-red-300/80 font-mono">BOSS HP: {bossHp} / 100</p>
          </div>
        </div>

        {/* Interactive Boss Hit Button & Damage Float */}
        <div className="relative">
          {damagePopup && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-black text-yellow-300 text-lg animate-ping pointer-events-none drop-shadow-[0_0_8px_rgba(234,179,8,1)]">
              {damagePopup}
            </div>
          )}
          <button
            onClick={attackBoss}
            onMouseEnter={() => triggerHoverSFX()}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-black font-black text-xs shadow-[0_5px_0_#991b1b] hover:brightness-110 active:translate-y-1 transition-all border-2 border-black"
          >
            <Target className="w-4 h-4 text-black" />
            <span>ATTACK BOSS</span>
          </button>
        </div>
      </div>

      {/* 🕹️ Top Stat 3D Animated Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Level Progress Stat Card */}
        <button
          onClick={() => openModal('level')}
          onMouseEnter={() => triggerHoverSFX()}
          className="relative bg-gradient-to-b from-purple-600/90 to-indigo-950 border-2 border-purple-400 p-4 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.8)] hover:scale-[1.02] active:scale-95 transition-all text-left overflow-hidden group"
        >
          <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black shadow">
            TAP
          </div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
            <span className="text-xs font-black uppercase text-purple-200 tracking-wider">LEVEL PROGRESS</span>
          </div>
          <ProgressBar value={profile.xp} max={profile.xp_to_next_level} color="primary" size="lg" showValue />
          <p className="mt-2 text-xs text-purple-200/80 font-medium">
            {(profile.xp_to_next_level - profile.xp).toLocaleString()} XP to level {profile.level + 1}
          </p>
        </button>

        {/* Lifetime XP Stat Card */}
        <button
          onClick={() => openModal('xp')}
          onMouseEnter={() => triggerHoverSFX()}
          className="relative bg-gradient-to-b from-cyan-500/90 to-blue-950 border-2 border-cyan-300 p-4 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.8)] hover:scale-[1.02] active:scale-95 transition-all text-left overflow-hidden group"
        >
          <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black shadow">
            TAP
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-cyan-200 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
            <span className="text-xs font-black uppercase text-cyan-100 tracking-wider">LIFETIME XP</span>
          </div>
          <p className="text-3xl font-black text-white drop-shadow-[0_2px_4px_#000]">{profile.total_xp.toLocaleString()}</p>
          <p className="text-xs text-cyan-200/80 mt-1 font-medium">Total experience earned</p>
        </button>

        {/* Coins Stat Card */}
        <button
          onClick={() => openModal('coins')}
          onMouseEnter={() => triggerHoverSFX()}
          className="relative bg-gradient-to-b from-amber-400/90 to-yellow-950 border-2 border-amber-300 p-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.8)] hover:scale-[1.02] active:scale-95 transition-all text-left overflow-hidden group"
        >
          <div className="absolute top-2 right-2 bg-white text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black shadow">
            TAP
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-yellow-100 drop-shadow-[0_0_8px_rgba(254,240,138,0.8)]" />
            <span className="text-xs font-black uppercase text-amber-100 tracking-wider">COINS</span>
          </div>
          <p className="text-3xl font-black text-white drop-shadow-[0_2px_4px_#000]">{profile.coins.toLocaleString()}</p>
          <p className="text-xs text-amber-200/80 mt-1 font-medium">Currency earned from quests</p>
        </button>

        {/* Streak Stat Card with Gaming Combo Badge */}
        <button
          onClick={() => openModal('streak')}
          onMouseEnter={() => triggerHoverSFX()}
          className="relative bg-gradient-to-b from-orange-500/90 to-red-950 border-2 border-orange-400 p-4 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_rgba(249,115,22,0.8)] hover:scale-[1.02] active:scale-95 transition-all text-left overflow-hidden group"
        >
          <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black shadow flex items-center gap-1">
            <Activity className="w-3 h-3 text-red-600" /> {comboMultiplier}x COMBO
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-200 drop-shadow-[0_0_8px_rgba(253,186,116,0.8)]" />
            <span className="text-xs font-black uppercase text-orange-100 tracking-wider">STREAK</span>
          </div>
          <p className="text-3xl font-black text-white drop-shadow-[0_2px_4px_#000]">{profile.streak_days} DAYS</p>
          <p className="text-xs text-orange-200/80 mt-1 font-medium">Consecutive daily login</p>
        </button>

      </div>

      {/* Character Attributes Card */}
      <Card className="bg-neutral-950/80 border-2 border-purple-500/40 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.2)]">
        <CardHeader
          title="Character Attributes"
          subtitle={`${CHARACTER_CLASS_META[profile.character_class].label} — ${CHARACTER_CLASS_META[profile.character_class].description}`}
          icon={<Shield className="w-5 h-5 text-purple-400" />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {ATTRIBUTE_KEYS.map((key) => (
            <AttributeBar key={key} attribute={key} value={profile[key]} />
          ))}
        </div>
      </Card>

      {/* Title Collection Card */}
      <Card className="bg-neutral-950/80 border-2 border-cyan-500/40 backdrop-blur-xl shadow-[0_0_25px_rgba(6,182,212,0.2)]">
        <CardHeader
          title="Title Collection"
          subtitle={`${profile.titles.length} of ${ALL_TITLES.length} unlocked`}
          icon={<Award className="w-5 h-5 text-cyan-400" />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_TITLES.map((titleDef) => {
            const unlocked = profile.titles.includes(titleDef.title);
            const equipped = profile.title === titleDef.title;
            return (
              <div
                key={titleDef.title}
                onMouseEnter={() => triggerHoverSFX()}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  equipped
                    ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : unlocked
                      ? 'bg-neutral-900/80 border-purple-500/40 hover:border-cyan-400/60'
                      : 'bg-neutral-950/50 border-neutral-800 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {unlocked ? (
                    <Award className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  ) : (
                    <Lock className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-neutral-500'}`}>{titleDef.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{titleDef.requirement}</p>
                    {equipped && <Badge color="primary" size="sm" className="mt-1">Equipped</Badge>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Activity Overview Card */}
      <Card className="bg-neutral-950/80 border-2 border-purple-500/30 backdrop-blur-xl">
        <CardHeader title="Activity Overview" subtitle="Your latest quest completions" icon={<Calendar className="w-5 h-5 text-purple-400" />} />
        {history.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500">Your activity history will appear here once you complete a quest.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 6).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl bg-neutral-900/80 border border-neutral-800 px-3.5 py-2.5 hover:border-cyan-500/50 transition-all">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-200 truncate">{entry.quest_title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(entry.completed_at))}</p>
                </div>
                <Badge color="secondary" size="sm">+{entry.xp_earned} XP</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quest Breakdown Card */}
      <Card className="bg-neutral-950/80 border-2 border-cyan-500/30 backdrop-blur-xl">
        <CardHeader title="Quest Breakdown" subtitle="Completions by difficulty" icon={<Award className="w-5 h-5 text-cyan-400" />} />
        <div className="space-y-3">
          {['Trivial', 'Easy', 'Normal', 'Hard', 'Epic'].map((diff, i) => (
            <div key={diff} className="flex items-center gap-4">
              <span className="text-sm font-bold text-neutral-300 w-16">{diff}</span>
              <div className="flex-1">
                <ProgressBar
                  value={difficultyCounts[diff.toLowerCase()] ?? 0}
                  max={Math.max(1, ...Object.values(difficultyCounts))}
                  size="sm"
                  color={( ['neutral', 'success', 'primary', 'warning', 'error'] as const )[i]}
                />
              </div>
              <span className="text-sm font-mono text-cyan-300 font-bold w-8 text-right">{difficultyCounts[diff.toLowerCase()] ?? 0}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Achievements Card */}
      <Card className="bg-neutral-950/80 border-2 border-yellow-500/30 backdrop-blur-xl shadow-[0_0_25px_rgba(234,179,8,0.15)]">
        <CardHeader title="Achievements" subtitle={`${achievements.length} unlocked`} icon={<Award className="w-5 h-5 text-yellow-400" />} />
        {achievements.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">Complete quests to unlock achievements.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((item) => {
              const achievement = item.achievement as AchievementDefinition | undefined;
              return (
                <div key={`${item.user_id}-${item.achievement_id}`} className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3.5 flex items-start gap-3">
                  <Award className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                  <div>
                    <p className="text-sm font-bold text-white">{achievement?.name ?? 'Achievement'}</p>
                    <p className="text-xs text-neutral-400 mt-1">{achievement?.description ?? 'Milestone unlocked.'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* 🔮 Dynamic 3D Interactive Modals */}
      {/* ========================================================================= */}

      {activeModal === 'level' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-neutral-950 border-4 border-purple-400 rounded-3xl p-6 shadow-[0_0_80px_rgba(168,85,247,0.8)] text-center overflow-hidden">
            <Light3DEffectCanvas glowColor="rgba(168, 85, 247, 0.4)" />
            <div className="relative z-10">
              <button onClick={() => setActiveModal(null)} className="absolute top-0 right-0 bg-neutral-800 text-neutral-300 p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
              <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-purple-600 to-yellow-400 border-4 border-black rounded-3xl flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(234,179,8,0.8)] animate-pulse">
                <Trophy className="w-10 h-10 text-black" />
              </div>
              <h3 className="text-2xl font-black text-purple-300 uppercase">LEVEL PROGRESS</h3>
              <p className="text-xs text-purple-200/80 mb-5">Keep completing quests to gain level upgrades</p>
              <Button onClick={() => setActiveModal(null)} className="w-full bg-yellow-400 text-black font-black border-2 border-black">
                CONTINUE
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'xp' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-neutral-950 border-4 border-cyan-400 rounded-3xl p-6 shadow-[0_0_80px_rgba(6,182,212,0.8)] text-center overflow-hidden">
            <Light3DEffectCanvas glowColor="rgba(6, 182, 212, 0.4)" />
            <div className="relative z-10">
              <button onClick={() => setActiveModal(null)} className="absolute top-0 right-0 bg-neutral-800 text-neutral-300 p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
              <div className={`my-3 flex justify-center ${isAirplaneFlying ? 'animate-bounce' : ''}`}>
                <div className="w-20 h-20 rounded-3xl bg-cyan-400 border-4 border-black flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.8)]">
                  <Plane className="w-10 h-10 text-black -rotate-45" />
                </div>
              </div>
              <h3 className="text-xl font-black text-white mt-2">TOTAL XP COLLECTED</h3>
              <div className="my-5 py-4 bg-neutral-900/90 border-2 border-cyan-400/80 rounded-2xl">
                <span className="text-4xl font-black text-cyan-300 font-mono">{counterValue.toLocaleString()}</span>
              </div>
              <Button onClick={() => setActiveModal(null)} className="w-full bg-cyan-400 text-black font-black border-2 border-black">
                ACCEPT XP
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'coins' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-neutral-950 border-4 border-amber-400 rounded-3xl p-6 shadow-[0_0_80px_rgba(245,158,11,0.8)] text-center overflow-hidden">
            <Light3DEffectCanvas glowColor="rgba(245, 158, 11, 0.45)" />
            <div className="relative z-10">
              <button onClick={() => setActiveModal(null)} className="absolute top-0 right-0 bg-neutral-800 text-neutral-300 p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
              <div className="w-20 h-20 mx-auto bg-amber-400 border-4 border-black rounded-full flex items-center justify-center mb-3">
                <Coins className="w-10 h-10 text-black" />
              </div>
              <h3 className="text-2xl font-black text-amber-300 uppercase">GOLD BANK</h3>
              <div className="my-5 py-4 bg-neutral-900/90 border-2 border-amber-400/80 rounded-2xl">
                <span className="text-4xl font-black text-yellow-300 font-mono">{counterValue.toLocaleString()}</span>
              </div>
              <Button onClick={() => setActiveModal(null)} className="w-full bg-amber-400 text-black font-black border-2 border-black">
                COLLECT ALL
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'streak' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-neutral-950 border-4 border-orange-500 rounded-3xl p-6 shadow-[0_0_80px_rgba(249,115,22,0.8)] text-center overflow-hidden">
            <Light3DEffectCanvas glowColor="rgba(249, 115, 22, 0.45)" />
            <div className="relative z-10">
              <button onClick={() => setActiveModal(null)} className="absolute top-0 right-0 bg-neutral-800 text-neutral-300 p-2 rounded-xl">
                <X className="w-5 h-5" />
              </button>
              <div className="w-20 h-20 mx-auto bg-orange-500 border-4 border-black rounded-full flex items-center justify-center mb-3">
                <Flame className="w-10 h-10 text-black" />
              </div>
              <h3 className="text-2xl font-black text-orange-400 uppercase">DAILY STREAK</h3>
              <div className="my-5 py-4 bg-neutral-900/90 border-2 border-orange-500/80 rounded-2xl">
                <span className="text-4xl font-black text-orange-400 font-mono">{counterValue} DAYS</span>
              </div>
              <Button onClick={() => setActiveModal(null)} className="w-full bg-orange-500 text-black font-black border-2 border-black">
                KEEP STREAK ALIVE
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}