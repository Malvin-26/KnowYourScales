import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 py-6 text-center text-sm text-slate-500">
        Know Your Scales — Master music theory, one scale at a time.
      </footer>
    </div>
  );
}
