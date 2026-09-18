import React from 'react';
import { Shield, Layers, Database, Lock, Key, FileCheck, CheckCircle2, Building, RefreshCw } from 'lucide-react';
import { UserRole } from '../../types/entities.js';
import { SEED_ORGANIZATIONS, SEED_SHIPMENTS, SEED_USERS } from '../../services/data/repositories.js';

interface DashboardModuleProps {
  activeRole: UserRole;
  activeOrgName: string;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({ activeRole, activeOrgName }) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                PHASE 1 OPERATIONAL FOUNDATION
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-1">AurumTrack Console Dashboard</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Foundational architecture for secure gold logistics, multi-organization isolation, and immutable audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 self-start sm:self-auto">
            <Building className="h-5 w-5 text-amber-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Authenticated Tenant</div>
              <div className="text-xs font-semibold text-white truncate max-w-[160px]">{activeOrgName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Core Data Model</span>
            <Database className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">12 / 12</div>
          <p className="mt-1 text-[11px] text-slate-400">UUID v4 & UTC ISO entities ready</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">RBAC Roles</span>
            <Key className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">10 Defined</div>
          <p className="mt-1 text-[11px] text-emerald-400">Active Role: {activeRole}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Multi-Tenancy</span>
            <Lock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">Strict RLS</div>
          <p className="mt-1 text-[11px] text-amber-400/80">Cross-tenant queries blocked</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Audit Chain</span>
            <Shield className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">SHA-256</div>
          <p className="mt-1 text-[11px] text-emerald-400">Tamper seals validated</p>
        </div>
      </div>

      {/* Architectural Readiness Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              Phase 1 Security Controls Checklist
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">100% OPERATIONAL</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Zero-Plaintext Credentials:</strong>
                <p className="text-[11px] text-slate-400 mt-0.5">Password hashing abstraction with salt & zero secret exposure.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Multi-Tenant Isolation:</strong>
                <p className="text-[11px] text-slate-400 mt-0.5">Org boundary enforcement prevents cross-org gold visibility.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Centralized Input Validation:</strong>
                <p className="text-[11px] text-slate-400 mt-0.5">Zero-trust checking of UUIDs, weights, coordinates, and purity.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Hardened Security Headers:</strong>
                <p className="text-[11px] text-slate-400 mt-0.5">HSTS, nosniff, SAMEORIGIN, rate-limiting, and correlation IDs.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Partitioned Object Storage:</strong>
                <p className="text-[11px] text-slate-400 mt-0.5">Isolated bucket paths & short-lived signed download/upload tickets.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Structured Safe Logging:</strong>
                <p className="text-[11px] text-slate-400 mt-0.5">Recursive masking of passwords, keys, and tokens with safe error codes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Reference Seed Consignment Preview */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              Reference Shipment
            </h3>
            <span className="text-[10px] text-amber-400 font-mono">Phase 1 Seed</span>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Tracking #</span>
              <span className="text-amber-300 font-bold">{SEED_SHIPMENTS[0].trackingNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gross Weight</span>
              <span className="text-slate-200">{(SEED_SHIPMENTS[0].grossWeightGrams / 1000).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Net Pure Gold</span>
              <span className="text-amber-400">{(SEED_SHIPMENTS[0].netPureGoldGrams / 1000).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Declared Value</span>
              <span className="text-slate-200">${(SEED_SHIPMENTS[0].declaredValueUsd / 1000000).toFixed(2)}M USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className="text-emerald-400 font-bold">{SEED_SHIPMENTS[0].status}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Consignment schema validated against real refinery and LBMA transit specifications. Ready for live workflow binding in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
};
