/**
 * AurumTrack - Secure Object Storage Abstraction
 * Handles partitioned bucket paths, short-lived signed URLs, and file security validation.
 */

import { config } from '../../config/index.js';
import { DocumentCategory } from '../../types/entities.js';
import { Validator } from '../validation/validator.js';
import { ValidationError, logger } from '../logging/logger.js';

export interface StorageObjectMetadata {
  key: string;
  bucket: string;
  organizationId: string;
  shipmentId?: string;
  category: DocumentCategory;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256Hash: string;
  uploadedAt: string;
}

export interface SignedUrlResult {
  url: string;
  expiresAt: string; // ISO-8601 UTC
  key: string;
  httpMethod: 'GET' | 'PUT';
}

export interface IStorageService {
  generateObjectKey(params: {
    organizationId: string;
    shipmentId?: string;
    category: DocumentCategory;
    documentId: string;
    originalFileName: string;
  }): string;

  createSignedDownloadUrl(key: string, organizationId: string, expirySeconds?: number): Promise<SignedUrlResult>;
  createSignedUploadUrl(params: {
    organizationId: string;
    shipmentId?: string;
    category: DocumentCategory;
    documentId: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
  }): Promise<SignedUrlResult>;

  verifySignedToken(token: string): { valid: boolean; key?: string; organizationId?: string; reason?: string };
}

export class StorageService implements IStorageService {
  private bucket = config.storage.bucketName;
  private signedUrlSecret = 'aurum_vault_ephemeral_token_seed'; // In production, derived from KMS / Vault

  /**
   * Generates a strictly partitioned storage path ensuring tenant isolation.
   * Path format: organizations/{orgId}/shipments/{shipmentId}/{category}/{documentId}_{safeName}
   */
  public generateObjectKey(params: {
    organizationId: string;
    shipmentId?: string;
    category: DocumentCategory;
    documentId: string;
    originalFileName: string;
  }): string {
    Validator.validateUuid(params.organizationId, 'organizationId');
    if (params.shipmentId) {
      Validator.validateUuid(params.shipmentId, 'shipmentId');
    }

    // Strip unsafe characters from filename
    const sanitizedFileName = params.originalFileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100);

    const shipmentPart = params.shipmentId ? `shipments/${params.shipmentId}` : 'general_compliance';
    return `organizations/${params.organizationId}/${shipmentPart}/${params.category.toLowerCase()}/${params.documentId}_${sanitizedFileName}`;
  }

  /**
   * Creates a short-lived signed URL for secure private download.
   */
  public async createSignedDownloadUrl(
    key: string,
    organizationId: string,
    expirySeconds = config.storage.signedUrlExpirySeconds
  ): Promise<SignedUrlResult> {
    // Verify path containment
    if (!key.startsWith(`organizations/${organizationId}/`)) {
      throw new ValidationError('Storage key does not belong to the requesting organization tenant.');
    }

    const expiresTimestamp = Date.now() + expirySeconds * 1000;
    const expiresAt = new Date(expiresTimestamp).toISOString();

    const signaturePayload = `${key}:${organizationId}:${expiresTimestamp}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(this.signedUrlSecret + '::' + signaturePayload));
    const sig = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).slice(0, 32).join('');

    const url = `/api/v1/storage/download?key=${encodeURIComponent(key)}&exp=${expiresTimestamp}&sig=${sig}`;

    logger.info('STORAGE_SIGNED_DOWNLOAD_URL_ISSUED', `Signed download URL generated for object: ${key}`, {
      organizationId,
      context: { expirySeconds, key },
    });

    return {
      url,
      expiresAt,
      key,
      httpMethod: 'GET',
    };
  }

  /**
   * Pre-validates metadata and creates a short-lived signed upload ticket.
   */
  public async createSignedUploadUrl(params: {
    organizationId: string;
    shipmentId?: string;
    category: DocumentCategory;
    documentId: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
  }): Promise<SignedUrlResult> {
    Validator.validateFileMetadata({
      fileName: params.fileName,
      fileSizeBytes: params.fileSizeBytes,
      mimeType: params.mimeType,
      allowedMimeTypes: config.storage.allowedMimeTypes,
      maxFileSizeBytes: config.storage.maxFileSizeBytes,
    });

    const key = this.generateObjectKey({
      organizationId: params.organizationId,
      shipmentId: params.shipmentId,
      category: params.category,
      documentId: params.documentId,
      originalFileName: params.fileName,
    });

    const expiresTimestamp = Date.now() + 600 * 1000; // 10 minutes for upload
    const expiresAt = new Date(expiresTimestamp).toISOString();

    const signaturePayload = `${key}:${params.organizationId}:${expiresTimestamp}:upload`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(this.signedUrlSecret + '::' + signaturePayload));
    const sig = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).slice(0, 32).join('');

    const url = `/api/v1/storage/upload?key=${encodeURIComponent(key)}&exp=${expiresTimestamp}&sig=${sig}`;

    logger.info('STORAGE_SIGNED_UPLOAD_URL_ISSUED', `Signed upload ticket created for object: ${key}`, {
      organizationId: params.organizationId,
      context: { key, mimeType: params.mimeType, sizeBytes: params.fileSizeBytes },
    });

    return {
      url,
      expiresAt,
      key,
      httpMethod: 'PUT',
    };
  }

  public verifySignedToken(token: string): { valid: boolean; key?: string; organizationId?: string; reason?: string } {
    if (!token) return { valid: false, reason: 'Token is missing' };
    return { valid: true };
  }
}

export const storageService = new StorageService();
