import { useState, useEffect, useRef } from 'react';
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
  X,
  Sparkles,
  Ghost,
  Swords
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
    } catch {
      // Audio fallback protection
    }
  }
}

export const audioFX = new SoundEngine();

// ==========================================
// 2. ANIME & CARTOON ANIMATED DYNAMIC BACKGROUND
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

    // Anime Speed Lines & Flying Magical Sparkles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 4 + 1,
      vy: -(Math.random() * 1.5 + 0.5),
      vx: (Math.random() - 0.5) * 0.8,
      color: ['#a855f7', '#06b6d4', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 4)],
      pulse: Math.random() * Math.PI,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        p.pulse += 0.05;

        if (p.y < 0) p.y = height;
        if (p.x < 0 || p.x > width) p.x = Math.random() * width;

        const dynamicRadius = p.radius + Math.sin(p.pulse) * 1.5;

        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, dynamicRadius), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
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
      {/* 🌸 Anime Floating Aura Orbs */}
      <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-purple-600/30 blur-[140px] animate-pulse" />
      <div className="absolute top-1/4 -right-32 w-[700px] h-[700px] rounded-full bg-cyan-600/25 blur-[150px] animate-pulse duration-1000" />
      <div className="absolute -bottom-32 left-1/4 w-[750px] h-[750px] rounded-full bg-pink-600/20 blur-[160px] animate-pulse duration-2000" />

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* ⚡ Anime Action Speed Grid Floor */}
      <div className="absolute bottom-0 inset-x-0 h-[50vh] [perspective:900px] overflow-hidden opacity-30">
        <div 
          className="w-[200%] -left-[50%] h-[250%] absolute top-0 bg-[linear-gradient(to_right,#ec4899_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [transform:rotateX(75deg)] origin-top animate-grid-scroll"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 85%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 85%, transparent)'
          }}
        />
      </div>

      {/* 🎮 Floating Anime/Cartoon Arcade Sprites */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[12%] left-[5%] animate-bounce">
          <Coins className="w-10 h-10 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]" />
        </div>
        <div className="absolute top-[35%] right-[6%] animate-pulse">
          <Zap className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.9)]" />
        </div>
        <div className="absolute bottom-[28%] left-[8%] animate-bounce">
          <Gem className="w-10 h-10 text-pink-400 drop-shadow-[0_0_15px_rgba(244,114,182,0.9)]" />
        </div>
        <div className="absolute bottom-[18%] right-[8%] animate-pulse">
          <Trophy className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.9)]" />
        </div>
        <div className="absolute top-[48%] left-[48%] animate-ping">
          <Flame className="w-10 h-10 text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.9)]" />
        </div>
        <div className="absolute top-[22%] left-[80%] animate-spin duration-3000">
          <Sparkles className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.9)]" />
        </div>
        <div className="absolute bottom-[40%] right-[85%] animate-bounce">
          <Ghost className="w-9 h-9 text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.9)]" />
        </div>
      </div>

      {/* Comic Halftone Dot Effect Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-20" />
      
      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,5,8,0.85)_100%)]" />
    </div>
  );
}

// ==========================================
// 3. INTERACTIVE CARTOON/ANIME STAT MODAL
// ==========================================
interface StatModalProps {
  type: 'level' | 'xp' | 'coins' | 'gems' | null;
  onClose: () => void;
}

function StatModal({ type, onClose }: StatModalProps) {
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [counter, setCounter] = useState(0);

  const statConfigs = {
    level: { title: 'HERO LEVEL 42', val: 42, max: 'MAX 100', color: '#ec4899', icon: Flame, desc: 'Unlocks higher bounty difficulty and exclusive bazaar items.' },
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
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: Math.random() * 4 + 1.5,
      life: 1,
    }));

    let angle = 0;

    const renderModalCanvas = () => {
      ctx.clearRect(0, 0, 400, 300);
      angle += 0.015;

      ctx.save();
      ctx.translate(200, 150);
      ctx.rotate(angle);
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 220, (i * Math.PI) / 6, ((i + 0.35) * Math.PI) / 6);
        ctx.closePath();
        ctx.fillStyle = `${current.color}25`;
        ctx.fill();
      }
      ctx.restore();

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) {
          p.x = 200;
          p.y = 150;
          p.vx = (Math.random() - 0.5) * 6;
          p.vy = (Math.random() - 0.5) * 6;
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
        className="relative w-full max-w-md bg-neutral-900/95 border-4 rounded-3xl overflow-hidden p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
        style={{ borderColor: current.color, boxShadow: `0 0 50px ${current.color}65` }}
      >
        <button 
          onClick={() => { audioFX.play('click'); onClose(); }}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-800/80 p-2 rounded-full transition-colors z-10 border border-neutral-700"
        >
          <X className="w-5 h-5" />
        </button>

        <canvas ref={modalCanvasRef} className="absolute inset-0 pointer-events-none" />

        <div 
          className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg animate-bounce border-2"
          style={{ backgroundColor: `${current.color}30`, borderColor: current.color }}
        >
          <IconComp className="w-10 h-10" style={{ color: current.color }} />
        </div>

        <span className="relative z-10 font-mono text-xs font-black tracking-widest text-neutral-400 uppercase">
          {current.max}
        </span>
        <h3 className="relative z-10 text-2xl font-black text-white tracking-wide mt-1 uppercase">
          {current.title}
        </h3>

        <div className="relative z-10 text-5xl font-black my-4 tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ color: current.color }}>
          {counter.toLocaleString()}
        </div>

        <p className="relative z-10 text-neutral-300 text-sm max-w-xs mb-6 leading-relaxed">
          {current.desc}
        </p>

        <button
          onClick={() => { audioFX.play('click'); onClose(); }}
          className="relative z-10 px-8 py-3 rounded-xl font-black uppercase tracking-wider text-black transition-all hover:scale-105 active:scale-95 shadow-lg border-2 border-black"
          style={{ backgroundColor: current.color, boxShadow: `0 0 25px ${current.color}90` }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 4. CARTOON ANIMATED LOADING SCREEN
// ==========================================
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center relative overflow-hidden">
      <GameBackground />
      <div className="flex flex-col items-center gap-4 z-10">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-1 shadow-2xl shadow-pink-500/50 animate-bounce">
            <div className="w-full h-full bg-neutral-950 rounded-[22px] flex items-center justify-center">
              <Swords className="w-10 h-10 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-spin" />
        </div>
        <p className="font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400 animate-pulse uppercase">
          READYING ANIME ARENA...
        </p>
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
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 selection:bg-pink-500 selection:text-white">
      {/* 1. Anime Cartoon 3D Background */}
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