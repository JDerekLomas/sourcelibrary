import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { usePaths } from '../../hooks/usePaths';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { ResourceType, ActionType } from '../../auth/RoleGuard';

interface Props {
  className?: string;
}

interface MenuItem {
  label: string;
  path: string;
  requiresAuth?: boolean;
}

const HamburgerMenu: React.FC<Props> = ({ className = '' }) => {
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<'left' | 'right'>('right');
  const ref = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const { tenantSlug } = useTenant() || {};
  const paths = usePaths();

  const { can, logout } = useAuth() || {};

  // Menu items structure
  const menuItems: MenuItem[] = [
    { label: 'Home', path: paths.home },
    // { label: 'Library', path: paths.library, requiresAuth: false },
    { label: 'About', path: paths.about, requiresAuth: false },
    { label: 'Contact', path: '/contact', requiresAuth: false }, // TODO: Enable when service is ready
    { label: 'Dashboard', path: paths.admin.dashboard, requiresAuth: true },
    { label: 'AI Oracle', path: paths.astrology, requiresAuth: true },
    { label: 'Lively Minds', path: paths.phaserGame, requiresAuth: true },
    { label: 'The Living Library', path: paths.unityGame, requiresAuth: true },
  ];

  // Filter menu items based on auth status
  const isAdminLoggedIn = can && (can(ResourceType.USER, ActionType.DELETE));

  const visibleMenuItems = menuItems.filter(item => !item.requiresAuth || isAdminLoggedIn);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Closing side bar on pressing escape key or clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  // Decide alignment when menu opens to keep it on-screen
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const panelWidthInPx = 224;
    const gutter = 24;
    const spaceRight = window.innerWidth - rect.left;
    setAlign(spaceRight >= panelWidthInPx + gutter ? 'left' : 'right');
  }, [open]);

  const btnClass = "inline-flex items-center justify-center z-[9999] h-[38px] w-[38px] transition-colors focus:outline-none font-serif font-sm text-white";
  const menuItemClass = "block w-full px-10 py-3 text-left text-white/70 hover:text-white rounded-md text-[23px] font-light uppercase transition-colors";

  const logoutUser = () => {
    setOpen(false);
    if (logout) logout();
    navigate(paths.home);
  };

  const loginPage = () => {
    setOpen(false);
    navigate(paths.login);
  };

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-label="Open menu"
        className={`${btnClass}`}
        onClick={() => setOpen(o => !o)}
      >
        <Bars3Icon
          className={`z-[9999] h-10 w-10 stroke-[0.5px] transition-all duration-200 ${open ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}
        />
        <XMarkIcon
          className={`z-[9999] absolute h-10 w-10 stroke-[0.5px] transition-all duration-200 ${open ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}`}
        />
      </button>

      {/* Sliding Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={
          `z-[9998] top-0 fixed ${align === 'right' ? 'right-0' : 'left-0'} h-full bg-black text-white shadow-2xl w-[min(22.5rem,90vw)] transform transition-transform duration-500 ease-[cubic-bezier(.2,.65,.2,1)]`
        }
        style={{
          transform: open
            ? 'translateX(0)'
            : align === 'right'
              ? 'translateX(100%)'
              : 'translateX(-100%)'
        }}
      >
        <div className="flex flex-col h-full mt-36">
          <nav className="px-6 py-6 overflow-auto">
            {/* Menu Items */}
            {visibleMenuItems.map((item, index) => {
              // Check if this is the first requiresAuth item
              const isFirstAuthItem = item.requiresAuth &&
                (index === 0 || !visibleMenuItems[index - 1]?.requiresAuth);

              return (
                <React.Fragment key={item.path}>
                  {isFirstAuthItem && <div className="h-6" />}
                  <Link
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={menuItemClass}
                  >
                    {item.label}
                  </Link>
                </React.Fragment>
              );
            })}

            {/* Spacer before auth button */}
            <div className="h-6" />

            {/* Sign In/Out Button */}
            {tenantSlug &&
              <button
                className={menuItemClass}
                onClick={isAdminLoggedIn ? logoutUser : loginPage}
              >
                {isAdminLoggedIn ? 'Sign Out' : 'Sign In'}
              </button>
            }
          </nav>
        </div>
      </aside>
    </div>
  );
};

export default HamburgerMenu;
