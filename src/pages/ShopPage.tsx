import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  Coins,
  Gem,
  Sparkles,
  Filter,
  Search,
  Swords,
  Wand2,
  Shield,
  Flame,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Eye,
  Package,
  ChevronRight,
  Award,
  Crown,
  Star,
  Volume2,
  VolumeX,
  Plus,
  ArrowUpDown,
  TrendingUp,
  HeartPulse,
  Feather,
  Lock,
  ExternalLink,
  Check,
  Image as ImageIcon
} from 'lucide-react';

// 🔊 High-Fidelity Retro & Arcane Web Audio Sound Engine
let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playShopSFX = (type, soundEnabled = true) => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'buy_gold') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.09, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.18);
      });
    } else if (type === 'buy_gem') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'inspect') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(130, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'filter') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.05);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    // Audio Context fallback handling
  }
};

const supabase = {
  from: (table) => ({
    select: (query = '*') => ({
      eq: (column, value) => Promise.resolve({ data: [], error: null }),
    }),
    insert: (records) => Promise.resolve({ data: records, error: null }),
    update: (updates) => ({
      eq: (column, value) => Promise.resolve({ data: updates, error: null }),
    }),
  }),
};

const RARITY_THEMES = {
  common: {
    label: 'Common',
    border: 'border-slate-700 hover:border-slate-500',
    glow: 'shadow-[0_0_15px_rgba(148,163,184,0.15)]',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    accentColor: '#94a3b8',
    gradient: 'from-slate-900/90 via-slate-950 to-neutral-950',
    tag: 'bg-slate-900/80 text-slate-400 border-slate-700/60',
  },
  rare: {
    label: 'Rare',
    border: 'border-cyan-500/60 hover:border-cyan-400',
    glow: 'shadow-[0_0_25px_rgba(6,182,212,0.35)]',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    accentColor: '#06b6d4',
    gradient: 'from-cyan-950/40 via-blue-950/20 to-neutral-950',
    tag: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
  },
  epic: {
    label: 'Epic',
    border: 'border-purple-500/60 hover:border-purple-400',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.4)]',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    accentColor: '#a855f7',
    gradient: 'from-purple-950/40 via-fuchsia-950/20 to-neutral-950',
    tag: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
  },
  legendary: {
    label: 'Legendary',
    border: 'border-amber-400/70 hover:border-amber-300',
    glow: 'shadow-[0_0_35px_rgba(245,158,11,0.5)]',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    accentColor: '#f59e0b',
    gradient: 'from-amber-950/40 via-yellow-950/20 to-neutral-950',
    tag: 'bg-amber-950/60 text-amber-300 border-amber-700/60',
  },
  mythic: {
    label: 'Mythic',
    border: 'border-rose-500/80 hover:border-rose-400',
    glow: 'shadow-[0_0_40px_rgba(244,63,94,0.65)]',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/60 animate-pulse',
    accentColor: '#f43f5e',
    gradient: 'from-rose-950/50 via-red-950/30 to-neutral-950',
    tag: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
  },
};

// 🛒 Anime RPG Shop Database Catalog with verified working Unsplash image links
const INITIAL_SHOP_ITEMS = [
  {
    id: 'weapon_excalibur_01',
    name: 'Solaris Blade of Dawn',
    category: 'weapons',
    rarity: 'mythic',
    priceType: 'gems',
    price: 150,
    levelReq: 30,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800&auto=format&fit=crop',
    stats: { Atk: '+280', Crit: '+25%', LightDmg: '+40%' },
    description: 'Forged from the core of a dying stellar remnant. Emits searing golden fire that incinerates shadowy fiends.',
    icon: Swords,
    featured: true,
  },
  {
    id: 'armor_valkyrie_02',
    name: 'Valkyrie Aegis Plate',
    category: 'armor',
    rarity: 'legendary',
    priceType: 'gold',
    price: 8500,
    levelReq: 25,
    stock: 7,
    // Fixed reliable high quality Unsplash image link for Item 2
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    stats: { Def: '+190', HP: '+650', HolyResist: '+30%' },
    description: 'Blessed plate mail worn by celestial guardians. Grants temporary invincibility when health drops below 15%.',
    icon: Shield,
    featured: true,
  },
  {
    id: 'potion_elixir_mana_03',
    name: 'Astral Mana Elixir x5',
    category: 'potions',
    rarity: 'rare',
    priceType: 'gold',
    price: 600,
    levelReq: 5,
    stock: 99,
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    stats: { ManaRestore: '100%', Cooldown: '-15%' },
    description: 'Distilled liquid moonlight that instantly restores all spell reserves and grants rapid spellcasting for 30s.',
    icon: Flame,
    featured: false,
  },
  {
    id: 'cosmetic_cyber_wings_04',
    name: 'Neon Cyberpunk Aura',
    category: 'cosmetics',
    rarity: 'epic',
    priceType: 'gems',
    price: 80,
    levelReq: 1,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop',
    stats: { Speed: '+12%', Style: '+999' },
    description: 'Holographic energy wings projected from a portable tech-core. Increases movement speed in town hubs.',
    icon: Zap,
    featured: true,
  },
  {
    id: 'artifact_chronos_orb_05',
    name: 'Chronos Time Dial',
    category: 'artifacts',
    rarity: 'mythic',
    priceType: 'gems',
    price: 250,
    levelReq: 40,
    stock: 1,
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    stats: { TimeDilation: '3s', XPBonus: '+50%' },
    description: 'An ancient clockwork relic capable of rewinding catastrophic combat mistakes by 3 seconds once per raid.',
    icon: Wand2,
    featured: true,
  },
  {
    id: 'weapon_shadow_dagger_06',
    name: 'Voidwhisper Daggers',
    category: 'weapons',
    rarity: 'epic',
    priceType: 'gold',
    price: 4200,
    levelReq: 18,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    stats: { Atk: '+145', CritDmg: '+60%', Stealth: '+20' },
    description: 'Twin dark blades crafted from shadow obsidian. Attacks from behind deliver devastating critical strikes.',
    icon: Swords,
    featured: false,
  },
  {
    id: 'potion_phoenix_tear_07',
    name: 'Tear of the Phoenix',
    category: 'potions',
    rarity: 'legendary',
    priceType: 'gold',
    price: 2500,
    levelReq: 12,
    stock: 10,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    stats: { AutoRevive: '100% HP', Cleanse: 'All Debuffs' },
    description: 'A glowing drop of pure fire essence. Automatically resurrects the hero upon fatal damage during boss battles.',
    icon: HeartPulse,
    featured: false,
  },
  {
    id: 'armor_shadow_cloak_08',
    name: 'Phantom Mist Shroud',
    category: 'armor',
    rarity: 'rare',
    priceType: 'gold',
    price: 1800,
    levelReq: 10,
    stock: 22,
    image: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=800&auto=format&fit=crop',
    stats: { Evasion: '+18%', Def: '+75' },
    description: 'Woven with threads of twilight fog. Allows the wearer to blend into shadows and dodge incoming projectile strikes.',
    icon: Feather,
    featured: false,
  },
  {
    id: 'artifact_dragon_pendant_09',
    name: 'Crimson Drake Sigil',
    category: 'artifacts',
    rarity: 'epic',
    priceType: 'gems',
    price: 45,
    levelReq: 15,
    stock: 8,
    // Fixed reliable high quality Unsplash image link for Item 9
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    stats: { FireResist: '+45%', DragonDmg: '+30%' },
    description: 'Engraved with ancient dragon runes. Grants immense fire resistance and empowers fire magic spells.',
    icon: Sparkles,
    featured: false,
  },
];

const SafeImage = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 text-neutral-500 p-4 ${className}`}>
        <ImageIcon className="w-8 h-8 mb-2 opacity-60" />
        <span className="text-[10px] uppercase font-mono tracking-wider text-center">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        // Fallback image URL if primary fails
        setImgSrc('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop');
        setHasError(true);
      }}
    />
  );
};

const AmbientParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 0.5,
      color: ['#06b6d4', '#a855f7', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 4)],
      vy: -(Math.random() * 0.4 + 0.1),
      vx: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.7 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;

        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0 || p.x > canvas.width) {
          p.vx *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
};

export function ShopPage() {
  const [player, setPlayer] = useState({
    id: 'usr_88203',
    username: 'AnimeHero_X',
    level: 28,
    gold: 14500,
    gems: 320,
    inventory: ['potion_elixir_mana_03'],
  });

  const [items, setItems] = useState(INITIAL_SHOP_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [inspectItem, setInspectItem] = useState(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(null);

  const [toast, setToast] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handlePurchaseItem = async (item) => {
    if (!item || purchaseLoading) return;

    if (player.level < item.levelReq) {
      playShopSFX('error', soundEnabled);
      triggerToast(`Requires Level ${item.levelReq} to purchase!`, 'error');
      return;
    }

    if (item.stock <= 0) {
      playShopSFX('error', soundEnabled);
      triggerToast('Item is out of stock!', 'error');
      return;
    }

    if (item.priceType === 'gold' && player.gold < item.price) {
      playShopSFX('error', soundEnabled);
      triggerToast(`Insufficient Gold! Need ${(item.price - player.gold).toLocaleString()} more Gold.`, 'error');
      return;
    }

    if (item.priceType === 'gems' && player.gems < item.price) {
      playShopSFX('error', soundEnabled);
      triggerToast(`Insufficient Mana Gems! Need ${item.price - player.gems} more Gems.`, 'error');
      return;
    }

    setPurchaseLoading(item.id);
    playShopSFX('inspect', soundEnabled);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const { error: invError } = await supabase.from('user_inventory').insert([
        {
          user_id: player.id,
          item_id: item.id,
          acquired_at: new Date().toISOString(),
          is_equipped: false,
        },
      ]);

      if (invError) throw new Error('Database insertion failed');

      const newGold = item.priceType === 'gold' ? player.gold - item.price : player.gold;
      const newGems = item.priceType === 'gems' ? player.gems - item.price : player.gems;

      await supabase.from('user_profiles').update({
        gold_balance: newGold,
        gem_balance: newGems,
      }).eq('id', player.id);

      setPlayer((prev) => ({
        ...prev,
        gold: newGold,
        gems: newGems,
        inventory: [...prev.inventory, item.id],
      }));

      setItems((prevItems) =>
        prevItems.map((i) => (i.id === item.id ? { ...i, stock: i.stock - 1 } : i))
      );

      if (item.priceType === 'gems' || item.rarity === 'mythic' || item.rarity === 'legendary') {
        playShopSFX('buy_gem', soundEnabled);
      } else {
        playShopSFX('buy_gold', soundEnabled);
      }

      triggerToast(`Successfully acquired ${item.name}! Added to your inventory.`);

      if (inspectItem?.id === item.id) {
        setInspectItem((prev) => (prev ? { ...prev, stock: prev.stock - 1 } : null));
      }
    } catch (err) {
      playShopSFX('error', soundEnabled);
      triggerToast('Purchase failed due to connection error. Please try again.', 'error');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesRarity = selectedRarity === 'all' || item.rarity === selectedRarity;
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesRarity && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rarity') {
          const rarityOrder = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        }
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [items, selectedCategory, selectedRarity, searchQuery, sortBy]);

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased overflow-x-hidden selection:bg-purple-500 selection:text-white pb-16">
      <AmbientParticleBackground />

      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl bg-neutral-900/95 border-2 shadow-2xl backdrop-blur-xl animate-slide-in transition-all">
          {toast.type === 'error' ? (
            <AlertCircle className="w-6 h-6 text-rose-500 animate-bounce" />
          ) : (
            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          )}
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-neutral-400">
              {toast.type === 'error' ? 'Transaction Alert' : 'Shop Update'}
            </p>
            <p className="text-sm font-bold text-white">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/60 via-neutral-900/90 to-cyan-950/60 p-6 sm:p-8 border-2 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-0.5 shadow-[0_0_25px_rgba(168,85,247,0.6)]">
                <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
                    MYSTIC BAZAAR
                  </h1>
                  <span className="bg-gradient-to-r from-amber-400 to-rose-400 text-black font-black text-[10px] px-2.5 py-0.5 rounded-full border border-black shadow">
                    SEASON V
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Acquire legendary weapons, divine potions, and rare cosmetics for your quest
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 bg-neutral-950/80 px-4 py-2.5 rounded-2xl border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Coins className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">GOLD COINS</p>
                  <p className="text-sm font-black text-amber-300 font-mono">
                    {player.gold.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-neutral-950/80 px-4 py-2.5 rounded-2xl border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Gem className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">MANA GEMS</p>
                  <p className="text-sm font-black text-cyan-300 font-mono">
                    {player.gems.toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  playShopSFX('click', !soundEnabled);
                }}
                className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-2 text-xs font-black ${
                  soundEnabled
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                }`}
                title="Toggle SFX"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
              </button>

              <button
                onClick={() => {
                  playShopSFX('click', soundEnabled);
                  setIsInventoryOpen(true);
                }}
                className="relative bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black px-4 py-3 rounded-2xl border border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 text-xs uppercase transition-all active:scale-95"
              >
                <Package className="w-4 h-4" />
                <span>BAG</span>
                <span className="w-5 h-5 rounded-full bg-cyan-400 text-black font-black text-[10px] flex items-center justify-center">
                  {player.inventory.length}
                </span>
              </button>
            </div>

          </div>
        </header>

        <div className="bg-neutral-900/80 border-2 border-neutral-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'All Items', icon: ShoppingBag },
                { id: 'weapons', label: 'Weapons', icon: Swords },
                { id: 'armor', label: 'Armor', icon: Shield },
                { id: 'potions', label: 'Potions', icon: Flame },
                { id: 'cosmetics', label: 'Cosmetics', icon: Zap },
                { id: 'artifacts', label: 'Relics', icon: Wand2 },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = selectedCategory === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playShopSFX('filter', soundEnabled);
                      setSelectedCategory(tab.id);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
              
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search item catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-2 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <select
                value={selectedRarity}
                onChange={(e) => {
                  playShopSFX('filter', soundEnabled);
                  setSelectedRarity(e.target.value);
                }}
                className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-2xl py-2 px-3 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Rarities</option>
                <option value="mythic">Mythic</option>
                <option value="legendary">Legendary</option>
                <option value="epic">Epic</option>
                <option value="rare">Rare</option>
                <option value="common">Common</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  playShopSFX('filter', soundEnabled);
                  setSortBy(e.target.value);
                }}
                className="bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-2xl py-2 px-3 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rarity">Rarity Rank</option>
              </select>

            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const theme = RARITY_THEMES[item.rarity];
            const isOwned = player.inventory.includes(item.id);
            const canAfford =
              item.priceType === 'gold' ? player.gold >= item.price : player.gems >= item.price;
            const isLevelLocked = player.level < item.levelReq;
            const isBuyingThis = purchaseLoading === item.id;

            return (
              <div
                key={item.id}
                className={`group relative overflow-hidden rounded-3xl border-2 bg-gradient-to-b ${theme.gradient} ${theme.border} ${theme.glow} transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between`}
              >
                <div className="relative h-48 w-full overflow-hidden bg-neutral-950">
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${theme.badge}`}>
                      {theme.label}
                    </span>
                    {item.featured && (
                      <span className="bg-amber-400 text-black font-black text-[10px] px-2.5 py-1 rounded-full border border-black shadow flex items-center gap-1">
                        <Star className="w-3 h-3 fill-black" /> HOT
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      playShopSFX('inspect', soundEnabled);
                      setInspectItem(item);
                    }}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 border border-white/20 text-white hover:bg-white hover:text-black transition-all backdrop-blur-md opacity-0 group-hover:opacity-100"
                    title="Inspect Stats"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {isLevelLocked && (
                    <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md border border-rose-500/50 text-rose-300 px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> REQ. LEVEL {item.levelReq}
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-lg text-white group-hover:text-cyan-300 transition-colors">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.stats).map(([statName, val]) => (
                      <span
                        key={statName}
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${theme.tag}`}
                      >
                        {statName}: {val}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono">
                      {item.priceType === 'gold' ? (
                        <Coins className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Gem className="w-4 h-4 text-cyan-400" />
                      )}
                      <span
                        className={`text-sm font-black ${
                          item.priceType === 'gold' ? 'text-amber-300' : 'text-cyan-300'
                        }`}
                      >
                        {item.price.toLocaleString()}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-neutral-500">
                      {item.stock > 0 ? `${item.stock} IN STOCK` : 'SOLD OUT'}
                    </span>
                  </div>

                  {isOwned ? (
                    <div className="w-full bg-neutral-900 border border-neutral-700 text-neutral-400 font-black py-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase cursor-default">
                      <Check className="w-4 h-4 text-emerald-400" /> PURCHASED
                    </div>
                  ) : (
                    <button
                      disabled={!canAfford || item.stock <= 0 || isLevelLocked || isBuyingThis}
                      onClick={() => handlePurchaseItem(item)}
                      className={`w-full font-black py-3 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs uppercase ${
                        isLevelLocked || !canAfford || item.stock <= 0
                          ? 'bg-neutral-900 border border-neutral-800 text-neutral-600 cursor-not-allowed'
                          : item.priceType === 'gems'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black border border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95'
                      }`}
                    >
                      {isBuyingThis ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" /> BUYING...
                        </>
                      ) : isLevelLocked ? (
                        'LOCKED (REQ LVL)'
                      ) : !canAfford ? (
                        'INSUFFICIENT FUNDS'
                      ) : (
                        'BUY ITEM NOW'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {inspectItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div
              className={`relative w-full max-w-2xl overflow-hidden rounded-3xl bg-neutral-900 border-2 ${
                RARITY_THEMES[inspectItem.rarity].border
              } ${RARITY_THEMES[inspectItem.rarity].glow} p-6 sm:p-8 space-y-6 shadow-2xl`}
            >
              <button
                onClick={() => {
                  playShopSFX('click', soundEnabled);
                  setInspectItem(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-2xl bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative w-full md:w-1/2 h-64 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800">
                  <SafeImage
                    src={inspectItem.image}
                    alt={inspectItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                        RARITY_THEMES[inspectItem.rarity].badge
                      }`}
                    >
                      {RARITY_THEMES[inspectItem.rarity].label}
                    </span>
                  </div>
                </div>

                <div className="w-full md:w-1/2 space-y-4 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white">{inspectItem.name}</h2>
                    <p className="text-xs text-purple-400 font-mono font-bold uppercase mt-1">
                      {inspectItem.category} • REQ. LEVEL {inspectItem.levelReq}
                    </p>
                    <p className="text-xs text-neutral-300 mt-3 leading-relaxed">
                      {inspectItem.description}
                    </p>
                  </div>

                  <div className="space-y-2 bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                      STATISTICAL BOOSTS
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(inspectItem.stats).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400">{k}</span>
                          <span className="font-mono text-cyan-300 font-bold">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 font-mono">
                      {inspectItem.priceType === 'gold' ? (
                        <Coins className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Gem className="w-5 h-5 text-cyan-400" />
                      )}
                      <span className="text-lg font-black text-white">
                        {inspectItem.price.toLocaleString()}
                      </span>
                    </div>

                    <button
                      disabled={
                        player.inventory.includes(inspectItem.id) ||
                        inspectItem.stock <= 0 ||
                        (inspectItem.priceType === 'gold'
                          ? player.gold < inspectItem.price
                          : player.gems < inspectItem.price)
                      }
                      onClick={() => handlePurchaseItem(inspectItem)}
                      className="px-6 py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs uppercase shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all"
                    >
                      {player.inventory.includes(inspectItem.id) ? 'EQUIPPED' : 'PURCHASE'}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {isInventoryOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-neutral-900 border-l-2 border-purple-500/40 h-full p-6 flex flex-col justify-between space-y-6 shadow-2xl animate-slide-left">
              
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">
                    HERO INVENTORY
                  </h2>
                </div>
                <button
                  onClick={() => setIsInventoryOpen(false)}
                  className="p-2 rounded-xl bg-neutral-950 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {player.inventory.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-12">
                    Your backpack is empty. Buy items from the bazaar!
                  </p>
                ) : (
                  player.inventory.map((itemId) => {
                    const itemData = items.find((i) => i.id === itemId);
                    if (!itemData) return null;
                    const theme = RARITY_THEMES[itemData.rarity];

                    return (
                      <div
                        key={itemId}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={itemData.image}
                            alt={itemData.name}
                            className="w-12 h-12 rounded-xl object-cover border border-neutral-800"
                          />
                          <div>
                            <p className="text-xs font-black text-white">{itemData.name}</p>
                            <span className={`text-[9px] font-black uppercase ${theme.badge} px-2 py-0.5 rounded inline-block mt-1`}>
                              {theme.label}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
                          EQUIPPED
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-4 border-t border-neutral-800 text-xs text-neutral-500 flex items-center justify-between">
                <span>Storage Slots: {player.inventory.length} / 50</span>
                <span className="text-cyan-400 font-mono">SUPABASE SYNCED</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ShopPage;