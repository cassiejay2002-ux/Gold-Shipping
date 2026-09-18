/**
 * AurumTrack - Centralized Input Validation & Sanitization
 * Zero-Trust verification of IDs, coordinates, gold metrics, and payload formats.
 */

import { ValidationError } from '../logging/logger.js';

// Regex for strict UUID v4 verification
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ISO 8601 UTC Timestamp regex
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

export class Validator {
  /**
   * Validates that a string is a strictly compliant UUID v4.
   */
  public static validateUuid(value: unknown, fieldName = 'id'): string {
    if (typeof value !== 'string' || !UUID_V4_REGEX.test(value)) {
      throw new ValidationError(`Field '${fieldName}' must be a valid UUID v4 format.`);
    }
    return value;
  }

  /**
   * Validates GPS Latitude (-90.0 to 90.0)
   */
  public static validateLatitude(value: unknown, fieldName = 'latitude'): number {
    const num = Number(value);
    if (isNaN(num) || num < -90 || num > 90) {
      throw new ValidationError(`Field '${fieldName}' must be a valid latitude between -90.0 and 90.0.`);
    }
    return num;
  }

  /**
   * Validates GPS Longitude (-180.0 to 180.0)
   */
  public static validateLongitude(value: unknown, fieldName = 'longitude'): number {
    const num = Number(value);
    if (isNaN(num) || num < -180 || num > 180) {
      throw new ValidationError(`Field '${fieldName}' must be a valid longitude between -180.0 and 180.0.`);
    }
    return num;
  }

  /**
   * Validates gold weight in grams (strictly positive number)
   */
  public static validateWeightGrams(value: unknown, fieldName = 'weightGrams'): number {
    const num = Number(value);
    if (isNaN(num) || num <= 0 || !isFinite(num)) {
      throw new ValidationError(`Field '${fieldName}' must be a strictly positive number representing weight in grams.`);
    }
    return num;
  }

  /**
   * Validates gold fineness/purity (0.0 to 1000.0 per mil or parts per thousand)
   * e.g., 999.9 for four-nines investment bullion, 995.0 for Good Delivery.
   */
  public static validateFineness(value: unknown, fieldName = 'finenessPurityPerMil'): number {
    const num = Number(value);
    if (isNaN(num) || num <= 0 || num > 1000) {
      throw new ValidationError(`Field '${fieldName}' must be a purity fineness between 0.1 and 1000.0.`);
    }
    return num;
  }

  /**
   * Validates ISO-8601 UTC timestamp format.
   */
  public static validateTimestamp(value: unknown, fieldName = 'timestamp'): string {
    if (typeof value !== 'string' || !ISO_TIMESTAMP_REGEX.test(value)) {
      throw new ValidationError(`Field '${fieldName}' must be an ISO-8601 UTC formatted timestamp string.`);
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError(`Field '${fieldName}' contains an invalid calendar date.`);
    }
    return value;
  }

  /**
   * Validates string constraints (trimming, min/max length, and control-character sanitization)
   */
  public static validateString(
    value: unknown,
    fieldName: string,
    options: { min?: number; max?: number; allowEmpty?: boolean } = {}
  ): string {
    if (typeof value !== 'string') {
      throw new ValidationError(`Field '${fieldName}' must be a string.`);
    }
    const trimmed = value.trim();
    if (!options.allowEmpty && trimmed.length === 0) {
      throw new ValidationError(`Field '${fieldName}' cannot be empty.`);
    }
    if (options.min !== undefined && trimmed.length < options.min) {
      throw new ValidationError(`Field '${fieldName}' must be at least ${options.min} characters.`);
    }
    if (options.max !== undefined && trimmed.length > options.max) {
      throw new ValidationError(`Field '${fieldName}' cannot exceed ${options.max} characters.`);
    }
    // Prevent non-printable control characters
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(trimmed)) {
      throw new ValidationError(`Field '${fieldName}' contains invalid control characters.`);
    }
    return trimmed;
  }

  /**
   * Validates enum value against allowed membership.
   */
  public static validateEnum<T extends string>(
    value: unknown,
    allowedValues: Record<string, T> | T[],
    fieldName: string
  ): T {
    const validList = Array.isArray(allowedValues) ? allowedValues : Object.values(allowedValues);
    if (typeof value !== 'string' || !validList.includes(value as T)) {
      throw new ValidationError(
        `Field '${fieldName}' has an invalid value. Allowed: ${validList.join(', ')}`
      );
    }
    return value as T;
  }

  /**
   * Validates file upload metadata before binary acceptance.
   */
  public static validateFileMetadata(meta: {
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    allowedMimeTypes: string[];
    maxFileSizeBytes: number;
  }): void {
    if (!meta.fileName || meta.fileName.length > 255) {
      throw new ValidationError('File name must be provided and under 255 characters.');
    }
    // Disallow path traversal sequences
    if (meta.fileName.includes('..') || meta.fileName.includes('/') || meta.fileName.includes('\\')) {
      throw new ValidationError('File name contains invalid path characters.');
    }
    if (meta.fileSizeBytes <= 0) {
      throw new ValidationError('File size must be greater than 0 bytes.');
    }
    if (meta.fileSizeBytes > meta.maxFileSizeBytes) {
      throw new ValidationError(
        `File size (${Math.round(meta.fileSizeBytes / 1024 / 1024)}MB) exceeds maximum limit of ${Math.round(meta.maxFileSizeBytes / 1024 / 1024)}MB.`
      );
    }
    if (!meta.allowedMimeTypes.includes(meta.mimeType)) {
      throw new ValidationError(
        `MIME type '${meta.mimeType}' is not permitted. Allowed: ${meta.allowedMimeTypes.join(', ')}`
      );
    }
  }
}
