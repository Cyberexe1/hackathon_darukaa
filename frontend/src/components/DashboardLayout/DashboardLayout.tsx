import { useState, type ReactNode } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { TopNavbar } from '../TopNavbar/TopNavbar';

interface DashboardLayoutProps {
  pageTitle: string;
  children: ReactNode;
}

/**
 * Authenticated application shell: persistent/collapsible desktop sidebar
 * + mobile drawer, top navbar, and a scrollable main content region. Every
 * dashboard route renders inside this shell.
 */
export function DashboardLayout({ pageTitle, children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen w-full flex bg-surface overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar pageTitle={pageTitle} onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
