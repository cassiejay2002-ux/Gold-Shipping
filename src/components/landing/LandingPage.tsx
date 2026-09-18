import React from 'react';
import {
  Shield,
  Lock,
  Compass,
  FileCheck2,
  Cpu,
  Layers,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  Fingerprint,
  Scale,
  Building2,
  Terminal,
} from 'lucide-react';
import { ArchitectureExplorer } from './ArchitectureExplorer.js';

interface LandingPageProps {
  onEnterAppShell: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterAppShell }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16 sm:py-24">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Compliance Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md mb-6 shadow-sm">
              <Shield className="h-3.5 w-3.5" />
              <span>Phase 1 System Architecture Live • OECD & LBMA Compliant</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
              Sovereign Gold Logistics &{' '}
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                Digital Chain of Custody
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-300">
              AurumTrack provides licensed mining houses, refineries, secure vaults, and accredited logistics carriers
              with an immutable, zero-trust foundation for end-to-end gold consignment visibility and tamper-evident custody handoffs.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onEnterAppShell}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-500 transition-all cursor-pointer"
              >
                <span>Launch Authenticated Shell</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href="#architecture"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Cpu className="h-4 w-4 text-amber-400" />
                <span>Explore Phase 1 Architecture</span>
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80 pt-8 text-left">
              <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
                <div className="text-xs text-slate-400 font-medium">Core Entities</div>
                <div className="text-xl font-bold text-white font-mono mt-0.5">12 Registered</div>
                <div className="text-[11px] text-amber-400/80">UUID v4 & UTC ISO</div>
              </div>
              <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
                <div className="text-xs text-slate-400 font-medium">Security Roles</div>
                <div className="text-xl font-bold text-white font-mono mt-0.5">10 Defined</div>
                <div className="text-[11px] text-emerald-400">Least-Privilege RBAC</div>
              </div>
              <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
                <div className="text-xs text-slate-400 font-medium">Multi-Tenancy</div>
                <div className="text-xl font-bold text-white font-mono mt-0.5">Strict Isolation</div>
                <div className="text-[11px] text-amber-400/80">RLS Boundary Engine</div>
              </div>
              <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3">
                <div className="text-xs text-slate-400 font-medium">Audit Trail</div>
                <div className="text-xl font-bold text-white font-mono mt-0.5">Append-Only</div>
                <div className="text-[11px] text-emerald-400">SHA-256 Tamper Seals</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Regulatory Compliance Principles */}
      <section className="py-16 border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Strict Anti-Smuggling & Regulatory Compliance
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              AurumTrack enforces rigorous zero-trust controls tailored for legitimate gold logistics. The platform explicitly prohibits and prevents illicit gold trading, customs evasion, and sanctions violations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">LBMA & OECD Sourcing Standards</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Incorporates certified assays, export permit tracking numbers, and accredited refinery validation, ensuring unadulterated provenance from mine site to Good Delivery vault.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
                <Fingerprint className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Tamper-Evident Chain of Custody</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Transfers between mining companies, bonded logistics carriers, customs officials, and secure depositories require dual-party verification and tamper seal inspection.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 mb-4 border border-amber-500/20">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Fail-Closed Boundary Security</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Zero trust for client inputs. Unauthorized route deviations, seal breaches, or cross-organization data queries trigger automated security exceptions and append-only audits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Phase 1 Architecture Explorer */}
      <section id="architecture" className="py-16 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Foundational Verification
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mt-1">
                Phase 1 System Architecture
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Explore the modular architecture built strictly according to Phase 1 specifications.
              </p>
            </div>

            <button
              onClick={onEnterAppShell}
              className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all self-start md:self-auto cursor-pointer"
            >
              <Terminal className="h-4 w-4" />
              <span>Open Authenticated Console Shell</span>
            </button>
          </div>

          <ArchitectureExplorer />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-slate-300">AurumTrack Gold Logistics Platform</span>
            <span>— Phase 1 Architecture</span>
          </div>
          <div>
            Built for legitimate, licensed gold shipping operations. Zero tolerance for illegal trade or smuggling.
          </div>
        </div>
      </footer>
    </div>
  );
};
