/**
 * AurumTrack - Role-Based Access Control (RBAC) & Multi-Tenant Isolation
 * Enforces least-privilege permissions and strict organization boundaries.
 */

import { UserRole, Shipment } from '../../types/entities.js';
import { AuthenticatedContext } from './types.js';
import { ForbiddenError, logger } from '../logging/logger.js';

export type Permission =
  // Shipment permissions
  | 'shipment:create'
  | 'shipment:read'
  | 'shipment:update'
  | 'shipment:delete'
  | 'shipment:dispatch'
  | 'shipment:deliver'
  // Package permissions
  | 'package:seal'
  | 'package:inspect'
  | 'package:assay_verify'
  // Custody transfer permissions
  | 'custody:initiate'
  | 'custody:witness'
  | 'custody:accept'
  | 'custody:dispute'
  // Tracking & GPS permissions
  | 'tracking:read'
  | 'tracking:write_telemetry'
  // Document permissions
  | 'document:read'
  | 'document:upload'
  | 'document:verify_customs'
  // Incident permissions
  | 'incident:report'
  | 'incident:investigate'
  | 'incident:resolve'
  // Audit & Compliance
  | 'audit:read_all'
  | 'audit:read_org'
  // Administrative permissions
  | 'admin:manage_org_users'
  | 'admin:manage_all_orgs'
  | 'admin:system_settings';

/**
 * Static RBAC Permission Matrix for all 10 Gold Logistics Roles.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    'shipment:create', 'shipment:read', 'shipment:update', 'shipment:delete', 'shipment:dispatch', 'shipment:deliver',
    'package:seal', 'package:inspect', 'package:assay_verify',
    'custody:initiate', 'custody:witness', 'custody:accept', 'custody:dispute',
    'tracking:read', 'tracking:write_telemetry',
    'document:read', 'document:upload', 'document:verify_customs',
    'incident:report', 'incident:investigate', 'incident:resolve',
    'audit:read_all', 'audit:read_org',
    'admin:manage_org_users', 'admin:manage_all_orgs', 'admin:system_settings',
  ],

  [UserRole.ADMIN]: [
    'shipment:create', 'shipment:read', 'shipment:update', 'shipment:dispatch',
    'package:seal', 'package:inspect',
    'custody:initiate', 'custody:accept',
    'tracking:read',
    'document:read', 'document:upload',
    'incident:report', 'incident:investigate',
    'audit:read_org',
    'admin:manage_org_users',
  ],

  [UserRole.EXPORTER]: [
    'shipment:create', 'shipment:read', 'shipment:update',
    'package:seal', 'package:assay_verify',
    'custody:initiate',
    'tracking:read',
    'document:read', 'document:upload',
    'incident:report',
    'audit:read_org',
  ],

  [UserRole.SHIPMENT_MANAGER]: [
    'shipment:create', 'shipment:read', 'shipment:update', 'shipment:dispatch',
    'package:seal', 'package:inspect',
    'custody:initiate', 'custody:accept',
    'tracking:read', 'tracking:write_telemetry',
    'document:read', 'document:upload',
    'incident:report', 'incident:investigate',
    'audit:read_org',
  ],

  [UserRole.LOGISTICS_OPERATOR]: [
    'shipment:read', 'shipment:dispatch',
    'package:inspect',
    'custody:initiate', 'custody:accept',
    'tracking:read', 'tracking:write_telemetry',
    'document:read', 'document:upload',
    'incident:report',
  ],

  [UserRole.SECURITY_ESCORT]: [
    'shipment:read',
    'package:inspect',
    'custody:witness',
    'tracking:read', 'tracking:write_telemetry',
    'document:read',
    'incident:report',
  ],

  [UserRole.CUSTOMS_OFFICER]: [
    'shipment:read',
    'package:inspect',
    'custody:witness',
    'tracking:read',
    'document:read', 'document:verify_customs',
    'incident:report',
  ],

  [UserRole.RECEIVER]: [
    'shipment:read', 'shipment:deliver',
    'package:inspect',
    'custody:accept', 'custody:dispute',
    'tracking:read',
    'document:read',
    'incident:report',
    'audit:read_org',
  ],

  [UserRole.AUDITOR]: [
    'shipment:read',
    'package:inspect',
    'tracking:read',
    'document:read',
    'incident:investigate',
    'audit:read_all', 'audit:read_org',
  ],

  [UserRole.CLIENT]: [
    'shipment:read',
    'tracking:read',
    'document:read',
  ],
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Validates whether an authenticated context possesses a required permission.
 * Fails closed if not found.
 */
export function assertPermission(context: AuthenticatedContext, permission: Permission): void {
  const hasPerm = context.permissions.includes(permission);
  if (!hasPerm) {
    logger.warn('RBAC_PERMISSION_DENIED', `User ${context.user.id} denied permission '${permission}'`, {
      organizationId: context.organization.id,
      userId: context.user.id,
      context: { role: context.user.role, requiredPermission: permission },
    });
    throw new ForbiddenError(`Insufficient role privileges. Required permission: '${permission}'`);
  }
}

/**
 * Strict Multi-Organization Isolation Boundary Guard.
 * Ensures a user cannot access or modify resources belonging to another organization,
 * unless they are a cross-organization party (e.g. shipper, receiver, carrier, escort)
 * or hold global SUPER_ADMIN / AUDITOR privileges.
 */
export function assertOrganizationAccess(
  context: AuthenticatedContext,
  resourceOrgId: string,
  authorizedParticipantOrgIds: string[] = []
): void {
  // 1. Global Super Admin and Auditor can inspect across boundaries
  if (context.roles.includes(UserRole.SUPER_ADMIN) || context.roles.includes(UserRole.AUDITOR)) {
    return;
  }

  // 2. Direct tenant ownership
  if (context.organization.id === resourceOrgId) {
    return;
  }

  // 3. Authorized shipment participant (e.g. shipper <-> receiver <-> carrier)
  if (authorizedParticipantOrgIds.includes(context.organization.id)) {
    return;
  }

  logger.warn('ORG_ISOLATION_VIOLATION', `Cross-organization boundary breach blocked for user ${context.user.id}`, {
    organizationId: context.organization.id,
    userId: context.user.id,
    context: {
      userOrgId: context.organization.id,
      targetOrgId: resourceOrgId,
      authorizedOrgs: authorizedParticipantOrgIds,
    },
  });

  throw new ForbiddenError('Access Denied: You do not have authorization to view this organization\'s gold assets.');
}

/**
 * Checks if a user has access to a specific shipment based on organization roles.
 */
export function assertShipmentAccess(context: AuthenticatedContext, shipment: Shipment): void {
  const participantOrgs = [
    shipment.shipperOrgId,
    shipment.receiverOrgId,
    shipment.carrierOrgId,
  ].filter(Boolean) as string[];

  assertOrganizationAccess(context, shipment.shipperOrgId, participantOrgs);
}
