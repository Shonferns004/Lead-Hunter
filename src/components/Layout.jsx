import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const mainNav = [
  { path: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { path: '/search', label: 'Lead Search', icon: 'manage_search' },
  { path: '/leads', label: 'All Leads', icon: 'database' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

const outreachNav = [
  { path: '/messages', label: 'WhatsApp Outreach', icon: 'send' },
  { path: '/history', label: 'History', icon: 'history' },
];

const bottomNav = [
  { path: '/', label: 'Home', icon: 'dashboard' },
  { path: '/search', label: 'Search', icon: 'manage_search' },
  { path: '/leads', label: 'Leads', icon: 'database' },
  { path: '/messages', label: 'Outreach', icon: 'send' },
  { path: '/history', label: 'History', icon: 'history' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Layout({ leadCount, onLogout }) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[280px] min-h-screen bg-surface-container border-r border-border-subtle flex-shrink-0 fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-border-subtle">
          <span className="material-symbols-outlined text-primary text-2xl">hexagon</span>
          <div>
            <div className="text-lg font-bold font-headline-md tracking-tight">
              Lead<span className="text-primary">Hunter</span>
            </div>
            <div className="text-[10px] text-on-surface-variant uppercase tracking-[1.5px] font-label-sm">Web Agency CRM</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-[10px] text-on-surface-variant uppercase tracking-[1.5px] px-3 pb-2 font-label-sm">Main</div>
          {mainNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
                  isActive
                    ? 'bg-primary-container/20 text-primary font-medium'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
              {item.path === '/leads' && leadCount > 0 && (
                <span className="ml-auto bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{leadCount}</span>
              )}
            </NavLink>
          ))}

          <div className="text-[10px] text-on-surface-variant uppercase tracking-[1.5px] px-3 pb-2 mt-4 font-label-sm">Outreach</div>
          {outreachNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
                  isActive
                    ? 'bg-primary-container/20 text-primary font-medium'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User profile */}
        <div className="px-4 py-3 border-t border-border-subtle flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary flex-shrink-0">
            AK
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Ahmed Khan</div>
            <div className="text-[10px] text-on-surface-variant truncate">Web Agency</div>
          </div>
          <button
            onClick={onLogout}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </aside>

      <div className="flex md:ml-[280px] min-h-screen">
        {/* Main content area */}
        <div className="flex-1 min-h-screen min-w-0">
          <main className="px-3 md:px-8 pt-4 md:pt-8 pb-20 md:pb-8 mx-auto w-full max-w-7xl">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile bottom nav - fixed independently */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container border-t border-border-subtle">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg min-w-0 ${
                  isActive ? 'text-primary' : 'text-on-surface-variant'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[10px] font-label-sm">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
