/**
 * AurumTrack - Phase 1 Foundation Main Application Component
 */

import React, { useState } from 'react';
import { UserRole } from './types/entities.js';
import { SEED_ORGANIZATIONS } from './services/data/repositories.js';
import { Navbar } from './components/layout/Navbar.js';
import { LandingPage } from './components/landing/LandingPage.js';
import { AuthenticatedShell } from './components/shell/AuthenticatedShell.js';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'shell'>('landing');
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.EXPORTER);
  const [activeOrgId, setActiveOrgId] = useState<string>(SEED_ORGANIZATIONS[0].id);

  const activeOrg = SEED_ORGANIZATIONS.find(o => o.id === activeOrgId) || SEED_ORGANIZATIONS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        activeOrgName={activeOrg.tradingName || activeOrg.legalName}
      />

      {currentView === 'landing' ? (
        <LandingPage onEnterAppShell={() => setCurrentView('shell')} />
      ) : (
        <AuthenticatedShell
          activeRole={activeRole}
          onRoleChange={setActiveRole}
          activeOrgId={activeOrgId}
          onOrgChange={setActiveOrgId}
          onReturnToLanding={() => setCurrentView('landing')}
        />
      )}
    </div>
  );
}
