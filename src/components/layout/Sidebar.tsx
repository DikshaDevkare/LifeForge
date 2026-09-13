import React from 'react';
import { 
  Flame, 
  LayoutDashboard, 
  Swords, 
  BarChart3, 
  Settings, 
  LogOut, 
  Coins, 
  Award, 
  ShoppingBag, 
  Backpack,
  Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { CHARACTER_CLASS_META } from '@/types/database';
import { audioFX } from '@/App'; // Sound engine call on button clicks

export type PageId = 'dashboard' | 'quests' | 'stats' | 'shop' | 'inventory' | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

const navItems: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'quests', label: 'Quests', icon: Swords },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'inventory', label: 'Inventory', icon: Backpack },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();

  const handleNavClick = (id: PageId) => {
    audioFX?.play?.('click');
    onNavigate(id);
  };

  const handleSignOut = () => {
    audioFX?.play?.('click');
    signOut();
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-cyan-500/20 bg-neutral-950/80 backdrop-blur-2xl h-screen sticky top-0 relative z-20 shadow-[5px_0_30px_rgba(0,0,0,0.8)]">
      {/* Background Cyber Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent pointer-events-none" />

      {/* App Logo */}
      <div className="px-6 py-5 border-b border-neutral-800/80 relative z-10">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <Flame className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
          </div>
          <div>
            <span className="font-display text-xl font-black tracking-wider text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              LifeForge
            </span>
            <span className="text-[9px] font-black tracking-widest text-cyan-400/80 uppercase block -mt-1">
              Arcade Edition
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic 3D Character Card */}
      {profile && (
        <div className="px-4 py-4 relative z-10">
          <div className="relative p-4 rounded-2xl bg-neutral-900/90 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] overflow-hidden group hover:border-purple-500/60 transition-all">
            {/* Card Background Glow */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-3 relative z-10">
              {/* Animated Level Shield Badge */}
              <div className="relative flex items-center justify-center shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 p-[2px] shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                  <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center font-display text-lg font-black text-cyan-300">
                    {profile.level}
                  </div>
                </div>
                <Shield className="w-4 h-4 text-cyan-400 absolute -bottom-1 -right-1 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-white truncate tracking-wide">{profile.username}</p>
                <p className="text-xs text-neutral-400 font-medium truncate">
                  Level {profile.level} {CHARACTER_CLASS_META[profile.character_class]?.label}
                </p>
                {profile.title && (
                  <p className="text-[11px] font-bold text-cyan-400 truncate mt-0.5 tracking-wider uppercase">
                    {profile.title}
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic XP Progress Bar */}
            <div className="relative z-10">
              <ProgressBar
                value={profile.xp}
                max={profile.xp_to_next_level}
                size="sm"
                color="secondary"
                showValue
              />
            </div>

            {/* Glowing Stat Badges */}
            <div className="mt-3 flex items-center gap-2 flex-wrap relative z-10">
              <Badge color="secondary" icon={<Coins className="w-3 h-3 text-amber-400" />}>
                {profile.coins.toLocaleString()}
              </Badge>
              {profile.streak_days > 0 && (
                <Badge color="warning" icon={<Flame className="w-3 h-3 text-orange-400" />}>
                  {profile.streak_days} Streak
                </Badge>
              )}
              {profile.attribute_points > 0 && (
                <Badge color="primary" icon={<Award className="w-3 h-3 text-cyan-400" />}>
                  {profile.attribute_points} AP
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Options */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 relative group overflow-hidden ${
                active
                  ? 'text-white bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-transparent border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-transparent'
              }`}
            >
              {/* Active Strip */}
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-purple-500 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
              )}

              <Icon 
                className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                  active 
                    ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse' 
                    : 'text-neutral-400 group-hover:text-cyan-300'
                }`} 
              />
              
              <span className="relative z-10">{item.label}</span>

              {/* Hover Glow */}
              <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="px-3 py-4 border-t border-neutral-800/80 relative z-10">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-red-400 hover:text-red-200 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}