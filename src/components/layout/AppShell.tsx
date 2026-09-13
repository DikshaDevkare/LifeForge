import { type ReactNode } from 'react';
import { Sidebar, type PageId } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export function AppShell({ children, currentPage, onNavigate }: AppShellProps) {
  return (
    <div className="min-h-screen bg-neutral-950 flex">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar currentPage={currentPage} />
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">{children}</main>
        <BottomNav currentPage={currentPage} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
