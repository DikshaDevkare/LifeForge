import { Flame, Bell, Search, Coins } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Your adventure at a glance' },
  quests: { title: 'Quests', subtitle: 'Manage your active quests' },
  stats: { title: 'Statistics', subtitle: 'Track your progress over time' },
  shop: { title: 'Forge Shop', subtitle: 'Spend your earned coins with intention' },
  inventory: { title: 'Inventory', subtitle: 'Your owned cosmetics and equipment' },
  settings: { title: 'Settings', subtitle: 'Configure your account' },
};

interface TopBarProps {
  currentPage: string;
}

export function TopBar({ currentPage }: TopBarProps) {
  const { profile } = useAuth();
  const meta = pageTitles[currentPage] ?? pageTitles.dashboard;

  return (
    <header className="sticky top-0 z-30 glass border-b border-neutral-800">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        <div>
          <h1 className="font-display text-xl lg:text-2xl font-bold text-white">{meta.title}</h1>
          <p className="text-sm text-neutral-500 hidden sm:block">{meta.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <Badge color="secondary" icon={<Coins className="w-3 h-3" />} size="md">
              <AnimatedNumber value={profile.coins} />
            </Badge>
          )}
          {profile && profile.streak_days > 0 && (
            <Badge color="warning" icon={<Flame className="w-3 h-3" />} size="md">
              {profile.streak_days}
            </Badge>
          )}
           <button aria-label="Search" title="Search" className="w-9 h-9 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-200 transition-colors">
            <Search className="w-4 h-4" />
          </button>
           <button aria-label="Notifications" title="Notifications" className="w-9 h-9 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-200 transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary-500 rounded-full" />
          </button>
          {profile && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 border border-primary-500/30 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-300">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
