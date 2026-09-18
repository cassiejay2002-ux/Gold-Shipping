import React from 'react';
import { Shield, Lock, Layers, UserCheck, Terminal, Compass } from 'lucide-react';
import { UserRole } from '../../types/entities.js';

interface NavbarProps {
  currentView: 'landing' | 'shell';
  onViewChange: (view: 'landing' | 'shell') => void;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeOrgName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  activeRole,
  onRoleChange,
  activeOrgName,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-700/30 text-amber-400 shadow-sm shadow-amber-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">AurumTrack</span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                PHASE 1
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Secure Gold Logistics & Chain of Custody</p>
          </div>
        </div>

        {/* Center System Status Beacon */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">System Architecture Online</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Lock className="h-3.5 w-3.5 text-slate-500" />
            <span>Zero-Trust Security</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>PostgreSQL / RLS Ready</span>
          </div>
        </div>

        {/* Right Navigation & View Switcher */}
        <div className="flex items-center gap-3">
          {/* Switcher Button */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-900/80 p-1">
            <button
              onClick={() => onViewChange('landing')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentView === 'landing'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Public Portal</span>
            </button>
            <button
              onClick={() => onViewChange('shell')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                currentView === 'shell'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>App Shell</span>
            </button>
          </div>

          {/* Quick Role Tester in Header */}
          {currentView === 'shell' && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs">
              <UserCheck className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-slate-400">Role:</span>
              <select
                value={activeRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent font-medium text-amber-300 focus:outline-none cursor-pointer"
              >
                {Object.values(UserRole).map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-slate-200">
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
