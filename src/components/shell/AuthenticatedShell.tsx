import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Navigation,
  Link2,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Settings,
  Building,
  UserCheck,
  LogOut,
  ChevronDown,
  Layers,
  Menu,
  X,
} from 'lucide-react';
import { UserRole } from '../../types/entities.js';
import { Permission } from '../../services/auth/rbacService.js';
import { SEED_ORGANIZATIONS } from '../../services/data/repositories.js';
import { DashboardModule } from './DashboardModule.js';
import { ModulePlaceholder } from './ModulePlaceholder.js';

interface AuthenticatedShellProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeOrgId: string;
  onOrgChange: (orgId: string) => void;
  onReturnToLanding: () => void;
}

type ModuleKey =
  | 'dashboard'
  | 'shipments'
  | 'tracking'
  | 'custody'
  | 'documents'
  | 'alerts'
  | 'security'
  | 'administration';

interface NavigationItem {
  key: ModuleKey;
  label: string;
  icon: React.ElementType;
  description: string;
  relatedEntities: string[];
  requiredPermissions: Permission[];
  readinessNotes: string[];
}

export const AuthenticatedShell: React.FC<AuthenticatedShellProps> = ({
  activeRole,
  onRoleChange,
  activeOrgId,
  onOrgChange,
  onReturnToLanding,
}) => {
  const [activeModule, setActiveModule] = useState<ModuleKey>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeOrg = SEED_ORGANIZATIONS.find(o => o.id === activeOrgId) || SEED_ORGANIZATIONS[0];

  const navigationItems: NavigationItem[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'System architectural overview, multi-tenant boundaries, and compliance telemetry status.',
      relatedEntities: ['Organization', 'User', 'Shipment', 'AuditLog'],
      requiredPermissions: [],
      readinessNotes: [
        'Multi-tenant context resolution established',
        'Append-only cryptographic audit stream hooked',
        'Zero-trust validation indicators online',
      ],
    },
    {
      key: 'shipments',
      label: 'Shipments',
      icon: Package,
      description: 'Gold consignment lifecycle management, export permits, gross & fine weight verification.',
      relatedEntities: ['Shipment', 'GoldPackage', 'Location'],
      requiredPermissions: ['shipment:read', 'shipment:create', 'shipment:update'],
      readinessNotes: [
        'PostgreSQL schema ready with check constraints for purity (0-1000‰)',
        'UUID v4 tracking number generation foundation verified',
        'State transition validation rules pre-configured for Phase 2 workflows',
      ],
    },
    {
      key: 'tracking',
      label: 'Tracking',
      icon: Navigation,
      description: 'Authorized GPS waypoints, IoT sensor seal verification, and geofence checkpoint scans.',
      relatedEntities: ['TrackingEvent', 'Location', 'Shipment'],
      requiredPermissions: ['tracking:read', 'tracking:write_telemetry'],
      readinessNotes: [
        'Telemetry schema ready with latitude/longitude boundary checks (-90..90, -180..180)',
        'SHA-256 signature verification for IoT sensor hardware pings',
        'Strict tenant-authorized GPS coordinate access control',
      ],
    },
    {
      key: 'custody',
      label: 'Chain of Custody',
      icon: Link2,
      description: 'Dual-party digital handshakes, witness verification, and unbroken chain of responsibility.',
      relatedEntities: ['CustodyTransfer', 'Shipment', 'User', 'Location'],
      requiredPermissions: ['custody:initiate', 'custody:accept', 'custody:witness'],
      readinessNotes: [
        'Schema supports digital signature timestamps and witness user IDs',
        'Gross weight and seal number cross-examination attributes defined',
        'Append-only audit record integration established on custody transition',
      ],
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: FileText,
      description: 'Encrypted storage vault for Air Waybills, assay reports, and customs export clearances.',
      relatedEntities: ['Document', 'Shipment', 'Organization'],
      requiredPermissions: ['document:read', 'document:upload', 'document:verify_customs'],
      readinessNotes: [
        'Storage key partitioning: organizations/{orgId}/shipments/{shipmentId}/{category}/',
        'Short-lived pre-signed download and upload URL abstraction',
        'SHA-256 checksum integrity verification and MIME type security filtering',
      ],
    },
    {
      key: 'alerts',
      label: 'Alerts',
      icon: AlertTriangle,
      description: 'Security exceptions, seal breach alerts, route deviation alerts, and customs inspection holds.',
      relatedEntities: ['Incident', 'Notification', 'Shipment'],
      requiredPermissions: ['incident:report', 'incident:investigate', 'incident:resolve'],
      readinessNotes: [
        'Incident classification schema (SEAL_BROKEN, ROUTE_DEVIATION, WEIGHT_DISCREPANCY)',
        'Priority routing and notification recipient foreign keys established',
        'Immediate audit log trigger on severity escalation',
      ],
    },
    {
      key: 'security',
      label: 'Security',
      icon: ShieldCheck,
      description: 'Row-Level Security (RLS) policies, cross-organization boundary rules, and token rotation.',
      relatedEntities: ['Role', 'AuditLog', 'User'],
      requiredPermissions: ['admin:system_settings', 'audit:read_all'],
      readinessNotes: [
        '10-role RBAC permission matrix active and fail-closed',
        'Multi-tenant boundary guard preventing unauthorized data leakage',
        'Strict password hashing abstraction with zero plaintext storage',
      ],
    },
    {
      key: 'administration',
      label: 'Administration',
      icon: Settings,
      description: 'Licensed bullion organization management, user onboarding, and compliance credentials.',
      relatedEntities: ['Organization', 'User', 'Role', 'AuditLog'],
      requiredPermissions: ['admin:manage_all_orgs', 'admin:manage_org_users'],
      readinessNotes: [
        'Tenant organization CRUD schema with LBMA license number validation',
        'User role assignment with MFA enforcement attributes',
        'Admin action immutable audit logging',
      ],
    },
  ];

  const currentNav = navigationItems.find(item => item.key === activeModule) || navigationItems[0];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-md">
        {/* Tenant Organization Switcher */}
        <div className="p-4 border-b border-slate-800/80">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-amber-400" />
            <span>Active Tenant Org</span>
          </label>
          <div className="relative">
            <select
              value={activeOrgId}
              onChange={(e) => onOrgChange(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-800 bg-slate-900/90 py-2 pl-3 pr-8 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              {SEED_ORGANIZATIONS.map(org => (
                <option key={org.id} value={org.id} className="bg-slate-900 text-slate-200">
                  {org.tradingName || org.legalName}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="mt-1.5 text-[10px] text-slate-400 truncate">
            Type: <span className="text-amber-400/80">{activeOrg.type}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            System Modules
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveModule(item.key)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/30'
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300">Phase 1 Guard:</span>
            <span className="text-[10px] rounded bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 border border-emerald-500/20">
              Active
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            Multi-Tenant Isolation enforced server-side.
          </div>
          <button
            onClick={onReturnToLanding}
            className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-400" />
            <span>Exit to Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Operational Bar */}
        <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <span className="text-xs text-slate-400 font-mono">AURUMTRACK / CONSOLE / </span>
              <span className="text-xs font-bold text-amber-400 font-mono uppercase">{activeModule}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Role Switcher in Top Bar */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs">
              <UserCheck className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-slate-400 hidden sm:inline">Active Role:</span>
              <select
                value={activeRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent font-medium text-amber-300 focus:outline-none cursor-pointer text-xs"
              >
                {Object.values(UserRole).map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-slate-200">
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-900 p-4 space-y-2">
            <div className="text-xs font-semibold text-slate-400 mb-2">Switch Module</div>
            <div className="grid grid-cols-2 gap-2">
              {navigationItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveModule(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-lg text-xs font-medium text-left ${
                    activeModule === item.key
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Module Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeModule === 'dashboard' ? (
            <DashboardModule activeRole={activeRole} activeOrgName={activeOrg.legalName} />
          ) : (
            <ModulePlaceholder
              moduleKey={currentNav.key}
              title={currentNav.label}
              description={currentNav.description}
              relatedEntities={currentNav.relatedEntities}
              requiredPermissions={currentNav.requiredPermissions}
              activeRole={activeRole}
              activeOrgName={activeOrg.legalName}
              phase1ReadinessNotes={currentNav.readinessNotes}
            />
          )}
        </main>
      </div>
    </div>
  );
};
