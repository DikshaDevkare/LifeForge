import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { FeedbackProvider } from '@/context/FeedbackContext';
import { AuthPage } from '@/components/auth/AuthPage';
import { AppShell } from '@/components/layout/AppShell';
import type { PageId } from '@/components/layout/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { QuestsPage } from '@/pages/QuestsPage';
import { StatsPage } from '@/pages/StatsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ShopPage } from '@/pages/ShopPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { 
  Flame, 
  Coins, 
  Zap, 
  Gem, 
  Trophy, 
  X 
} from 'lucide-react';

// ==========================================
// 1. ARCADE SOUND ENGINE (Web Audio API)
// ==========================================
class SoundEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type: 'click' | 'coin' | 'levelUp' | 'streak' | 'questComplete') {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      if (type === 'click') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.04);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'coin') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'levelUp') {
        const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        freqs.forEach((f, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f, now + i * 0.05);
          gain.gain.setValueAtTime(0.1, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.12);
        });
      }
    } catch (e) {
      // Audio fallback protection
    }
  }
}

export const audioFX = new SoundEngine();

// ==========================================
// 2. UNIFIED GLOBAL 3D DYNAMIC BACKGROUND
// ==========================================
function GameBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      depth: Math.random() * 3 + 1,
      opacity: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      stars.forEach((star) => {
        star.opacity += star.speed;
        if (star.opacity > 1 || star.opacity < 0.2) star.speed = -star.speed;

        ctx.fillStyle = `rgba(147, 51, 234, ${Math.abs(star.opacity)})`;
        ctx.shadowBlur = star.size * 4;
        ctx.shadowColor = '#06b6d4';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.y += star.depth * 0.12;
        if (star.y > height) star.y = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-neutral-950">
      {/* Dynamic Drifting Nebulas */}
      <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-purple-900/30 blur-[140px] animate-pulse" />
      <div className="absolute top-1/4 -right-32 w-[700px] h-[700px] rounded-full bg-cyan-900/25 blur-[150px] animate-pulse duration-1000" />
      <div className="absolute -bottom-32 left-1/4 w-[750px] h-[750px] rounded-full bg-indigo-900/20 blur-[160px] animate-pulse duration-2000" />

      {/* Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Endless 3D Sci-Fi Perspective Grid Floor */}
      <div className="absolute bottom-0 inset-x-0 h-[50vh] [perspective:900px] overflow-hidden opacity-35">
        <div 
          className="w-[200%] -left-[50%] h-[250%] absolute top-0 bg-[linear-gradient(to_right,#a855f7_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [transform:rotateX(75deg)] origin-top animate-grid-scroll"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 85%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 85%, transparent)'
          }}
        />
      </div>

      {/* Ambient Floating 3D Arcade Sprites */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <Coins className="absolute top-[12%] left-[4%] w-10 h-10 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-bounce" />
        <Zap className="absolute top-[35%] right-[6%] w-12 h-12 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-pulse" />
        <Gem className="absolute bottom-[28%] left-[8%] w-10 h-10 text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.8)] animate-bounce" />
        <Trophy className="absolute bottom-[18%] right-[8%] w-12 h-12 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)] animate-pulse" />
        <Flame className="absolute top-[50%] left-[50%] w-10 h-10 text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)] animate-ping" />
      </div>

      {/* Cyber Scanline Line Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.25)_51%)] bg-[size:100%_4px] pointer-events-none opacity-40" />
      
      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,5,8,0.85)_100%)]" />
    </div>
  );
}

// ==========================================
// 3. INTERACTIVE CANVAS STAT MODAL
// ==========================================
interface StatModalProps {
  type: 'level' | 'xp' | 'coins' | 'gems' | null;
  onClose: () => void;
}

function StatModal({ type, onClose }: StatModalProps) {
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [counter, setCounter] = useState(0);

  const statConfigs = {
    level: { title: 'HERO LEVEL 42', val: 42, max: 'MAX 100', color: '#c084fc', icon: Flame, desc: 'Unlocks higher bounty difficulty and exclusive bazaar items.' },
    xp: { title: 'XP PROGRESSION', val: 8450, max: '10,000 XP', color: '#22d3ee', icon: Zap, desc: 'Earn XP by completing habits and active daily quests.' },
    coins: { title: 'GOLD VAULT', val: 1250, max: 'GOLD COINS', color: '#fbbf24', icon: Coins, desc: 'Spend in the Mystic Bazaar for gear upgrades & boosts.' },
    gems: { title: 'MYTHIC GEMS', val: 85, max: 'PREMIUM', color: '#a855f7', icon: Gem, desc: 'Rare currency awarded on mega streaks and achievements.' },
  };

  const current = type ? statConfigs[type] : null;

  useEffect(() => {
    if (!current) return;
    audioFX.play(type === 'coins' ? 'coin' : 'levelUp');

    let start = 0;
    const end = current.val;
    const duration = 800;
    const startTime = performance.now();

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCounter(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(updateCounter);
    };
    requestAnimationFrame(updateCounter);

    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    canvas.width = 400;
    canvas.height = 300;

    const particles = Array.from({ length: 35 }, () => ({
      x: 200,
      y: 150,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      size: Math.random() * 3.5 + 1.5,
      life: 1,
    }));

    let angle = 0;

    const renderModalCanvas = () => {
      ctx.clearRect(0, 0, 400, 300);
      angle += 0.012;

      ctx.save();
      ctx.translate(200, 150);
      ctx.rotate(angle);
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 220, (i * Math.PI) / 6, ((i + 0.35) * Math.PI) / 6);
        ctx.closePath();
        ctx.fillStyle = `${current.color}18`;
        ctx.fill();
      }
      ctx.restore();

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.018;
        if (p.life <= 0) {
          p.x = 200;
          p.y = 150;
          p.vx = (Math.random() - 0.5) * 5;
          p.vy = (Math.random() - 0.5) * 5;
          p.life = 1;
        }
        ctx.fillStyle = current.color;
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(renderModalCanvas);
    };

    renderModalCanvas();

    return () => cancelAnimationFrame(animId);
  }, [type]);

  if (!current) return null;

  const IconComp = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-neutral-900/95 border-2 rounded-3xl overflow-hidden p-6 shadow-2xl flex flex-col items-center text-center"
        style={{ borderColor: current.color, boxShadow: `0 0 45px ${current.color}45` }}
      >
        <button 
          onClick={() => { audioFX.play('click'); onClose(); }}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-800/80 p-2 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <canvas ref={modalCanvasRef} className="absolute inset-0 pointer-events-none" />

        <div 
          className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg animate-bounce"
          style={{ backgroundColor: `${current.color}25`, border: `2px solid ${current.color}` }}
        >
          <IconComp className="w-10 h-10" style={{ color: current.color }} />
        </div>

        <span className="relative z-10 font-mono text-xs font-black tracking-widest text-neutral-400 uppercase">
          {current.max}
        </span>
        <h3 className="relative z-10 text-2xl font-black text-white tracking-wide mt-1 uppercase">
          {current.title}
        </h3>

        <div className="relative z-10 text-5xl font-black my-4 tracking-tight" style={{ color: current.color }}>
          {counter.toLocaleString()}
        </div>

        <p className="relative z-10 text-neutral-300 text-sm max-w-xs mb-6 leading-relaxed">
          {current.desc}
        </p>

        <button
          onClick={() => { audioFX.play('click'); onClose(); }}
          className="relative z-10 px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-black transition-all hover:scale-105 active:scale-95 shadow-lg"
          style={{ backgroundColor: current.color, boxShadow: `0 0 20px ${current.color}80` }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 4. ORIGINAL LOADING SCREEN
// ==========================================
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center relative overflow-hidden">
      <GameBackground />
      <div className="flex flex-col items-center gap-4 z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-600/30 animate-pulse">
          <Flame className="w-9 h-9 text-white" />
        </div>
        <p className="font-display text-lg font-semibold text-neutral-400">Loading LifeForge Arcade...</p>
      </div>
    </div>
  );
}

// ==========================================
// 5. MAIN CONTENT ROUTER & APP CONTENT
// ==========================================
function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [activeStatModal, setActiveStatModal] = useState<'level' | 'xp' | 'coins' | 'gems' | null>(null);

  // Global sound triggers on button clicks
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, [role="button"]')) {
        audioFX.play('click');
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthPage />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'quests':
        return <QuestsPage />;
      case 'stats':
        return <StatsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'shop':
        return <ShopPage />;
      case 'inventory':
        return <InventoryPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 selection:bg-purple-500 selection:text-white">
      {/* 1. Global 3D Background */}
      <GameBackground />

      {/* 2. Interactive Stat Modal Overlay */}
      <StatModal type={activeStatModal} onClose={() => setActiveStatModal(null)} />

      {/* 3. App Shell Frame Integration */}
      <AppShell currentPage={currentPage} onNavigate={setCurrentPage}>
        <div className="relative z-10 transition-all duration-300 animate-float-3d">
          {renderPage()}
        </div>
      </AppShell>
    </div>
  );
}

// ==========================================
// 6. ROOT APP
// ==========================================
function App() {
  return (
    <FeedbackProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </FeedbackProvider>
  );
}

export default App;