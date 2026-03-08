import { ReactNode, useEffect, useId, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, LogOut, LogIn, UserPlus, User, Settings,
  BookOpen, Home, Info, Code,
} from 'lucide-react';
import { useAuthStore } from '../store';

function NavItem({
  icon,
  label,
  onClick,
  to,
  href,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  to?: string;
  href?: string;
  danger?: boolean;
}) {
  const cls = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
    ${danger
      ? 'text-error hover:bg-error/10'
      : 'text-base-content/80 hover:bg-base-content/10 hover:text-base-content'}`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {icon}<span>{label}</span>
      </a>
    );
  }
  if (to) {
    return (
      <Link to={to} className={cls}>
        {icon}<span>{label}</span>
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls + ' w-full text-left'}>
      {icon}<span>{label}</span>
    </button>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-widest text-base-content/40 select-none">
      {children}
    </p>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const id = useId().replace(/:/g, '');
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const clearToken = useAuthStore((s) => s.clearToken);

  // Close drawer on navigation
  useEffect(() => { setOpen(false); }, [location.pathname]);

  function handleSignOut() {
    clearToken();
    navigate('/login');
  }

  return (
    <div className="drawer">
      <input
        id={id}
        type="checkbox"
        className="drawer-toggle"
        checked={open}
        onChange={(e) => setOpen(e.target.checked)}
      />

      <div className="drawer-content flex flex-col min-h-screen">
        {/* Navbar */}
        <nav className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-30 px-4">
          <div className="flex-1">
            <Link to="/lists" className="font-bold text-lg tracking-tight">my-docs</Link>
          </div>
          <label
            htmlFor={id}
            className="btn btn-ghost btn-circle"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </label>
        </nav>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Drawer sidebar */}
      <div className="drawer-side z-40">
        <label htmlFor={id} aria-label="close menu" className="drawer-overlay" />
        <aside className="bg-base-100 w-72 min-h-screen flex flex-col border-r border-base-200">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
            <span className="font-bold text-base">my-docs</span>
            <label htmlFor={id} className="btn btn-ghost btn-circle btn-sm" aria-label="Close menu">
              <X size={16} />
            </label>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-3 flex flex-col">
            {/* Session */}
            <SectionLabel>Session</SectionLabel>
            {token ? (
              <NavItem icon={<LogOut size={18} />} label="Sign out" onClick={handleSignOut} danger />
            ) : (
              <>
                <NavItem icon={<LogIn size={18} />} label="Sign in" to="/login" />
                <NavItem icon={<UserPlus size={18} />} label="Create account" to="/register" />
              </>
            )}

            {/* Settings — only when logged in */}
            {token && (
              <>
                <SectionLabel>Settings</SectionLabel>
                <NavItem icon={<User size={18} />} label="Account" to="/account" />
                <NavItem icon={<Settings size={18} />} label="Settings" to="/settings" />
              </>
            )}

            {/* Docs */}
            <SectionLabel>Docs</SectionLabel>
            <NavItem icon={<Home size={18} />} label="Home" to="/lists" />
            <NavItem icon={<Info size={18} />} label="About us" href="https://example.com/about" />
            <NavItem icon={<BookOpen size={18} />} label="API docs" href="/apidocs" />
            <NavItem icon={<Code size={18} />} label="Developer docs" href="/apidocs" />
          </nav>
        </aside>
      </div>
    </div>
  );
}
