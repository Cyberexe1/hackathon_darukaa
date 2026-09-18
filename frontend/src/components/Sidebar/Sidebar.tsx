import { NavLink } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Mobile overlay drawer mode — always renders expanded, closes on nav. */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/projects', label: 'Projects', icon: 'forest' },
  { to: '/sites', label: 'Sites', icon: 'pin_drop' },
  { to: '/analytics', label: 'Analytics', icon: 'query_stats' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-space-sm py-space-md flex-1" aria-label="Dashboard">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group relative flex items-center gap-space-sm rounded-lg px-space-sm py-space-sm font-body-sm text-body-sm transition-colors duration-200 ${
              isActive
                ? 'bg-primary-container text-on-primary font-medium'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
            } ${collapsed ? 'justify-center' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-surface-tint"
                  aria-hidden="true"
                />
              )}
              <span
                className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                  isActive ? 'text-on-primary' : 'text-on-surface-variant group-hover:text-primary'
                }`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Desktop persistent sidebar (collapsible icon-only <-> icon+label) plus
 * a mobile overlay drawer variant. Visual language matches the dashboard
 * console mockup from the landing page's PlatformPreview section.
 */
export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col border-r border-outline-variant/30 bg-surface-container-lowest transition-[width] duration-300 shrink-0 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={collapsed} />
        <div className="p-space-sm border-t border-outline-variant/30">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`w-full flex items-center gap-space-sm rounded-lg px-space-sm py-space-sm font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm animate-fade-in"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="absolute top-0 left-0 h-full w-72 bg-surface-container-lowest shadow-xl flex flex-col animate-slide-in-left">
            <div className="h-20 flex items-center justify-between px-space-md border-b border-outline-variant/30">
              <span className="font-headline-sm text-headline-sm uppercase tracking-wider text-primary">
                DARUKAA.EARTH
              </span>
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close menu"
                className="w-9 h-9 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
            <SidebarContent collapsed={false} onNavigate={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}
