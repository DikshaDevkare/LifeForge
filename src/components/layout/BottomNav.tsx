import { LayoutDashboard, Swords, BarChart3, Settings, ShoppingBag, Backpack } from 'lucide-react';
import type { PageId } from './Sidebar';

interface BottomNavProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

const navItems: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'quests', label: 'Quests', icon: Swords },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'inventory', label: 'Bag', icon: Backpack },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-neutral-800">
      <div className="flex items-center justify-around px-2 py-2 pb-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                active ? 'text-primary-400' : 'text-neutral-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
