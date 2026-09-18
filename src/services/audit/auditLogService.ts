/**
 * AurumTrack - Audit Log Service & Append-Only Traceability
 * Provides immutable, tamper-evident audit logging for all gold logistics actions.
 */

import { AuditLog, AuditActionType } from '../../types/entities.js';
import { logger, sanitizeContext } from '../logging/logger.js';

export interface CreateAuditRecordInput {
  organizationId: string;
  userId?: string;
  action: AuditActionType;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface IAuditLogService {
  record(input: CreateAuditRecordInput): Promise<AuditLog>;
  listForOrganization(organizationId: string, limit?: number): Promise<AuditLog[]>;
  verifyIntegrityChain(): Promise<{ valid: boolean; totalChecked: number; brokenIndex?: number }>;
}

export class AuditLogService implements IAuditLogService {
  private logStore: AuditLog[] = [];
  private lastBlockHash = 'GENESIS_AURUM_CHAIN_BLOCK_0000000000000000000000000000000000000000';

  /**
   * Computes a SHA-256 tamper-evident cryptographic seal linking the prior block hash
   * to the current log payload.
   */
  private async computeTamperSeal(payloadString: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(this.lastBlockHash + '::' + payloadString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public async record(input: CreateAuditRecordInput): Promise<AuditLog> {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const id = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const uuid = `${id.substring(0, 8)}-${id.substring(8, 12)}-4${id.substring(13, 16)}-8${id.substring(17, 20)}-${id.substring(20, 32)}`;

    const sanitizedBefore = input.beforeState ? (sanitizeContext(input.beforeState) as Record<string, unknown>) : undefined;
    const sanitizedAfter = input.afterState ? (sanitizeContext(input.afterState) as Record<string, unknown>) : undefined;
    const sanitizedMeta = input.metadata ? (sanitizeContext(input.metadata) as Record<string, unknown>) : undefined;

    const createdAt = new Date().toISOString();

    const payloadToSign = JSON.stringify({
      id: uuid,
      organizationId: input.organizationId,
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      correlationId: input.correlationId,
      createdAt,
    });

    const tamperSealHash = await this.computeTamperSeal(payloadToSign);
    this.lastBlockHash = tamperSealHash;

    const logRecord: AuditLog = {
      id: uuid,
      organizationId: input.organizationId,
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      correlationId: input.correlationId,
      beforeState: sanitizedBefore,
      afterState: sanitizedAfter,
      metadata: sanitizedMeta,
      tamperSealHash,
      createdAt,
    };

    // Append-only guarantee (Object.freeze prevents modification in memory)
    Object.freeze(logRecord);
    this.logStore.push(logRecord);

    logger.info('AUDIT_RECORD_COMMITTED', `Audit entry ${input.action} recorded for ${input.entityType}:${input.entityId}`, {
      organizationId: input.organizationId,
      userId: input.userId,
      requestId: input.correlationId,
      context: {
        auditId: uuid,
        tamperSealHash: tamperSealHash.substring(0, 16) + '...',
      },
    });

    return logRecord;
  }

  public async listForOrganization(organizationId: string, limit = 50): Promise<AuditLog[]> {
    return this.logStore
      .filter(entry => entry.organizationId === organizationId)
      .slice(-limit)
      .reverse();
  }

  public async listAll(limit = 100): Promise<AuditLog[]> {
    return this.logStore.slice(-limit).reverse();
  }

  /**
   * Verifies the cryptographic integrity of the entire audit chain.
   */
  public async verifyIntegrityChain(): Promise<{ valid: boolean; totalChecked: number; brokenIndex?: number }> {
    let previousHash = 'GENESIS_AURUM_CHAIN_BLOCK_0000000000000000000000000000000000000000';
    const encoder = new TextEncoder();

    for (let i = 0; i < this.logStore.length; i++) {
      const entry = this.logStore[i];
      const payloadToSign = JSON.stringify({
        id: entry.id,
        organizationId: entry.organizationId,
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        correlationId: entry.correlationId,
        createdAt: entry.createdAt,
      });

      const data = encoder.encode(previousHash + '::' + payloadToSign);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const calculatedHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (calculatedHash !== entry.tamperSealHash) {
        return { valid: false, totalChecked: i, brokenIndex: i };
      }
      previousHash = entry.tamperSealHash;
    }

    return { valid: true, totalChecked: this.logStore.length };
  }
}

export const auditLogService = new AuditLogService();
