import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { CoinTransaction, InventoryItem, ShopCategory } from '@/types/database';
import { 
  Backpack, Check, Coins, Crown, Gem, History, Shield, Sparkles, Wand2, 
  XCircle, Zap, Flame, ShieldAlert, PackageCheck 
} from 'lucide-react';

// 🔊 High-Energy Retro Arcade Sound Synthesizer
let inventoryAudioCtx: AudioContext | null = null;

const getInventoryAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!inventoryAudioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) inventoryAudioCtx = new AudioCtx();
  }
  if (inventoryAudioCtx && inventoryAudioCtx.state === 'suspended') {
    void inventoryAudioCtx.resume();
  }
  return inventoryAudioCtx;
};

const playInventorySFX = (type: 'click' | 'equip' | 'unequip' | 'error' | 'success') => {
  try {
    const ctx = getInventoryAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'equip') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.1, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.15);
      });
    } else if (type === 'unequip') {
      [880, 659.25, 440].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.09, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.12);
      });
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Fallback if Web Audio API fails
  }
};

// 🌟 Ambient Glow & Particle Canvas Overlay
function EquipmentGlowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = 600);
    const height = (canvas.height = 180);

    const particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speedY: -(Math.random() * 0.6 + 0.2),
      alpha: Math.random() * 0.7 + 0.3,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#a855f7';
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl opacity-40" />;
}

const categoryIcons: Record<ShopCategory, typeof Sparkles> = {
  accessory: Gem,
  outfit: Shield,
  effect: Wand2,
  character: Crown,
};

const rarityTheme = {
  common: {
    border: 'border-neutral-800 hover:border-neutral-700',
    bg: 'bg-neutral-900/80',
    badge: 'neutral',
    glow: 'shadow-none',
    text: 'text-neutral-300',
    accent: 'bg-neutral-800 text-neutral-300',
  },
  rare: {
    border: 'border-cyan-500/50 hover:border-cyan-400',
    bg: 'bg-gradient-to-b from-cyan-950/30 via-neutral-900 to-neutral-950',
    badge: 'primary',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
    text: 'text-cyan-300',
    accent: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
  },
  epic: {
    border: 'border-purple-500/60 hover:border-purple-400',
    bg: 'bg-gradient-to-b from-purple-950/40 via-neutral-900 to-neutral-950',
    badge: 'secondary',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.3)]',
    text: 'text-purple-300',
    accent: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
  },
  legendary: {
    border: 'border-amber-400/80 hover:border-yellow-300',
    bg: 'bg-gradient-to-b from-amber-950/50 via-neutral-900 to-neutral-950',
    badge: 'warning',
    glow: 'shadow-[0_0_35px_rgba(245,158,11,0.4)]',
    text: 'text-amber-300',
    accent: 'bg-amber-400/20 border-amber-400/50 text-amber-300',
  },
} as const;

interface ActionResult {
  success?: boolean;
  error?: string;
}

export function InventoryPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const triggerClick = () => {
    playInventorySFX('click');
  };

  const loadInventory = useCallback(async () => {
    if (!user) return;
    const [inventoryResult, transactionsResult] = await Promise.all([
      supabase.from('inventory_items').select('*, item:shop_items(*)').eq('user_id', user.id).order('purchased_at', { ascending: false }),
      supabase.from('coin_transactions').select('*').eq('user_id', user.id).eq('transaction_type', 'purchase').order('created_at', { ascending: false }).limit(8),
    ]);
    if (inventoryResult.error || transactionsResult.error) {
      setFeedback('Inventory could not be loaded right now.');
      playInventorySFX('error');
    } else {
      setInventory((inventoryResult.data ?? []) as InventoryItem[]);
      setTransactions((transactionsResult.data ?? []) as CoinTransaction[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const equipped = useMemo(() => inventory.filter((item) => item.equipped_at), [inventory]);

  const toggleEquip = async (entry: InventoryItem) => {
    triggerClick();
    setActionId(entry.id);
    setFeedback(null);
    const isEquipping = !entry.equipped_at;
    const action = isEquipping ? 'equip_inventory_item' : 'unequip_inventory_item';

    const { data, error } = await supabase.rpc(action, { p_inventory_id: entry.id });
    const result = data as unknown as ActionResult | null;

    if (error || result?.error) {
      setFeedback(error?.message ?? result?.error ?? 'Equipment change failed.');
      playInventorySFX('error');
    } else {
      setFeedback(isEquipping ? `${entry.item?.name ?? 'Item'} equipped successfully!` : `${entry.item?.name ?? 'Item'} unequipped.`);
      if (isEquipping) {
        playInventorySFX('equip');
      } else {
        playInventorySFX('unequip');
      }
      await loadInventory();
    }
    setActionId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in" onClick={triggerClick}>
      
      {/* 🚀 Hero Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-purple-950/40 p-6 rounded-3xl border-2 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-amber-400 border-2 border-yellow-400 flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.5)]">
            <Backpack className="w-7 h-7 text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-yellow-400 text-black font-black px-2.5 py-0.5 rounded-full border border-black shadow">
                EQUIPMENT VAULT
              </span>
              <span className="text-xs text-neutral-400 font-mono font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> ACTIVE LOADOUT
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-wide mt-1">
              INVENTORY & GEAR
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Customize your hero's appearance. One cosmetic item active per slot category.
            </p>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800 shadow-inner">
          <div className="text-right">
            <p className="text-[10px] text-neutral-400 font-black uppercase">TOTAL OWNED</p>
            <p className="text-lg font-black text-white font-mono">{inventory.length} ITEMS</p>
          </div>
          <div className="w-px h-8 bg-neutral-800" />
          <div className="text-left">
            <p className="text-[10px] text-purple-400 font-black uppercase">EQUIPPED NOW</p>
            <p className="text-lg font-black text-purple-300 font-mono">{equipped.length} SLOTS</p>
          </div>
        </div>
      </div>

      {/* ⚠️ Feedback Notification Bar */}
      {feedback && (
        <div className="rounded-2xl border-2 border-purple-500/40 bg-purple-950/40 px-5 py-3.5 text-sm font-bold text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-3 animate-in fade-in duration-200">
          <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 🛡️ Equipped Now Loadout Section */}
      <Card className="relative overflow-hidden border-2 border-purple-500/30 bg-neutral-900/90 shadow-[0_0_25px_rgba(168,85,247,0.15)] rounded-3xl">
        <EquipmentGlowCanvas />
        <CardHeader
          title="Equipped Loadout"
          subtitle={`${equipped.length} active cosmetic item${equipped.length === 1 ? '' : 's'} powering your avatar`}
          icon={<Crown className="w-5 h-5 text-yellow-400" />}
        />
        <div className="relative z-10 p-4 pt-0">
          {equipped.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-950/60 p-8 text-center">
              <ShieldAlert className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
              <p className="text-sm font-bold text-neutral-300">No gear currently equipped.</p>
              <p className="text-xs text-neutral-500 mt-1">Select owned items from your vault below to deck out your avatar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {equipped.map((entry) => {
                const item = entry.item;
                if (!item) return null;
                const Icon = categoryIcons[item.category];
                const theme = rarityTheme[item.rarity];

                return (
                  <div
                    key={entry.id}
                    className={`relative p-3.5 rounded-2xl border-2 bg-neutral-950/90 ${theme.border} ${theme.glow} flex items-center justify-between gap-3 group`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 border border-purple-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.5)]">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-xs text-white truncate">{item.name}</p>
                        <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={actionId === entry.id}
                      onClick={() => void toggleEquip(entry)}
                      className="border-red-500/40 text-red-400 hover:bg-red-950/50 hover:text-red-300 shrink-0 text-xs px-2.5 py-1"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Unequip
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* 🎒 Owned Inventory Grid */}
      <Card className="border-2 border-neutral-800 bg-neutral-900/90 rounded-3xl">
        <CardHeader
          title="Owned Vault"
          subtitle={`${inventory.length} item${inventory.length === 1 ? '' : 's'} available in your inventory`}
          icon={<PackageCheck className="w-5 h-5 text-cyan-400" />}
        />
        <div className="p-4 pt-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((val) => (
                <div key={val} className="h-36 rounded-2xl bg-neutral-800/40 animate-pulse border border-neutral-800" />
              ))}
            </div>
          ) : inventory.length === 0 ? (
            <div className="py-12 text-center bg-neutral-950/40 rounded-2xl border border-neutral-800">
              <Backpack className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
              <p className="text-base font-black text-neutral-300">Your inventory vault is completely empty.</p>
              <p className="text-xs text-neutral-500 mt-1">Visit the Shop to acquire cosmetic titles, outfits, and effects!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((entry) => {
                const item = entry.item;
                if (!item) return null;
                const Icon = categoryIcons[item.category];
                const theme = rarityTheme[item.rarity];
                const isEquipped = Boolean(entry.equipped_at);

                return (
                  <div
                    key={entry.id}
                    className={`relative rounded-2xl border-2 p-4 transition-all duration-200 group flex flex-col justify-between ${
                      isEquipped
                        ? 'border-purple-500/80 bg-gradient-to-b from-purple-950/40 via-neutral-900 to-neutral-950 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : `${theme.border} ${theme.bg} ${theme.glow}`
                    }`}
                  >
                    {/* Top Info Bar */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${
                              isEquipped
                                ? 'bg-purple-600 border-yellow-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.8)]'
                                : 'bg-neutral-800 border-neutral-700 text-primary-300'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-sm text-white group-hover:text-yellow-300 transition-colors">
                              {item.name}
                            </p>
                            <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <Badge color={theme.badge} size="sm">
                          {item.rarity}
                        </Badge>
                      </div>

                      <p className="text-xs text-neutral-400 line-clamp-2 min-h-[32px]">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Action Section */}
                    <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                      {isEquipped ? (
                        <div className="flex items-center gap-1.5 text-xs font-black text-purple-300">
                          <Flame className="w-4 h-4 text-yellow-400 animate-pulse" /> EQUIPPED NOW
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-neutral-500 font-bold uppercase">READY TO EQUIP</div>
                      )}

                      <Button
                        size="sm"
                        variant={isEquipped ? 'outline' : 'secondary'}
                        loading={actionId === entry.id}
                        onClick={() => void toggleEquip(entry)}
                        className={`text-xs font-black transition-all ${
                          isEquipped
                            ? 'border-purple-500/50 hover:border-purple-400 text-purple-300'
                            : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-2 border-black font-black hover:brightness-110 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" /> Unequip
                          </>
                        ) : (
                          'Equip Item'
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* 📜 Purchase History Ledger */}
      <Card className="border-2 border-neutral-800 bg-neutral-900/90 rounded-3xl">
        <CardHeader
          title="Transaction Vault"
          subtitle="Recent item acquisitions and shop purchase history"
          icon={<History className="w-5 h-5 text-amber-400" />}
        />
        <div className="p-4 pt-0">
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-xs font-mono text-neutral-500">
              NO TRANSACTION HISTORY RECORDED YET.
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-950/70 border border-neutral-800 px-4 py-3 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0">
                      <Coins className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-neutral-100 truncate">
                        {String(transaction.metadata.item_name ?? 'Shop Item Purchase')}
                      </p>
                      <p className="text-[10px] font-mono text-neutral-500">
                        {new Intl.DateTimeFormat(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(transaction.created_at))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-xs font-black text-amber-300 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-xl">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    -{transaction.amount.toLocaleString()} GOLD
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}