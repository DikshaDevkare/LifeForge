import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Lock,
  Check,
  Star,
  Crown,
  Coins,
  Flame,
  Zap,
  Plus,
  X,
  Play,
  Sparkles,
  Trophy,
  Gem,
  Cloud,
  Skull,
  Gift,
  ShoppingBag,
  Radar,
  Upload,
  ImagePlus,
  CheckCircle2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* ORIGINAL CHARACTER ROSTER                                           */
/* ------------------------------------------------------------------ */

const CHARACTERS = [
  { id: 'kai', name: 'Duel Master Kai', price: 0, perkLabel: 'Starter Strategist — No Perk', xpMult: 1, goldMult: 1, glow: 'rgba(139,92,246,0.65)', tagline: 'Spiky-haired card strategist with a gold amulet.' },
  { id: 'ren', name: 'Shadow Blade Ren', price: 450, perkLabel: '+10% XP Boost', xpMult: 1.1, goldMult: 1, glow: 'rgba(148,163,184,0.6)', tagline: 'Black-coated duelist wielding twin blades.' },
  { id: 'nyx', name: 'Lich Lord Nyx', price: 1500, perkLabel: '+30% XP & Coin Multiplier', xpMult: 1.3, goldMult: 1.3, glow: 'rgba(217,70,239,0.75)', tagline: 'A skeletal overlord draped in a royal cape.' },
  { id: 'baron', name: 'Iron Grip Baron', price: 800, perkLabel: '+20% Coin Bonus', xpMult: 1, goldMult: 1.2, glow: 'rgba(234,88,12,0.7)', tagline: 'A hulking, scarred brawler built like a wall.' },
  { id: 'gambit', name: 'Gambit the Dealer', price: 1100, perkLabel: '+15% XP & +10% Coins', xpMult: 1.15, goldMult: 1.1, glow: 'rgba(244,63,94,0.7)', tagline: 'A painted-mask gambler who flings cursed cards.' },
  { id: 'mira', name: 'Twin Star Mira', price: 2000, perkLabel: '+35% XP & Coin Multiplier', xpMult: 1.35, goldMult: 1.35, glow: 'rgba(236,72,153,0.75)', tagline: 'A dual-toned mystic duo, moving as one.' },
];

const INITIAL_QUESTS = [
  { id: '1', level: 1, nodeType: 'standard', title: 'Run 10km Sprint', description: 'Upload a workout screenshot to verify the run.', status: 'completed', xpReward: 120, goldReward: 45, stars: 3 },
  { id: '2', level: 2, nodeType: 'standard', title: 'Hackathon PPT Pitch', description: 'Finalize slides and rehearse the demo-day pitch.', status: 'focused', xpReward: 150, goldReward: 60, stars: 0 },
  { id: '3', level: 3, nodeType: 'chest', title: 'Mystery Loot Chest', description: 'A hidden reward cache — open it to reveal bonus loot.', status: 'locked', xpReward: 90, goldReward: 140, stars: 0 },
  { id: '4', level: 4, nodeType: 'boss', title: 'Boss Fight: The Deadline', description: 'A brutal milestone battle. Survive it for double rewards.', status: 'locked', xpReward: 400, goldReward: 200, stars: 0 },
  { id: '5', level: 5, nodeType: 'standard', title: 'LinkedIn Certificate', description: 'Post your completed course badge to LinkedIn.', status: 'locked', xpReward: 80, goldReward: 30, stars: 0 },
  { id: '6', level: 6, nodeType: 'chest', title: 'Mystery Loot Chest', description: 'Another cache glimmers in the distance.', status: 'locked', xpReward: 100, goldReward: 160, stars: 0 },
  { id: '7', level: 7, nodeType: 'standard', title: 'Solve 2 LeetCode Medium', description: 'Focus on Arrays & Dynamic Programming.', status: 'locked', xpReward: 200, goldReward: 90, stars: 0 },
  { id: '8', level: 8, nodeType: 'boss', title: 'Boss Fight: System Design', description: 'Design a DB schema that scales to 1M users — final battle.', status: 'locked', xpReward: 500, goldReward: 260, stars: 0 },
];

/* Dynamic wave positioning — works for ANY number of quests, no overlap */
const VGAP_CYCLE = [210, 220, 205, 235, 210, 225, 200, 230];
const HPOS_CYCLE = [22, 48, 76, 88, 70, 42, 18, 46];
const vGapFor = (i) => VGAP_CYCLE[i % VGAP_CYCLE.length];
const hPosFor = (i) => HPOS_CYCLE[i % HPOS_CYCLE.length];
const topFor = (index) => {
  let sum = 80;
  for (let i = 0; i < index; i++) sum += vGapFor(i);
  return sum;
};

/* ------------------------------------------------------------------ */
/* CUSTOM ORIGINAL ANIME-STYLE AVATARS (hand-built SVG, not traced)     */
/* ------------------------------------------------------------------ */

function CharacterAvatar({ id, className }) {
  switch (id) {
    case 'kai':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="56" r="26" fill="#facc15" />
          <path d="M24 46 L30 8 L44 34 L50 4 L58 34 L72 8 L78 46 Z" fill="#7c3aed" />
          <circle cx="41" cy="58" r="3.5" fill="#1e1b4b" />
          <circle cx="61" cy="58" r="3.5" fill="#1e1b4b" />
          <path d="M40 70 Q50 78 62 70" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="88" r="7" fill="#facc15" stroke="#7c3aed" strokeWidth="3" />
        </svg>
      );
    case 'ren':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="56" r="24" fill="#f1c27d" />
          <path d="M20 48 Q50 4 80 48 L74 40 Q50 14 26 40 Z" fill="#0f172a" />
          <rect x="30" y="70" width="40" height="26" rx="6" fill="#0f172a" />
          <circle cx="41" cy="56" r="3" fill="#0f172a" />
          <circle cx="61" cy="56" r="3" fill="#0f172a" />
          <line x1="10" y1="86" x2="34" y2="62" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <line x1="90" y1="86" x2="66" y2="62" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'nyx':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <path d="M50 6 C20 6 8 90 50 96 C92 90 80 6 50 6 Z" fill="#1e293b" />
          <circle cx="50" cy="52" r="22" fill="#e5e7eb" />
          <circle cx="42" cy="50" r="4" fill="#0f172a" />
          <circle cx="58" cy="50" r="4" fill="#0f172a" />
          <path d="M50 58 L46 66 L54 66 Z" fill="#0f172a" />
          <path d="M36 66 Q50 72 64 66 L60 74 Q50 78 40 74 Z" fill="#0f172a" />
          <circle cx="50" cy="52" r="26" fill="none" stroke="#d946ef" strokeWidth="2" opacity="0.6" />
        </svg>
      );
    case 'baron':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <rect x="24" y="62" width="52" height="34" rx="10" fill="#7c2d12" />
          <circle cx="50" cy="46" r="24" fill="#e6a86b" />
          <path d="M28 40 Q50 20 72 40 L70 32 Q50 16 30 32 Z" fill="#1c1917" />
          <line x1="34" y1="52" x2="44" y2="48" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
          <line x1="66" y1="52" x2="56" y2="48" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" />
          <path d="M40 62 Q50 68 60 62" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="40" y="70" width="20" height="8" rx="4" fill="#f97316" />
        </svg>
      );
    case 'gambit':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="54" r="24" fill="#fde68a" />
          <path d="M28 46 C28 24 72 24 72 46" fill="none" stroke="#831843" strokeWidth="6" />
          <path d="M30 50 L44 50 L44 62 L30 62 Z" fill="#fff" stroke="#831843" strokeWidth="2" />
          <circle cx="37" cy="56" r="2.5" fill="#f43f5e" />
          <circle cx="61" cy="58" r="3" fill="#1e1b4b" />
          <path d="M42 72 Q50 78 58 72" stroke="#831843" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="72" y="60" width="14" height="20" rx="2" fill="#fff" stroke="#831843" strokeWidth="2" transform="rotate(18 79 70)" />
        </svg>
      );
    case 'mira':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="38" cy="54" r="18" fill="#67e8f9" />
          <circle cx="66" cy="54" r="18" fill="#f0abfc" />
          <path d="M22 44 Q38 18 54 44" fill="none" stroke="#0891b2" strokeWidth="4" />
          <path d="M50 44 Q66 18 82 44" fill="none" stroke="#a21caf" strokeWidth="4" />
          <circle cx="34" cy="55" r="2.5" fill="#0e7490" />
          <circle cx="42" cy="55" r="2.5" fill="#0e7490" />
          <circle cx="62" cy="55" r="2.5" fill="#86198f" />
          <circle cx="70" cy="55" r="2.5" fill="#86198f" />
        </svg>
      );
  }
}

/* ------------------------------------------------------------------ */
/* GAMING ANIMATED BACKGROUND                                          */
/* Canvas particle network + CSS cyber grid + Framer-Motion aurora     */
/* Fully isolated from React state — runs its own rAF loop so quest    */
/* updates elsewhere in the tree never touch or restart this layer.    */
/* ------------------------------------------------------------------ */

function GamingBackground() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const COLORS = ['rgba(34,211,238,', 'rgba(232,121,249,', 'rgba(250,204,21,'];
    const LINK_DIST = 130;
    const PARTICLE_DENSITY = 1 / 9000; // particles per px^2, tuned for perf

    let particles = [];

    const makeParticles = () => {
      const count = Math.max(24, Math.min(90, Math.floor(width * height * PARTICLE_DENSITY)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
        colorIdx: Math.floor(Math.random() * COLORS.length),
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.015 + 0.008,
      }));
    };

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeParticles();
    };

    let lastTime = 0;
    const FRAME_INTERVAL = 1000 / 45; // cap ~45fps, plenty smooth, lighter on CPU/GPU

    const tick = (time) => {
      rafRef.current = requestAnimationFrame(tick);
      if (time - lastTime < FRAME_INTERVAL) return;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // update + draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        const alpha = 0.35 + Math.sin(p.pulse) * 0.25;
        ctx.beginPath();
        ctx.fillStyle = `${COLORS[p.colorIdx]}${Math.max(0.1, alpha).toFixed(2)})`;
        ctx.shadowColor = `${COLORS[p.colorIdx]}0.9)`;
        ctx.shadowBlur = 6;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // laser-line connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const lineAlpha = (1 - dist / LINK_DIST) * 0.22;
            ctx.beginPath();
            ctx.strokeStyle = `${COLORS[a.colorIdx]}${lineAlpha.toFixed(2)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    };

    resize();
    rafRef.current = requestAnimationFrame(tick);

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []); // mounts once — never re-initializes on quest/state updates

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Aurora / nebula orbs — soft floating gradients */}
      <motion.div
        animate={{ y: [-20, 20, -20], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        className="absolute top-[6%] left-[12%] w-[26rem] h-[26rem] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.55) 0%, rgba(217,70,239,0) 70%)', willChange: 'transform' }}
      />
      <motion.div
        animate={{ y: [20, -20, 20], scale: [1.05, 1, 1.05] }}
        transition={{ repeat: Infinity, duration: 11, ease: 'easeInOut', delay: 0.8 }}
        className="absolute top-[38%] right-[8%] w-[30rem] h-[30rem] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, rgba(6,182,212,0) 70%)', willChange: 'transform' }}
      />
      <motion.div
        animate={{ y: [-14, 18, -14], scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 13, ease: 'easeInOut', delay: 0.3 }}
        className="absolute bottom-[4%] left-[30%] w-[24rem] h-[24rem] rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(88,28,135,0.6) 0%, rgba(88,28,135,0) 70%)', willChange: 'transform' }}
      />

      {/* Interactive particle network canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" style={{ willChange: 'transform' }} />

      {/* 3D cyber grid / digital highway along the bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[45%] opacity-50"
        style={{ perspective: '600px', perspectiveOrigin: '50% 100%' }}
      >
        <div
          className="absolute inset-0 animate-[cyberGridScroll_4s_linear_infinite]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6,182,212,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(217,70,239,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            transform: 'rotateX(60deg)',
            transformOrigin: 'bottom center',
            willChange: 'background-position, transform',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#030712] to-transparent" />
        <style>{`
          @keyframes cyberGridScroll {
            0% { background-position: 0 0, 0 0; }
            100% { background-position: 0 48px, 0 0; }
          }
        `}</style>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                            */
/* ------------------------------------------------------------------ */

export function QuestsPage() {
  const [quests, setQuests] = useState(INITIAL_QUESTS);
  const [coins, setCoins] = useState(1480);
  const [xp, setXp] = useState(2450);
  const [unlockedCharacters, setUnlockedCharacters] = useState(['kai']);
  const [equippedCharacter, setEquippedCharacter] = useState('kai');

  const [selectedQuestId, setSelectedQuestId] = useState(null);
  const [showLocker, setShowLocker] = useState(false);
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [floatingReward, setFloatingReward] = useState(null);

  const [defeatingBossId, setDefeatingBossId] = useState(null);
  const [openingChestId, setOpeningChestId] = useState(null);

  // proof-of-work uploads, keyed by quest id — required before a quest can be completed
  const [proofByQuest, setProofByQuest] = useState({});

  // new quest form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newXp, setNewXp] = useState(100);
  const [newGold, setNewGold] = useState(50);
  const [newType, setNewType] = useState('standard');

  const nodeRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const fileInputRef = useRef(null);

  const selectedQuest = quests.find((q) => q.id === selectedQuestId) || null;
  const equippedDef = CHARACTERS.find((c) => c.id === equippedCharacter);
  const focusedQuest = quests.find((q) => q.status === 'focused') || null;

  /* ---------------------------- AUDIO FX ---------------------------- */

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window).webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq, duration = 0.15, type = 'square', delay = 0) => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.16, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      /* ignore */
    }
  };

  const playClickSound = () => playTone(440, 0.07, 'square');
  const playPurchaseSound = () => {
    playTone(660, 0.09, 'triangle');
    playTone(880, 0.12, 'triangle', 0.09);
  };
  const playClearSound = () => {
    playTone(523.25, 0.1, 'square');
    playTone(659.25, 0.1, 'square', 0.1);
    playTone(784, 0.2, 'square', 0.2);
  };
  const playUploadSound = () => playTone(320, 0.06, 'sine');

  /* -------------------------- CAMERA TRACKING ------------------------ */

  useEffect(() => {
    if (!focusedQuest) return;
    const node = nodeRefs.current[focusedQuest.id];
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }, [focusedQuest?.id]);

  /* --------------------------- CONFETTI ------------------------------ */

  const triggerConfetti = (big) => {
    confetti({ particleCount: big ? 220 : 140, spread: big ? 130 : 100, origin: { y: 0.6 }, colors: ['#f59e0b', '#ec4899', '#06b6d4', '#10b981', '#a855f7'] });
    confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#f59e0b', '#ec4899', '#06b6d4'] });
    confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#f59e0b', '#ec4899', '#06b6d4'] });
  };

  /* --------------------------- QUEST LOGIC ---------------------------- */

  const finalizeComplete = (quest) => {
    const xpGain = Math.round(quest.xpReward * equippedDef.xpMult);
    const goldGain = Math.round(quest.goldReward * equippedDef.goldMult);
    const boosted = equippedDef.xpMult > 1 || equippedDef.goldMult > 1;

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === quest.id) return { ...q, status: 'completed', stars: 3 };
        if (q.level === quest.level + 1 && q.status === 'locked') return { ...q, status: 'focused' };
        return q;
      })
    );
    setXp((prev) => prev + xpGain);
    setCoins((prev) => prev + goldGain);
    setFloatingReward({ id: Date.now(), xp: xpGain, gold: goldGain, boosted });
    triggerConfetti(quest.nodeType === 'boss');
    playClearSound();
    setSelectedQuestId(null);
  };

  // Gate: quest can only be completed if proof has been uploaded for it
  const handleCompleteClick = (quest) => {
    if (!proofByQuest[quest.id]) return; // safety guard, button is disabled anyway
    if (quest.nodeType === 'boss') {
      setDefeatingBossId(quest.id);
      return;
    }
    if (quest.nodeType === 'chest') {
      setOpeningChestId(quest.id);
      return;
    }
    finalizeComplete(quest);
  };

  const handleFocus = (quest) => {
    playClickSound();
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === quest.id) return { ...q, status: 'focused' };
        if (q.status === 'focused') return { ...q, status: 'locked' };
        return q;
      })
    );
    setSelectedQuestId(null);
  };

  const handleNodeClick = (quest) => {
    playClickSound();
    setSelectedQuestId((prev) => (prev === quest.id ? null : quest.id));
  };

  const handleProofUpload = (questId, file) => {
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith('image/');
    setProofByQuest((prev) => ({ ...prev, [questId]: { name: file.name, url, isImage } }));
    playUploadSound();
  };

  const clearProof = (questId) => {
    setProofByQuest((prev) => {
      const next = { ...prev };
      delete next[questId];
      return next;
    });
  };

  /* -------------------------- SHOP / LOCKER --------------------------- */

  const handlePurchase = (char) => {
    if (coins < char.price || unlockedCharacters.includes(char.id)) return;
    setCoins((prev) => prev - char.price);
    setUnlockedCharacters((prev) => [...prev, char.id]);
    playPurchaseSound();
  };

  const handleEquip = (char) => {
    if (!unlockedCharacters.includes(char.id)) return;
    setEquippedCharacter(char.id);
    playClickSound();
  };

  /* --------------------------- ADD QUEST ------------------------------ */

  const resetAddQuestForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewXp(100);
    setNewGold(50);
    setNewType('standard');
  };

  const handleAddQuest = () => {
    if (!newTitle.trim()) return;
    const nextLevel = quests.length + 1;
    const newQuest = {
      id: `q-${Date.now()}`,
      level: nextLevel,
      nodeType: newType,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      status: 'locked',
      xpReward: Math.max(10, Math.round(newXp)),
      goldReward: Math.max(5, Math.round(newGold)),
      stars: 0,
    };
    setQuests((prev) => [...prev, newQuest]);
    playPurchaseSound();
    resetAddQuestForm();
    setShowAddQuest(false);
  };

  /* ---------------------------- RENDER HELPERS ------------------------ */

  const totalHeight = topFor(quests.length) + 300;

  const renderEquippedAvatar = () => (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
      className="absolute -top-32 z-30 flex flex-col items-center pointer-events-none"
    >
      <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-red-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.9)] border border-white uppercase tracking-widest whitespace-nowrap mb-1">
        {equippedDef.name}
      </div>
      <div
        className="relative w-16 h-16 rounded-2xl bg-slate-950 border-2 border-white/40 flex items-center justify-center overflow-hidden shadow-[0_0_25px_var(--glow)]"
        style={{ ['--glow']: equippedDef.glow }}
      >
        <CharacterAvatar id={equippedCharacter} className="w-14 h-14" />
      </div>
      <div className="w-16 h-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full border border-white shadow-[0_6px_14px_rgba(245,158,11,0.8)] -mt-1" />
      <div className="w-10 h-2 bg-black/60 blur-[2px] rounded-full mt-1" />
    </motion.div>
  );

  const cardAlignClass = (leftPercent) =>
    leftPercent >= 70 ? 'right-0' : leftPercent <= 30 ? 'left-0' : 'left-1/2 -translate-x-1/2';

  /* ------------------------------ RENDER ------------------------------ */

  return (
    <div className="min-h-screen bg-[#030712] text-white p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-pink-500 selection:text-white">
      {/* GAMING ANIMATED BACKGROUND — canvas particle network + cyber grid + aurora orbs */}
      <GamingBackground />

      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#1e1b4b_0%,#030712_75%)] pointer-events-none" />
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-fuchsia-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] bg-cyan-500/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* AMBIENT SIDE FILLERS — LEFT */}
      <div className="hidden lg:flex flex-col gap-24 absolute left-[3%] top-44 z-0 pointer-events-none">
        <motion.div animate={{ y: [0, -14, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }} className="bg-gradient-to-tr from-fuchsia-500 to-purple-700 p-3 rounded-2xl shadow-[0_0_20px_rgba(217,70,239,0.5)] border border-fuchsia-300/50 opacity-70">
          <Gem className="w-7 h-7 text-fuchsia-100" />
        </motion.div>
        <motion.div animate={{ y: [0, 12, 0], x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.4 }} className="bg-slate-900/70 p-3 rounded-2xl border border-cyan-500/40 opacity-70">
          <Radar className="w-7 h-7 text-cyan-300" />
        </motion.div>
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut', delay: 0.8 }} className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700 opacity-50">
          <Cloud className="w-7 h-7 text-slate-400" />
        </motion.div>
      </div>

      {/* AMBIENT SIDE FILLERS — RIGHT */}
      <div className="hidden lg:flex flex-col gap-24 absolute right-[3%] top-56 z-0 pointer-events-none">
        <motion.div animate={{ y: [0, 14, 0] }} transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut' }} className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-3 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-300/50 opacity-70">
          <Sparkles className="w-7 h-7 text-cyan-200" />
        </motion.div>
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut', delay: 0.3 }} className="bg-gradient-to-tr from-amber-500 to-orange-500 p-3 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300/50 opacity-70">
          <Trophy className="w-7 h-7 text-yellow-100" />
        </motion.div>
        <motion.div animate={{ y: [0, 10, 0], x: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut', delay: 0.6 }} className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700 opacity-50">
          <Radar className="w-7 h-7 text-slate-400" />
        </motion.div>
      </div>

      {/* TOP HUD */}
      <div className="max-w-4xl mx-auto bg-slate-900/90 border-2 border-slate-800 p-3 sm:p-4 rounded-3xl backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-wrap items-center justify-between gap-3 mb-8 relative z-20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border-2 border-white/20 p-0.5 shadow-[0_0_20px_var(--glow)] overflow-hidden flex items-center justify-center" style={{ ['--glow']: equippedDef.glow }}>
              <CharacterAvatar id={equippedCharacter} className="w-11 h-11" />
            </div>
            <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400 absolute -top-2 -right-1 drop-shadow" />
          </div>
          <div>
            <h2 className="font-black text-sm text-white tracking-wide">{equippedDef.name}</h2>
            <p className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">{equippedDef.perkLabel}</p>
            <div className="w-28 sm:w-36 h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-0.5 mt-1">
              <motion.div initial={{ width: 0 }} animate={{ width: '68%' }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-cyan-500/30 px-3 py-1.5 rounded-2xl">
            <Zap className="w-4 h-4 text-cyan-300 fill-cyan-300" />
            <span className="text-cyan-300 font-black text-sm">{xp.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 border border-yellow-500/30 px-3 py-1.5 rounded-2xl">
            <motion.div animate={{ rotateY: [0, 360] }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
              <Coins className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </motion.div>
            <span className="text-yellow-400 font-black text-sm">{coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 border border-amber-500/30 px-3 py-1.5 rounded-2xl">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-amber-400 font-black text-sm">7</span>
          </div>
          <button
            onClick={() => { setShowLocker(true); playClickSound(); }}
            className="bg-gradient-to-b from-fuchsia-500 to-purple-700 hover:from-fuchsia-400 hover:to-purple-600 text-white font-black px-3 py-2 rounded-2xl border-b-4 border-purple-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-1.5 text-xs shadow-[0_5px_15px_rgba(168,85,247,0.4)]"
          >
            <ShoppingBag className="w-4 h-4" /> LOCKER
          </button>
          <button
            onClick={() => { setShowAddQuest(true); playClickSound(); }}
            className="bg-gradient-to-b from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black px-4 py-2 rounded-2xl border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-1 text-xs shadow-[0_5px_15px_rgba(245,158,11,0.4)]"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> QUEST
          </button>
        </div>
      </div>

      {/* FLOATING REWARD POPUP */}
      <AnimatePresence>
        {floatingReward && (
          <motion.div
            key={floatingReward.id}
            initial={{ opacity: 0, scale: 0.3, y: 50 }}
            animate={{ opacity: 1, scale: 1.2, y: -60 }}
            exit={{ opacity: 0, scale: 0.8, y: -170 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            onAnimationComplete={() => setFloatingReward(null)}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none flex flex-col items-center bg-slate-900/95 border-4 border-yellow-400 px-8 py-5 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.8)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black text-cyan-300 flex items-center gap-1">
                <Zap className="w-9 h-9 fill-cyan-300" /> +{floatingReward.xp} XP
              </span>
              <span className="text-4xl font-black text-yellow-400 flex items-center gap-1">
                <Coins className="w-9 h-9 fill-yellow-400" /> +{floatingReward.gold}
              </span>
            </div>
            <span className="text-xs font-black text-pink-400 tracking-widest uppercase mt-2 animate-pulse">
              {floatingReward.boosted ? 'CHARACTER BOOST ACTIVE!' : 'LEVEL CLEARED!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ISOMETRIC MAP VIEWPORT */}
      <div ref={scrollContainerRef} className="max-w-4xl mx-auto relative h-[680px] overflow-y-auto overflow-x-hidden rounded-[2.5rem] border-2 border-slate-800/60 bg-slate-950/30" style={{ perspective: '1600px' }}>
        <div className="relative" style={{ height: `${totalHeight}px`, transformStyle: 'preserve-3d' }}>
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(6,182,212,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(217,70,239,0.2) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
              transform: 'rotateX(40deg) rotateZ(-12deg) scale(1.4)',
              transformOrigin: 'center top',
            }}
          />

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox={`0 0 100 ${totalHeight}`} preserveAspectRatio="none">
            <path
              d={quests.map((_, i) => `${i === 0 ? 'M' : 'L'} ${hPosFor(i)} ${topFor(i)}`).join(' ')}
              fill="none" stroke="#0f172a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
            />
            <path
              d={quests.map((_, i) => `${i === 0 ? 'M' : 'L'} ${hPosFor(i)} ${topFor(i)}`).join(' ')}
              fill="none" stroke="url(#railGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" className="animate-pulse"
            />
            <defs>
              <linearGradient id="railGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          {quests.map((quest, index) => {
            const isFocused = quest.status === 'focused';
            const isCompleted = quest.status === 'completed';
            const isLocked = quest.status === 'locked';
            const isSelected = selectedQuest?.id === quest.id;
            const leftPercent = hPosFor(index);
            const topPx = topFor(index);
            const isBoss = quest.nodeType === 'boss';
            const isChest = quest.nodeType === 'chest';
            const isDefeating = defeatingBossId === quest.id;
            const isOpeningChest = openingChestId === quest.id;
            const proof = proofByQuest[quest.id];

            return (
              <div
                key={quest.id}
                ref={(el) => { nodeRefs.current[quest.id] = el; }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${leftPercent}%`, top: `${topPx}px`, zIndex: isSelected ? 40 : 10 }}
              >
                <div className="relative flex flex-col items-center">
                  {isFocused && renderEquippedAvatar()}

                  {isBoss && (
                    <div className="absolute -top-10 z-20 bg-gradient-to-r from-red-600 to-rose-800 text-white font-black text-[10px] px-3 py-0.5 rounded-full border border-red-300 uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.8)] flex items-center gap-1">
                      <Skull className="w-3 h-3" /> BOSS
                    </div>
                  )}
                  {isChest && (
                    <div className="absolute -top-10 z-20 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full border border-yellow-200 uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.8)] flex items-center gap-1">
                      <Gift className="w-3 h-3" /> LOOT
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    animate={isOpeningChest ? { rotate: [0, -14, 14, -8, 8, 0], scale: [1, 1.12, 1.05, 1.15, 1] } : {}}
                    transition={isOpeningChest ? { duration: 0.7 } : { type: 'spring' }}
                    onAnimationComplete={() => {
                      if (isOpeningChest) {
                        setOpeningChestId(null);
                        finalizeComplete(quest);
                      }
                    }}
                    onClick={() => handleNodeClick(quest)}
                    className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-200 border-b-[10px] active:border-b-2 active:translate-y-2 shadow-2xl ${
                      isCompleted
                        ? isBoss
                          ? 'bg-gradient-to-b from-rose-500 via-red-600 to-red-900 border-red-950 text-white shadow-[0_15px_30px_rgba(225,29,72,0.5)]'
                          : 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 border-emerald-950 text-white shadow-[0_15px_30px_rgba(16,185,129,0.5)]'
                        : isFocused
                        ? isBoss
                          ? 'bg-gradient-to-b from-red-500 via-rose-600 to-red-900 border-red-950 text-white shadow-[0_0_40px_rgba(220,38,38,0.9)] ring-4 ring-red-400'
                          : isChest
                          ? 'bg-gradient-to-b from-yellow-300 via-amber-500 to-yellow-700 border-yellow-950 text-white shadow-[0_0_40px_rgba(245,158,11,0.9)] ring-4 ring-yellow-300'
                          : 'bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-700 border-blue-950 text-white shadow-[0_0_40px_rgba(6,182,212,0.9)] ring-4 ring-cyan-300'
                        : 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-slate-950 text-slate-500 shadow-[0_15px_25px_rgba(0,0,0,0.8)]'
                    }`}
                  >
                    <div className="absolute inset-x-3 top-2 h-1/3 bg-white/20 rounded-t-[1.5rem] pointer-events-none" />
                    {isCompleted ? (
                      <div className="flex flex-col items-center">
                        {isBoss ? <Skull className="w-9 h-9 text-white drop-shadow" /> : isChest ? <Gift className="w-9 h-9 text-white drop-shadow" /> : <Check className="w-10 h-10 stroke-[3] text-white drop-shadow" />}
                        <div className="flex gap-0.5 mt-0.5">
                          {[...Array(3)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 drop-shadow" />)}
                        </div>
                      </div>
                    ) : isFocused ? (
                      isBoss ? <Skull className="w-11 h-11 text-white animate-pulse" /> : isChest ? <Gift className="w-11 h-11 text-slate-950 animate-pulse" /> : <Play className="w-11 h-11 text-slate-950 fill-slate-950 animate-pulse ml-1" />
                    ) : (
                      <Lock className="w-10 h-10 text-slate-400 drop-shadow" />
                    )}
                    <span className="text-[11px] font-black tracking-widest uppercase mt-0.5 drop-shadow-md">LVL {quest.level}</span>
                  </motion.button>

                  {isBoss && (
                    <div className="mt-2 w-24 sm:w-28 h-2.5 bg-slate-950 rounded-full border border-red-900/60 overflow-hidden">
                      <motion.div
                        key={isDefeating ? 'defeating' : isCompleted ? 'dead' : 'alive'}
                        initial={{ width: isCompleted ? '0%' : '100%' }}
                        animate={{ width: isDefeating ? '0%' : isCompleted ? '0%' : '100%' }}
                        transition={{ duration: isDefeating ? 0.9 : 0.3 }}
                        onAnimationComplete={() => {
                          if (isDefeating) { setDefeatingBossId(null); finalizeComplete(quest); }
                        }}
                        className={`h-full rounded-full ${isLocked ? 'bg-slate-700' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}
                      />
                    </div>
                  )}

                  <div className="mt-2.5 bg-slate-900/95 border-2 border-slate-800 px-3.5 py-1 rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.6)] backdrop-blur-md max-w-[150px] text-center border-b-4 border-b-slate-950">
                    <p className="text-xs font-black text-slate-200 truncate">{quest.title}</p>
                  </div>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 15 }}
                        className={`absolute top-40 z-50 w-72 sm:w-80 bg-slate-900/95 border-2 ${isBoss ? 'border-red-500' : isChest ? 'border-yellow-400' : 'border-cyan-400'} p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-left border-b-8 border-b-slate-950 ${cardAlignClass(leftPercent)}`}
                      >
                        <button onClick={() => setSelectedQuestId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-1 rounded-xl">
                          <X className="w-4 h-4" />
                        </button>

                        <div className="pr-6">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${isBoss ? 'text-red-300 bg-red-950 border-red-800' : isChest ? 'text-yellow-400 bg-amber-950 border-amber-800' : 'text-cyan-300 bg-cyan-950 border-cyan-800'}`}>
                            {isBoss ? 'BOSS BATTLE · 2X REWARDS' : isChest ? 'MYSTERY LOOT · LEVEL ' + quest.level : 'LEVEL ' + quest.level + ' QUEST'}
                          </span>
                          <h3 className="text-lg font-black text-white mt-1.5 leading-tight">{quest.title}</h3>
                        </div>

                        {quest.description && (
                          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800">{quest.description}</p>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs font-black text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 fill-cyan-300" /> +{Math.round(quest.xpReward * equippedDef.xpMult)} XP
                          </span>
                          <span className="text-xs font-black text-yellow-400 bg-yellow-950/80 border border-yellow-500/40 px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 fill-yellow-400" /> +{Math.round(quest.goldReward * equippedDef.goldMult)}
                          </span>
                        </div>

                        {/* PROOF UPLOAD — required before completion */}
                        {isFocused && !isDefeating && !isOpeningChest && (
                          <div className="mt-3 bg-slate-950 border border-dashed border-slate-700 rounded-xl p-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                              <ImagePlus className="w-3.5 h-3.5" /> Proof required to complete
                            </p>
                            {proof ? (
                              <div className="flex items-center gap-2">
                                {proof.isImage ? (
                                  <img src={proof.url} alt="proof" className="w-10 h-10 rounded-lg object-cover border border-emerald-500" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-emerald-500 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                  </div>
                                )}
                                <span className="text-[11px] text-emerald-400 font-bold truncate flex-1">{proof.name}</span>
                                <button onClick={() => clearProof(quest.id)} className="text-slate-500 hover:text-red-400">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs cursor-pointer border border-slate-700">
                                <Upload className="w-3.5 h-3.5" /> Upload photo/video proof
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleProofUpload(quest.id, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                          {isCompleted && (
                            <div className="flex-1 bg-slate-800 text-emerald-400 font-black py-2.5 px-3 rounded-xl border-2 border-emerald-900 text-xs flex items-center justify-center gap-1.5">
                              <Check className="w-4 h-4 stroke-[3]" />
                              {isBoss ? 'BOSS DEFEATED' : isChest ? 'CHEST OPENED' : 'COMPLETED'}
                            </div>
                          )}

                          {isFocused && (
                            <button
                              onClick={() => handleCompleteClick(quest)}
                              disabled={isDefeating || isOpeningChest || !proof}
                              className="flex-1 bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black py-2.5 px-3 rounded-xl border-b-4 border-emerald-950 active:border-b-0 active:translate-y-1 transition-all text-xs flex items-center justify-center gap-1 shadow-lg"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              {isBoss ? (isDefeating ? 'DEFEATING…' : 'COMPLETE RUN') : isChest ? (isOpeningChest ? 'OPENING…' : 'OPEN CHEST') : 'COMPLETE RUN'}
                            </button>
                          )}

                          {isLocked && (
                            <button
                              onClick={() => handleFocus(quest)}
                              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-2.5 px-3 rounded-xl border-2 border-slate-700 text-xs flex items-center justify-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" /> START QUEST
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHARACTER LOCKER MODAL */}
      <AnimatePresence>
        {showLocker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowLocker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-slate-900 border-2 border-fuchsia-500/40 rounded-[2rem] p-6 shadow-[0_0_80px_rgba(217,70,239,0.35)] max-h-[85vh] overflow-y-auto"
            >
              <button onClick={() => setShowLocker(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-xl z-10">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-6 h-6 text-fuchsia-400" />
                <h2 className="text-xl font-black text-white tracking-wide">CHARACTER LOCKER</h2>
              </div>
              <p className="text-xs text-slate-400 mb-5">Equip a runner to boost your XP and Gold rewards.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {CHARACTERS.map((char) => {
                  const owned = unlockedCharacters.includes(char.id);
                  const equipped = equippedCharacter === char.id;
                  const affordable = coins >= char.price;

                  return (
                    <div key={char.id} className={`relative rounded-2xl border-2 p-4 bg-slate-950/70 flex flex-col items-center text-center ${equipped ? 'border-yellow-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]' : 'border-slate-800'}`}>
                      {equipped && (
                        <span className="absolute -top-2.5 bg-yellow-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow">Equipped</span>
                      )}
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center border-2 border-white/20 shadow-[0_0_25px_var(--glow)] mb-2 overflow-hidden" style={{ ['--glow']: char.glow }}>
                        <CharacterAvatar id={char.id} className="w-14 h-14" />
                      </div>
                      <h3 className="font-black text-sm text-white">{char.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{char.tagline}</p>
                      <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wide mt-2 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded-lg">{char.perkLabel}</span>

                      <div className="mt-3 w-full">
                        {equipped ? (
                          <div className="w-full bg-slate-800 text-yellow-400 font-black py-2 rounded-xl border-2 border-yellow-900 text-xs">EQUIPPED</div>
                        ) : owned ? (
                          <button onClick={() => handleEquip(char)} className="w-full bg-gradient-to-b from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black py-2 rounded-xl border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 transition-all text-xs">
                            EQUIP CHARACTER
                          </button>
                        ) : affordable ? (
                          <button onClick={() => handlePurchase(char)} className="w-full bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-slate-950 font-black py-2 rounded-xl border-b-4 border-emerald-950 active:border-b-0 active:translate-y-1 transition-all text-xs flex items-center justify-center gap-1">
                            <Coins className="w-3.5 h-3.5" /> UNLOCK FOR {char.price} COINS
                          </button>
                        ) : (
                          <button disabled className="w-full bg-slate-800 text-slate-500 font-black py-2 rounded-xl border-2 border-slate-700 text-[10px] cursor-not-allowed leading-tight">
                            INSUFFICIENT COINS — COMPLETE MORE QUESTS!
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD NEW QUEST MODAL */}
      <AnimatePresence>
        {showAddQuest && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddQuest(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-[2rem] p-6 shadow-[0_0_80px_rgba(245,158,11,0.3)]"
            >
              <button onClick={() => setShowAddQuest(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-xl">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-black text-white tracking-wide">NEW QUEST</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Title</label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Finish resume draft"
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Description (optional)</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Details of the quest..."
                    rows={2}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">XP Reward</label>
                    <input
                      type="number"
                      min={10}
                      value={newXp}
                      onChange={(e) => setNewXp(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Gold Reward</label>
                    <input
                      type="number"
                      min={5}
                      value={newGold}
                      onChange={(e) => setNewGold(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Node Type</label>
                  <div className="flex gap-2 mt-1">
                    {(['standard', 'boss', 'chest']).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all ${
                          newType === t ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-slate-950 text-slate-400 border-slate-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddQuest}
                disabled={!newTitle.trim()}
                className="w-full mt-5 bg-gradient-to-b from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black py-3 rounded-xl border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> ADD QUEST TO MAP
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuestsPage;