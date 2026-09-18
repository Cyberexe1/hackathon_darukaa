import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { mockNotifications } from '../../mocks/mockNotifications';
import { GlobalSearch } from '../GlobalSearch/GlobalSearch';

interface TopNavbarProps {
  pageTitle: string;
  onOpenMobileSidebar: () => void;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Authenticated dashboard top bar: brand mark, current page title, global
 * search, notifications dropdown, and user menu with logout. Reuses the
 * same visual language (rounded pills, material-symbols icons, surface
 * tokens) as the public Navbar.
 */
export function TopNavbar({ pageTitle, onOpenMobileSidebar }: TopNavbarProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/signin');
  };

  const unreadCount = mockNotifications.filter((n) => !n.read).length;
  const displayName = user?.name ?? 'Guest';
  const initials = user?.avatarInitials ?? 'DE';

  return (
    <header className="h-16 md:h-20 shrink-0 border-b border-outline-variant/30 bg-surface-container-lowest/95 nav-blur-scroll flex items-center justify-between px-3 md:px-space-lg gap-space-sm relative z-40">
      <div className="flex items-center gap-space-sm min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-high transition-colors shrink-0"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            menu
          </span>
        </button>
        <h1 className="font-headline-sm text-headline-sm text-primary truncate">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-1 md:gap-space-sm shrink-0">
        {/* Search (desktop inline, mobile icon-triggered) */}
        <div className="hidden md:block">
          <GlobalSearch />
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            search
          </span>
        </button>
        {searchOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-surface p-4 animate-fade-in">
            <div className="flex items-center gap-space-sm mb-space-md">
              <GlobalSearch autoFocus onNavigate={() => setSearchOpen(false)} />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="w-9 h-9 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-high transition-colors shrink-0"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((open) => !open)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              notifications
            </span>
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-error"
                aria-hidden="true"
              />
            )}
          </button>
          {notifOpen && (
            <div
              className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 overflow-hidden animate-scale-in origin-top-right"
              role="menu"
            >
              <div className="px-space-md py-space-sm border-b border-outline-variant/30 flex items-center justify-between">
                <span className="font-headline-sm text-headline-sm text-primary">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="font-label-technical text-label-micro text-surface-tint">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <ul className="max-h-80 overflow-y-auto divide-y divide-outline-variant/20">
                {mockNotifications.map((notif) => (
                  <li
                    key={notif.id}
                    className="px-space-md py-space-sm hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-start gap-space-sm">
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-surface-tint mt-1.5 shrink-0" />
                      )}
                      <div className={notif.read ? 'pl-3.5' : ''}>
                        <p className="font-body-sm text-body-sm text-on-surface">{notif.message}</p>
                        <span className="font-label-technical text-label-micro text-on-surface-variant">
                          {timeAgo(notif.created_at)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((open) => !open)}
            aria-label="Account menu"
            aria-expanded={userMenuOpen}
            className="flex items-center gap-space-xs pl-1 pr-1 md:pr-space-sm py-1 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-sm text-[13px] shrink-0">
              {initials}
            </span>
            <span className="hidden md:inline font-body-sm text-body-sm text-on-surface max-w-[140px] truncate">
              {displayName}
            </span>
            <span
              className="material-symbols-outlined text-[18px] text-on-surface-variant hidden md:inline"
              aria-hidden="true"
            >
              expand_more
            </span>
          </button>
          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 overflow-hidden animate-scale-in origin-top-right"
              role="menu"
            >
              <div className="px-space-md py-space-sm border-b border-outline-variant/30">
                <p className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                  {displayName}
                </p>
                <p className="font-label-technical text-label-micro text-on-surface-variant truncate">
                  {user?.email ?? 'demo@darukaa.earth'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUserMenuOpen(false)}
                className="w-full flex items-center gap-space-sm px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                role="menuitem"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  person
                </span>
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-space-sm px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
                role="menuitem"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  settings
                </span>
                Settings
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-space-sm px-space-md py-space-sm font-body-sm text-body-sm text-error hover:bg-error-container/40 transition-colors border-t border-outline-variant/20"
                role="menuitem"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  logout
                </span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
