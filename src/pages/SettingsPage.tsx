import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  LogOut,
  Bell,
  Palette,
  Shield,
  Award,
  Check,
  Swords,
  Sparkles,
  Zap,
  Flame,
  Crown,
  KeyRound,
  Sliders,
  CheckCircle2,
  Crosshair,
  Heart,
  Compass,
  Wand2,
  Volume2,
  VolumeX,
  Target,
  Sun,
  Feather,
  BookOpen,
} from 'lucide-react';

// 🔊 Web Audio API Retro Sound Effects Engine
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

const playSFX = (type, soundEnabled = true) => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'equip') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'upgrade') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.06, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.15);
      });
    } else if (type === 'save') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'logout') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    // Audio context fallback
  }
};

// 🎨 High-Definition 3D Anime Character Artwork & Meta
const CHARACTER_CLASSES = {
  warrior: {
    id: 'warrior',
    label: 'Warrior',
    primaryAttribute: 'Strength',
    description: 'Masters of melee combat and heavy armor. High vitality and brutal physical strikes.',
    icon: Swords,
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    color: 'from-red-600/40 via-orange-600/20 to-neutral-950',
    aura: 'shadow-[0_0_35px_rgba(239,68,68,0.5)] border-red-500',
    badge: 'bg-red-500 text-white',
    badgeText: 'STRENGTH',
  },
  mage: {
    id: 'mage',
    label: 'Mage',
    primaryAttribute: 'Intelligence',
    description: 'Wielders of arcane energy and elemental spells. Destructive range with vast mana reserves.',
    icon: Wand2,
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    color: 'from-cyan-500/40 via-blue-600/20 to-neutral-950',
    aura: 'shadow-[0_0_35px_rgba(6,182,212,0.5)] border-cyan-400',
    badge: 'bg-cyan-400 text-black',
    badgeText: 'INTELLIGENCE',
  },
  rogue: {
    id: 'rogue',
    label: 'Rogue',
    primaryAttribute: 'Agility',
    description: 'Silent deadly assassins specializing in swift critical attacks and shadowy evasion.',
    icon: Crosshair,
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800&auto=format&fit=crop',
    color: 'from-purple-600/40 via-indigo-600/20 to-neutral-950',
    aura: 'shadow-[0_0_35px_rgba(168,85,247,0.5)] border-purple-500',
    badge: 'bg-purple-500 text-white',
    badgeText: 'AGILITY',
  },
  ranger: {
    id: 'ranger',
    label: 'Ranger',
    primaryAttribute: 'Dexterity',
    description: 'Sharpshooters of the wild mist. Exceptional precision, animal bond, and long-range lethality.',
    icon: Target,
    // 🌟 Brand New High-Res Anime Ranger Artwork
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    color: 'from-emerald-600/40 via-lime-600/20 to-neutral-950',
    aura: 'shadow-[0_0_35px_rgba(16,185,129,0.55)] border-emerald-400',
    badge: 'bg-emerald-400 text-black',
    badgeText: 'DEXTERITY',
  },
  cleric: {
    id: 'cleric',
    label: 'Cleric',
    primaryAttribute: 'Wisdom',
    description: 'Blessed conduits of radiant light. Master healers who buffer allies and purge shadow corruptions.',
    icon: Heart,
    // 🌟 Brand New High-Res Anime Cleric/Holy Priestess Artwork
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    color: 'from-pink-500/40 via-rose-600/20 to-neutral-950',
    aura: 'shadow-[0_0_35px_rgba(236,72,153,0.55)] border-pink-400',
    badge: 'bg-pink-400 text-black',
    badgeText: 'WISDOM',
  },
  scholar: {
    id: 'scholar',
    label: 'Scholar',
    primaryAttribute: 'Knowledge',
    description: 'Strategists of ancient lore. Boosts party experience gain, item discovery, and tactical insights.',
    icon: BookOpen,
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800&auto=format&fit=crop',
    color: 'from-teal-500/40 via-emerald-600/20 to-neutral-950',
    aura: 'shadow-[0_0_35px_rgba(20,184,166,0.5)] border-teal-400',
    badge: 'bg-teal-400 text-black',
    badgeText: 'KNOWLEDGE',
  },
  paladin: {
    id: 'paladin',
    label: 'Paladin',
    primaryAttribute: 'Charisma',
    description: 'Holy guardians wearing golden armor. Unshakable defense with divine radiant damage.',
    icon: Sun,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop',
    color: 'from-yellow-500/40 via-amber-600/20 to-neutral-950',
    aura: 'shadow-[0_0_35px_rgba(245,158,11,0.5)] border-amber-400',
    badge: 'bg-amber-400 text-black',
    badgeText: 'CHARISMA',
  },
};

const ALL_TITLES = [
  { title: 'Novice Adventurer', requirement: 'Complete account setup' },
  { title: 'Shadow Hunter', requirement: 'Complete 10 Rogue daily quests' },
  { title: 'Archmage of the Tower', requirement: 'Reach Level 25 Mage rank' },
  { title: 'Forest Warden', requirement: 'Master 15 Ranger bow challenges' },
  { title: 'Divine Healer', requirement: 'Restore 1,000 HP as Cleric' },
  { title: 'Vanguard Champion', requirement: 'Achieve a 30-day streak' },
  { title: 'Sovereign Knight', requirement: 'Max out all base attributes' },
];

export function SettingsPage() {
  const [profile, setProfile] = useState({
    id: 'usr_88203',
    username: 'AnimeHero_X',
    email: 'hero@realm.io',
    character_class: 'ranger',
    title: 'Forest Warden',
    titles: ['Novice Adventurer', 'Shadow Hunter', 'Forest Warden', 'Divine Healer', 'Vanguard Champion'],
    attribute_points: 6,
    attributes: {
      strength: 14,
      intelligence: 18,
      agility: 22,
      dexterity: 28,
      wisdom: 16,
      vitality: 20,
    },
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [savingClass, setSavingClass] = useState(false);
  const [equippingTitle, setEquippingTitle] = useState(null);
  const [allocating, setAllocating] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [notifications, setNotifications] = useState({
    dailyQuests: true,
    streakWarning: true,
    levelUpFanfare: true,
    bossRaids: false,
  });

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  const handleClassChange = (classId) => {
    if (classId === profile.character_class || savingClass) return;
    playSFX('equip', soundEnabled);
    setSavingClass(true);

    const targetClass = CHARACTER_CLASSES[classId];
    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        character_class: classId,
      }));
      setSavingClass(false);
      showFeedback(`Class successfully switched to ${targetClass.label}!`);
    }, 300);
  };

  const handleEquipTitle = (titleName) => {
    if (titleName === profile.title) return;
    playSFX('equip', soundEnabled);
    setEquippingTitle(titleName);

    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        title: titleName,
      }));
      setEquippingTitle(null);
      showFeedback(`Title equipped: "${titleName}"`);
    }, 250);
  };

  const handleAllocateStat = (attrKey) => {
    if (profile.attribute_points <= 0) return;
    playSFX('upgrade', soundEnabled);
    setAllocating(attrKey);

    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        attribute_points: prev.attribute_points - 1,
        attributes: {
          ...prev.attributes,
          [attrKey]: prev.attributes[attrKey] + 1,
        },
      }));
      setAllocating(null);
      showFeedback(`Allocated +1 Point to ${attrKey.toUpperCase()}`);
    }, 200);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    playSFX('save', soundEnabled);
    setProfile((prev) => ({ ...prev, username: usernameInput }));
    showFeedback('Profile parameters updated successfully!');
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {}
        {feedback && (
          <div className="fixed top-5 right-5 z-50 bg-neutral-900/95 border-2 border-cyan-400 text-cyan-200 px-5 py-3.5 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center gap-3 backdrop-blur-xl animate-bounce">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-black tracking-wide">{feedback}</span>
          </div>
        )}

        {}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-purple-950/40 to-neutral-900 p-6 sm:p-8 border-2 border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)] backdrop-blur-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 p-0.5 shadow-[0_0_25px_rgba(168,85,247,0.5)]">
                <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                  <Sliders className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase flex items-center gap-2">
                  HERO CONTROL PANEL <span className="text-xs bg-cyan-400 text-black font-black px-2.5 py-0.5 rounded-full border border-black shadow">v2.5</span>
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Customize character class visuals, allocate stat points, manage titles, and update system settings
                </p>
              </div>
            </div>

            {/* Top Bar Quick Stats & Audio Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  playSFX('click', !soundEnabled);
                }}
                className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-2 text-xs font-black ${
                  soundEnabled
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
                <span>{soundEnabled ? 'SFX ON' : 'SFX OFF'}</span>
              </button>

              <div className="flex items-center gap-3 bg-neutral-950/80 px-4 py-2.5 rounded-2xl border border-neutral-800 shadow-inner">
                <Crown className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase">ACTIVE TITLE</p>
                  <p className="text-xs font-black text-amber-300 font-mono">{profile.title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Class Selector & Title Manager */}
          <div className="lg:col-span-7 space-y-8">
            
            {}
            <div className="bg-neutral-900/80 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">SELECT ANIME HERO CLASS</h2>
                    <p className="text-xs text-neutral-400">Choose your combat class to apply custom high-res artwork & aura</p>
                  </div>
                </div>
              </div>

              {/* Class Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.values(CHARACTER_CLASSES).map((cls) => {
                  const IconComponent = cls.icon;
                  const isActive = profile.character_class === cls.id;

                  return (
                    <button
                      key={cls.id}
                      onClick={() => handleClassChange(cls.id)}
                      disabled={savingClass}
                      className={`relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-300 group ${
                        isActive
                          ? `${cls.aura} scale-[1.02] bg-neutral-900`
                          : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-600 hover:scale-[1.01]'
                      }`}
                    >
                      {/* High-Resolution Anime Card Image */}
                      <div className="relative h-32 w-full overflow-hidden">
                        <img
                          src={cls.image}
                          alt={cls.label}
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 opacity-75"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${cls.color}`} />
                        
                        {/* Active Badge */}
                        {isActive && (
                          <div className="absolute top-2.5 right-2.5 bg-emerald-400 text-black font-black text-[10px] px-2.5 py-1 rounded-full border border-black shadow-[0_0_12px_rgba(52,211,153,0.8)] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE HERO
                          </div>
                        )}

                        {/* Class Label Overlay */}
                        <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/30 bg-black/60 backdrop-blur-md shadow-lg">
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-black text-lg text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wide uppercase">
                            {cls.label}
                          </span>
                        </div>
                      </div>

                      {/* Class Description & Stat Metadata */}
                      <div className="p-4 space-y-2 bg-neutral-900/90">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-neutral-400 font-bold">PRIMARY STAT:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${cls.badge}`}>
                            {cls.badgeText}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{cls.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {}
            <div className="bg-neutral-900/80 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">EQUIPPABLE HERO TITLES</h2>
                    <p className="text-xs text-neutral-400">
                      {profile.titles.length} of {ALL_TITLES.length} unlocked titles
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {ALL_TITLES.map((t) => {
                  const unlocked = profile.titles.includes(t.title);
                  const isEquipped = profile.title === t.title;

                  return (
                    <div
                      key={t.title}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                        isEquipped
                          ? 'bg-gradient-to-r from-amber-950/60 via-neutral-900 to-neutral-900 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                          : unlocked
                          ? 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                          : 'bg-neutral-950/30 border-neutral-900 opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                          isEquipped
                            ? 'bg-amber-400 text-black border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.8)]'
                            : unlocked
                            ? 'bg-neutral-800 text-amber-400 border-neutral-700'
                            : 'bg-neutral-900 text-neutral-600 border-neutral-800'
                        }`}>
                          {unlocked ? <Crown className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className={`text-sm font-black tracking-wide ${isEquipped ? 'text-amber-300' : unlocked ? 'text-white' : 'text-neutral-500'}`}>
                            {t.title}
                          </p>
                          <p className="text-xs text-neutral-500">{t.requirement}</p>
                        </div>
                      </div>

                      {unlocked && !isEquipped && (
                        <button
                          disabled={equippingTitle === t.title}
                          onClick={() => handleEquipTitle(t.title)}
                          className="px-3 py-1.5 rounded-xl border border-amber-400/60 text-amber-300 hover:bg-amber-400 hover:text-black font-black text-xs transition-all duration-200"
                        >
                          {equippingTitle === t.title ? 'EQUIPPING...' : 'EQUIP TITLE'}
                        </button>
                      )}

                      {isEquipped && (
                        <span className="bg-amber-400 text-black font-black text-[10px] px-3 py-1 rounded-full border border-black shadow uppercase">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Attributes, Profile Credentials, Notifications & Danger Zone */}
          <div className="lg:col-span-5 space-y-8">
            
            {}
            <div className={`rounded-3xl p-6 border-2 transition-all ${
              profile.attribute_points > 0
                ? 'bg-gradient-to-b from-purple-950/50 via-neutral-900 to-neutral-900 border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.25)]'
                : 'bg-neutral-900/80 border-neutral-800'
            }`}>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    profile.attribute_points > 0
                      ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                  }`}>
                    <Zap className={`w-5 h-5 ${profile.attribute_points > 0 ? 'animate-bounce' : ''}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">ATTRIBUTE ALLOCATION</h2>
                    <p className="text-xs text-purple-300 font-bold">
                      {profile.attribute_points} POINTS AVAILABLE TO SPEND
                    </p>
                  </div>
                </div>
              </div>

              {/* Stat Bars */}
              <div className="space-y-4">
                {Object.entries(profile.attributes).map(([attrKey, value]) => {
                  const maxStat = 40;
                  const percentage = Math.min((value / maxStat) * 100, 100);

                  return (
                    <div key={attrKey} className="space-y-1.5 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-white uppercase tracking-wide">{attrKey}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold">{value} PTS</span>
                          {profile.attribute_points > 0 && (
                            <button
                              onClick={() => handleAllocateStat(attrKey)}
                              disabled={allocating === attrKey}
                              className="w-6 h-6 rounded-lg bg-purple-500 hover:bg-purple-400 text-black font-black text-sm flex items-center justify-center transition-all shadow-md active:scale-95"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {}
            <div className="bg-neutral-900/80 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-800">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <User className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">HERO IDENTITY</h2>
                  <p className="text-xs text-neutral-400">Account handle & system email</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 mb-1 block">Hero Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 mb-1 block">Registered Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2.5 pl-10 pr-4 text-sm text-neutral-500 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] active:scale-[0.99] text-xs uppercase"
                >
                  SAVE PROFILE CHANGES
                </button>
              </form>
            </div>

            {}
            <div className="bg-neutral-900/80 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-800">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">SECURITY & ACCESS</h2>
                  <p className="text-xs text-neutral-400">Update account password</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 mb-1 block">Current Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white font-mono focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 mb-1 block">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white font-mono focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>
                </div>

                <button
                  onClick={() => playSFX('save', soundEnabled)}
                  className="w-full border border-neutral-700 hover:bg-neutral-800 text-white font-bold py-2.5 rounded-xl transition-all text-xs"
                >
                  UPDATE SECURITY CREDENTIALS
                </button>
              </div>
            </div>

            {}
            <div className="bg-neutral-900/80 border-2 border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">SYSTEM ALERTS</h2>
                  <p className="text-xs text-neutral-400">Manage quest notifications & reminders</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'dailyQuests', label: 'Daily Quest Reset', desc: 'Alerts when daily quests refresh' },
                  { key: 'streakWarning', label: 'Streak Danger Alerts', desc: 'Warning when streak is about to break' },
                  { key: 'levelUpFanfare', label: 'Level Up Audio Fanfare', desc: 'Play SFX when reaching new level' },
                ].map((item) => (
                  <label
                    key={item.key}
                    onClick={() => playSFX('click', soundEnabled)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-black text-white">{item.label}</p>
                      <p className="text-[10px] text-neutral-500">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                      className="w-5 h-5 rounded accent-cyan-400 bg-neutral-900 border-neutral-700 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {}
            <div className="bg-neutral-900/80 border-2 border-red-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-red-400 uppercase tracking-wider">DANGER ZONE</h2>
                  <p className="text-xs text-neutral-400">Terminate current session</p>
                </div>
              </div>

              <button
                onClick={() => {
                  playSFX('logout', soundEnabled);
                  showFeedback('Logging out of hero account...');
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2 text-xs uppercase transition-all active:scale-[0.99]"
              >
                <LogOut className="w-4 h-4" />
                SIGN OUT OF ACCOUNT
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default SettingsPage;