/**
 * AurumTrack - Phase 1 Foundation Server
 * Full-Stack Express Server with Vite integration, security middlewares,
 * centralized validation, RBAC enforcement, and audit trail services.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { config } from './src/config/index.js';
import { logger } from './src/services/logging/logger.js';
import {
  correlationIdMiddleware,
  securityHeadersMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  safeErrorHandlerMiddleware,
} from './src/server/middleware/security.js';
import { ROLE_PERMISSIONS, getPermissionsForRole, assertPermission, assertOrganizationAccess } from './src/services/auth/rbacService.js';
import { authService } from './src/services/auth/authService.js';
import { auditLogService } from './src/services/audit/auditLogService.js';
import { storageService } from './src/services/storage/storageService.js';
import { Validator } from './src/services/validation/validator.js';
import { UserRole, AuditActionType, DocumentCategory } from './src/types/entities.js';
import {
  SEED_ORGANIZATIONS,
  SEED_USERS,
  SEED_SHIPMENTS,
  SEED_GOLD_PACKAGES,
  SEED_TRACKING_EVENTS,
  SEED_CUSTODY_TRANSFERS,
  SEED_DOCUMENTS,
} from './src/services/data/repositories.js';

async function seedInitialAuditChain() {
  await auditLogService.record({
    organizationId: SEED_ORGANIZATIONS[0].id,
    userId: SEED_USERS[4].id,
    action: AuditActionType.ADMIN_SETTING_CHANGED,
    entityType: 'SYSTEM_GENESIS',
    entityId: '00000000-0000-0000-0000-000000000000',
    correlationId: 'genesis-boot-001',
    metadata: {
      frameworkVersion: '1.0.0-phase1',
      platform: 'AurumTrack Secure Gold Logistics',
      complianceStandard: 'LBMA Responsible Gold & OECD Due Diligence',
      encryptionStandard: 'AES-256-GCM / SHA-256 Chain',
    },
  });

  await auditLogService.record({
    organizationId: SEED_ORGANIZATIONS[0].id,
    userId: SEED_USERS[0].id,
    action: AuditActionType.SHIPMENT_CREATED,
    entityType: 'SHIPMENT',
    entityId: SEED_SHIPMENTS[0].id,
    correlationId: 'req_seed_002',
    metadata: {
      trackingNumber: SEED_SHIPMENTS[0].trackingNumber,
      declaredValueUsd: SEED_SHIPMENTS[0].declaredValueUsd,
      grossWeightGrams: SEED_SHIPMENTS[0].grossWeightGrams,
    },
  });

  await auditLogService.record({
    organizationId: SEED_ORGANIZATIONS[0].id,
    userId: SEED_USERS[0].id,
    action: AuditActionType.CUSTODY_TRANSFER_INITIATED,
    entityType: 'CUSTODY_TRANSFER',
    entityId: SEED_CUSTODY_TRANSFERS[0].id,
    correlationId: 'req_seed_003',
    metadata: {
      fromOrg: SEED_ORGANIZATIONS[0].legalName,
      toOrg: SEED_ORGANIZATIONS[2].legalName,
      status: SEED_CUSTODY_TRANSFERS[0].status,
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize genesis audit chain
  await seedInitialAuditChain();

  // 1. Core Parsers & Global Security Middlewares
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(correlationIdMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(corsMiddleware);

  // Request audit logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (!req.path.startsWith('/@') && !req.path.startsWith('/src/')) {
        logger.info('HTTP_ACCESS', `${req.method} ${req.path} ${res.statusCode} (${Date.now() - start}ms)`, {
          requestId: req.correlationId,
          context: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            ip: req.ip,
          },
        });
      }
    });
    next();
  });

  // ====================================================================
  // API ROUTE DEFINITIONS
  // ====================================================================

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'HEALTHY',
      service: 'AurumTrack Logistics Core',
      phase: 'Phase 1 - Foundation & System Architecture',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: config.env,
      security: {
        secureHeaders: true,
        rateLimiterActive: true,
        zeroTrustValidation: true,
        tamperSealChain: 'ACTIVE',
      },
    });
  });

  // Architecture manifest endpoint
  app.get('/api/v1/system/architecture', rateLimitMiddleware, (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        platform: 'AurumTrack',
        version: '1.0.0-phase1',
        description: 'Secure gold shipping and logistics platform foundation',
        entities: [
          'User',
          'Organization',
          'Role',
          'Shipment',
          'GoldPackage',
          'TrackingEvent',
          'CustodyTransfer',
          'Location',
          'Document',
          'Incident',
          'Notification',
          'AuditLog',
        ],
        roles: Object.values(UserRole),
        database: {
          engine: 'PostgreSQL / Supabase Ready',
          features: [
            'UUID v4 Entity Keys',
            'UTC ISO-8601 Timestamps',
            'Row Level Security (RLS) Multi-Tenant Policies',
            'Foreign Key Referential Integrity',
            'Check Constraints for Gold Metrics & Coordinates',
          ],
        },
        securityControls: {
          authentication: 'Abstracted Provider with Secure Password Hasher & Ephemeral Session Tokens',
          authorization: 'Strict 10-Role RBAC with Fail-Closed Decision Engine',
          tenantIsolation: 'Multi-Tenant Cryptographic Boundaries (Database RLS + Server-Side Guard)',
          auditTrail: 'Immutable Append-Only Audit Log with SHA-256 Tamper Seals',
          storage: 'Partitioned Object Key Structure with Short-Lived Signed URLs',
          logging: 'Structured JSON Logging with Recursive Secret Redaction',
        },
      },
      requestId: req.correlationId,
    });
  });

  // RBAC Permission Matrix endpoint
  app.get('/api/v1/system/rbac', rateLimitMiddleware, (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        roles: Object.values(UserRole),
        matrix: ROLE_PERMISSIONS,
      },
      requestId: req.correlationId,
    });
  });

  // Database Schema Summary endpoint
  app.get('/api/v1/system/schema', rateLimitMiddleware, (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        tablesCount: 11,
        rlsEnabledTables: [
          'shipments',
          'gold_packages',
          'tracking_events',
          'custody_transfers',
          'documents',
          'incidents',
          'audit_logs',
        ],
        referenceSeedCounts: {
          organizations: SEED_ORGANIZATIONS.length,
          users: SEED_USERS.length,
          shipments: SEED_SHIPMENTS.length,
          goldPackages: SEED_GOLD_PACKAGES.length,
          trackingEvents: SEED_TRACKING_EVENTS.length,
          custodyTransfers: SEED_CUSTODY_TRANSFERS.length,
          documents: SEED_DOCUMENTS.length,
        },
      },
      requestId: req.correlationId,
    });
  });

  // Demo Auth Session Creator (Allows testing any of the 10 roles in the shell)
  app.post('/api/v1/auth/session/demo', rateLimitMiddleware, async (req: Request, res: Response, next) => {
    try {
      const requestedRole = req.body?.role as UserRole;
      const validRoles = Object.values(UserRole);

      const targetRole = validRoles.includes(requestedRole) ? requestedRole : UserRole.EXPORTER;
      const targetUser = SEED_USERS.find(u => u.role === targetRole) || {
        ...SEED_USERS[0],
        role: targetRole,
        fullName: `Demo ${targetRole.replace(/_/g, ' ')}`,
      };

      const targetOrg = SEED_ORGANIZATIONS[0];
      const session = await authService.createSession(targetUser, targetOrg);

      res.json({
        success: true,
        data: {
          token: session.token,
          expiresAt: session.expiresAt,
          user: session.user,
          organization: session.organization,
          permissions: getPermissionsForRole(targetUser.role),
        },
        requestId: req.correlationId,
      });
    } catch (err) {
      next(err);
    }
  });

  // Verify Active Session
  app.get('/api/v1/auth/context', async (req: Request, res: Response, next) => {
    try {
      const authHeader = req.header('authorization');
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'No authorization header provided', requestId: req.correlationId },
        });
      }

      const context = await authService.authenticate(authHeader, req.correlationId);
      res.json({
        success: true,
        data: {
          user: context.user,
          organization: context.organization,
          roles: context.roles,
          permissions: context.permissions,
        },
        requestId: req.correlationId,
      });
    } catch (err) {
      next(err);
    }
  });

  // Audit Logs listing
  app.get('/api/v1/audit/logs', rateLimitMiddleware, async (req: Request, res: Response, next) => {
    try {
      const logs = await auditLogService.listAll(50);
      res.json({
        success: true,
        data: logs,
        count: logs.length,
        requestId: req.correlationId,
      });
    } catch (err) {
      next(err);
    }
  });

  // Cryptographic Chain Verification endpoint
  app.post('/api/v1/audit/verify', rateLimitMiddleware, async (req: Request, res: Response, next) => {
    try {
      const result = await auditLogService.verifyIntegrityChain();
      res.json({
        success: true,
        data: {
          chainValid: result.valid,
          totalBlocksVerified: result.totalChecked,
          tamperDetected: !result.valid,
          brokenIndex: result.brokenIndex,
          sealAlgorithm: 'SHA-256 Linked Block Chain',
        },
        requestId: req.correlationId,
      });
    } catch (err) {
      next(err);
    }
  });

  // Storage Key & Signed URL Generator test endpoint
  app.post('/api/v1/storage/validate-path', rateLimitMiddleware, async (req: Request, res: Response, next) => {
    try {
      const { organizationId, shipmentId, category, fileName, fileSizeBytes, mimeType } = req.body;

      const signedTicket = await storageService.createSignedUploadUrl({
        organizationId: organizationId || SEED_ORGANIZATIONS[0].id,
        shipmentId: shipmentId || SEED_SHIPMENTS[0].id,
        category: category || DocumentCategory.AIR_WAYBILL,
        documentId: 'doc-' + Math.random().toString(36).substring(2, 9),
        fileName: fileName || 'sample_air_waybill_2026.pdf',
        fileSizeBytes: Number(fileSizeBytes) || 1024 * 512,
        mimeType: mimeType || 'application/pdf',
      });

      res.json({
        success: true,
        data: signedTicket,
        requestId: req.correlationId,
      });
    } catch (err) {
      next(err);
    }
  });

  // Centralized Validation Test endpoint
  app.post('/api/v1/validation/test', rateLimitMiddleware, (req: Request, res: Response, next) => {
    try {
      const body = req.body;
      const tested: Record<string, unknown> = {};

      if (body.uuid !== undefined) {
        tested.uuid = Validator.validateUuid(body.uuid, 'uuid');
      }
      if (body.latitude !== undefined) {
        tested.latitude = Validator.validateLatitude(body.latitude, 'latitude');
      }
      if (body.longitude !== undefined) {
        tested.longitude = Validator.validateLongitude(body.longitude, 'longitude');
      }
      if (body.weightGrams !== undefined) {
        tested.weightGrams = Validator.validateWeightGrams(body.weightGrams, 'weightGrams');
      }
      if (body.fineness !== undefined) {
        tested.fineness = Validator.validateFineness(body.fineness, 'fineness');
      }
      if (body.timestamp !== undefined) {
        tested.timestamp = Validator.validateTimestamp(body.timestamp, 'timestamp');
      }

      res.json({
        success: true,
        message: 'All validation criteria met according to zero-trust rules.',
        validatedData: tested,
        requestId: req.correlationId,
      });
    } catch (err) {
      next(err);
    }
  });

  // Catch unhandled API routes with 404
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ENDPOINT_NOT_FOUND',
        message: `API endpoint '${req.method} ${req.path}' does not exist.`,
        requestId: req.correlationId,
      },
    });
  });

  // Safe Centralized Error Handling for API
  app.use(safeErrorHandlerMiddleware);

  // ====================================================================
  // Vite Integration (Development Middleware / Production Static)
  // ====================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info('SERVER_BOOT', `AurumTrack Platform listening on port ${PORT} (0.0.0.0)`, {
      context: { port: PORT, env: config.env },
    });
  });
}

startServer().catch(err => {
  logger.fatal('SERVER_BOOT_FAILED', `Failed to bootstrap AurumTrack server: ${err.message}`, {
    error: err,
  });
  process.exit(1);
});
