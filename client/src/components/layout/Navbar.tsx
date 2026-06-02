import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Music2, LayoutDashboard, Piano, Headphones,
  HelpCircle, GitBranch, BookOpen, User, GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lessons', label: 'Lessons', icon: GraduationCap },
  { to: '/scales', label: 'Scales', icon: Piano },
  { to: '/ear-training', label: 'Ear Training', icon: Headphones },
  { to: '/quiz', label: 'Quiz', icon: HelpCircle },
  { to: '/chords', label: 'Chords', icon: GitBranch },
  { to: '/songs', label: 'Songs', icon: BookOpen },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg hidden sm:block">
              Know <span className="text-gradient">Your Scales</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {isAuthenticated &&
              navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-brand-600/20 text-brand-300' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5"
                >
                  <User className="w-4 h-4" />
                  {user?.displayName || user?.username}
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); navigate('/'); }}
                  className="text-sm text-slate-400 hover:text-slate-200 hidden sm:block"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-500"
              >
                Sign in
              </Link>
            )}
            <button
              type="button"
              className="lg:hidden p-2 text-slate-400"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {isAuthenticated ? (
                <>
                  {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </NavLink>
                  ))}
                  <NavLink to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-300">
                    <User className="w-4 h-4" /> Profile
                  </NavLink>
                </>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2.5 text-brand-400">
                  Sign in
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
