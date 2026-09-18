import React from 'react';
import { Shield, Lock, CheckCircle2, AlertTriangle, Layers, Key, Database, ChevronRight } from 'lucide-react';
import { UserRole } from '../../types/entities.js';
import { getPermissionsForRole, Permission } from '../../services/auth/rbacService.js';

interface ModulePlaceholderProps {
  moduleKey: string;
  title: string;
  description: string;
  relatedEntities: string[];
  requiredPermissions: Permission[];
  activeRole: UserRole;
  activeOrgName: string;
  phase1ReadinessNotes: string[];
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  moduleKey,
  title,
  description,
  relatedEntities,
  requiredPermissions,
  activeRole,
  activeOrgName,
  phase1ReadinessNotes,
}) => {
  const userPermissions = getPermissionsForRole(activeRole);
  const grantedPermissions = requiredPermissions.filter(p => userPermissions.includes(p));
  const missingPermissions = requiredPermissions.filter(p => !userPermissions.includes(p));
  const hasSufficientAccess = grantedPermissions.length > 0 || requiredPermissions.length === 0;

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                Phase 1 Shell Placeholder
              </span>
              <span className="text-xs text-slate-400">Tenant: <strong className="text-slate-200">{activeOrgName}</strong></span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-1.5">{title}</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">{description}</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3 self-start sm:self-auto">
            <Shield className="h-5 w-5 text-amber-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Role Access</div>
              <div className="text-xs font-mono font-bold text-amber-300">{activeRole}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Permission & Boundary Analysis Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Role Permission Evaluation */}
        <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" />
              Role Authorization Evaluation
            </h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
              hasSufficientAccess
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {hasSufficientAccess ? 'AUTHORIZED TO ACCESS' : 'RESTRICTED FOR THIS ROLE'}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-400">
              When full business workflows are activated in future phases, access to this module will require server-enforced permissions:
            </p>

            <div className="space-y-2">
              {requiredPermissions.map((perm) => {
                const isGranted = userPermissions.includes(perm);
                return (
                  <div
                    key={perm}
                    className={`flex items-center justify-between rounded-lg border p-2.5 text-xs font-mono ${
                      isGranted
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400'
                    }`}
                  >
                    <span>{perm}</span>
                    <span className="text-[10px] font-sans font-bold">
                      {isGranted ? 'GRANTED' : 'DENIED (FAIL-CLOSED)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Phase 1 Architectural Readiness */}
        <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-400" />
              Bound Core Schema Entities
            </h3>
            <span className="text-[11px] text-amber-400 font-mono">Phase 1 Data Foundation</span>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-400">
              Entities established in Phase 1 database schema ready to back this module without rewrites:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {relatedEntities.map((ent) => (
                <span
                  key={ent}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-mono text-amber-300"
                >
                  {ent}
                </span>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 text-xs text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300">Phase 1 Architectural Guarantees:</div>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                {phase1ReadinessNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Development Roadmap Callout */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-300">PHASE 1 SCOPE DISCIPLINE ACTIVE</h4>
            <p className="text-[11px] text-slate-400">
              Full CRUD workflows, live telemetry ingestion, and transfer signing will be introduced in subsequent phases.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 font-mono">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Architecture Validated</span>
          </span>
        </div>
      </div>
    </div>
  );
};
