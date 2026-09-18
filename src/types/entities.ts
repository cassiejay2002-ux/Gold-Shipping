/**
 * AurumTrack - Core Data Entities
 * Foundational domain models for Phase 1 System Architecture.
 * UUID primary keys, UTC ISO timestamps, and strict multi-tenant references.
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EXPORTER = 'EXPORTER',
  SHIPMENT_MANAGER = 'SHIPMENT_MANAGER',
  LOGISTICS_OPERATOR = 'LOGISTICS_OPERATOR',
  SECURITY_ESCORT = 'SECURITY_ESCORT',
  CUSTOMS_OFFICER = 'CUSTOMS_OFFICER',
  RECEIVER = 'RECEIVER',
  AUDITOR = 'AUDITOR',
  CLIENT = 'CLIENT',
}

export enum OrganizationType {
  MINING_OPERATOR = 'MINING_OPERATOR',
  REFINERY = 'REFINERY',
  LOGISTICS_CARRIER = 'LOGISTICS_CARRIER',
  SECURITY_VAULT = 'SECURITY_VAULT',
  CUSTOMS_BROKER = 'CUSTOMS_BROKER',
  REGULATORY_BODY = 'REGULATORY_BODY',
  FINANCIAL_INSTITUTION = 'FINANCIAL_INSTITUTION',
  BUYER = 'BUYER',
}

export enum ShipmentStatus {
  DRAFT = 'DRAFT',
  PENDING_DISPATCH = 'PENDING_DISPATCH',
  IN_TRANSIT = 'IN_TRANSIT',
  CUSTOMS_HOLD = 'CUSTOMS_HOLD',
  CUSTOMS_CLEARED = 'CUSTOMS_CLEARED',
  VAULT_SECURED = 'VAULT_SECURED',
  DELIVERED = 'DELIVERED',
  REJECTED = 'REJECTED',
  INCIDENT_FLAGGED = 'INCIDENT_FLAGGED',
}

export enum GoldBarForm {
  DORE_BAR = 'DORE_BAR',
  KILO_BAR_9999 = 'KILO_BAR_9999',
  GOOD_DELIVERY_400OZ = 'GOOD_DELIVERY_400OZ',
  GRAINS_GRANULES = 'GRAINS_GRANULES',
  COINS_ROUNDS = 'COINS_ROUNDS',
}

export enum CustodyTransferStatus {
  INITIATED = 'INITIATED',
  WITNESSED = 'WITNESSED',
  ACCEPTED = 'ACCEPTED',
  DISPUTED = 'DISPUTED',
  REJECTED = 'REJECTED',
}

export enum TrackingEventType {
  CHECKPOINT_SCAN = 'CHECKPOINT_SCAN',
  GPS_PERIODIC_PING = 'GPS_PERIODIC_PING',
  GEOFENCE_ENTER = 'GEOFENCE_ENTER',
  GEOFENCE_EXIT = 'GEOFENCE_EXIT',
  SEAL_VERIFIED = 'SEAL_VERIFIED',
  WEIGHT_VERIFIED = 'WEIGHT_VERIFIED',
  VAULT_ENTRY = 'VAULT_ENTRY',
  VAULT_EXIT = 'VAULT_EXIT',
  CUSTOMS_INSPECTION = 'CUSTOMS_INSPECTION',
}

export enum DocumentCategory {
  AIR_WAYBILL = 'AIR_WAYBILL',
  CERTIFICATE_OF_ORIGIN = 'CERTIFICATE_OF_ORIGIN',
  ASSAY_CERTIFICATE = 'ASSAY_CERTIFICATE',
  EXPORT_PERMIT = 'EXPORT_PERMIT',
  CUSTOMS_DECLARATION = 'CUSTOMS_DECLARATION',
  INSURANCE_CERTIFICATE = 'INSURANCE_CERTIFICATE',
  CHAIN_OF_CUSTODY_RECEIPT = 'CHAIN_OF_CUSTODY_RECEIPT',
  SECURITY_ESCORT_MANIFEST = 'SECURITY_ESCORT_MANIFEST',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

export enum AuditActionType {
  AUTH_LOGIN = 'AUTH_LOGIN',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_FAILED = 'AUTH_FAILED',
  SHIPMENT_CREATED = 'SHIPMENT_CREATED',
  SHIPMENT_UPDATED = 'SHIPMENT_UPDATED',
  SHIPMENT_STATUS_CHANGED = 'SHIPMENT_STATUS_CHANGED',
  PACKAGE_CREATED = 'PACKAGE_CREATED',
  PACKAGE_SEALED = 'PACKAGE_SEALED',
  CUSTODY_TRANSFER_INITIATED = 'CUSTODY_TRANSFER_INITIATED',
  CUSTODY_TRANSFER_COMPLETED = 'CUSTODY_TRANSFER_COMPLETED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_ACCESSED = 'DOCUMENT_ACCESSED',
  TRACKING_PING_RECEIVED = 'TRACKING_PING_RECEIVED',
  INCIDENT_REPORTED = 'INCIDENT_REPORTED',
  ROLE_PERMISSION_CHANGED = 'ROLE_PERMISSION_CHANGED',
  ADMIN_SETTING_CHANGED = 'ADMIN_SETTING_CHANGED',
}

// 1. Organization Entity (Tenant isolation root)
export interface Organization {
  id: string; // UUID v4
  legalName: string;
  tradingName?: string;
  registrationNumber: string;
  jurisdictionCountryCode: string; // ISO 3166-1 alpha-2
  type: OrganizationType;
  licenseNumber?: string;
  complianceStatus: 'ACTIVE' | 'PENDING_REVIEW' | 'SUSPENDED';
  primaryContactEmail: string;
  primaryContactPhone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  createdAt: string; // UTC ISO-8601
  updatedAt: string; // UTC ISO-8601
}

// 2. User Entity
export interface User {
  id: string; // UUID v4
  organizationId: string; // UUID v4 (Tenant FK)
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  phoneNumber?: string;
  jobTitle?: string;
  badgeNumber?: string;
  mfaEnabled: boolean;
  lastLoginAt?: string; // UTC ISO-8601
  createdAt: string; // UTC ISO-8601
  updatedAt: string; // UTC ISO-8601
}

// 3. Role & Permission Entity Definition
export interface RoleDefinition {
  role: UserRole;
  displayName: string;
  description: string;
  permissions: string[];
}

// 4. Location Entity (Reusable physical & tracking nodes)
export interface Location {
  id: string; // UUID v4
  organizationId?: string; // Optional owning organization
  name: string;
  facilityType: 'AIRPORT' | 'REFINERY' | 'VAULT' | 'CUSTOMS_POST' | 'MINING_SITE' | 'TRANSIT_HUB';
  countryCode: string; // ISO 3166-1 alpha-2
  city: string;
  address?: string;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  isHighSecurityZone: boolean;
  geofenceRadiusMeters?: number;
  createdAt: string; // UTC ISO-8601
  updatedAt: string; // UTC ISO-8601
}

// 5. Shipment Entity
export interface Shipment {
  id: string; // UUID v4
  trackingNumber: string; // E.g. AT-2026-X892-GLD
  shipperOrgId: string; // FK to Organization
  receiverOrgId: string; // FK to Organization
  carrierOrgId?: string; // FK to Organization
  status: ShipmentStatus;
  originLocationId: string; // FK to Location
  destinationLocationId: string; // FK to Location
  currentLocationId?: string; // FK to Location
  declaredValueUsd: number;
  currency: string; // USD, EUR, etc.
  grossWeightGrams: number;
  netPureGoldGrams: number;
  packageCount: number;
  dispatchEstimatedAt?: string; // UTC ISO-8601
  deliveryEstimatedAt?: string; // UTC ISO-8601
  actualDeliveredAt?: string; // UTC ISO-8601
  escortRequired: boolean;
  tamperSealIntact: boolean;
  exportPermitNumber?: string;
  complianceVerified: boolean;
  createdAt: string; // UTC ISO-8601
  updatedAt: string; // UTC ISO-8601
}

// 6. GoldPackage Entity (Child item within a Shipment)
export interface GoldPackage {
  id: string; // UUID v4
  shipmentId: string; // FK to Shipment
  packageBarcode: string; // Unique Barcode / RFID Tag
  tamperEvidentSealNumber: string;
  form: GoldBarForm;
  barSerialNumbers: string[]; // List of specific serial numbers
  finenessPurityPerMil: number; // e.g., 999.9 or 995.0
  grossWeightGrams: number;
  pureGoldWeightGrams: number;
  assayBatchNumber?: string;
  assayLaboratoryName?: string;
  containerType: 'ARMOURED_BOX' | 'SEALED_POUCH' | 'SECURITY_DRUM' | 'CRATE';
  status: 'PREPARED' | 'SEALED' | 'IN_TRANSIT' | 'VERIFIED' | 'DAMAGED';
  createdAt: string; // UTC ISO-8601
  updatedAt: string; // UTC ISO-8601
}

// 7. TrackingEvent Entity (Telemetry & Waypoints)
export interface TrackingEvent {
  id: string; // UUID v4
  shipmentId: string; // FK to Shipment
  eventType: TrackingEventType;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  locationId?: string; // Optional FK to pre-registered Location
  recordedAt: string; // UTC ISO-8601
  receivedAt: string; // UTC ISO-8601
  recordedByUserId?: string; // FK to User
  deviceId?: string; // Hardware tracker ID / IoT sensor ID
  batteryPercent?: number;
  temperatureCelsius?: number;
  sealIntegrityStatus: 'INTACT' | 'BREACH_DETECTED' | 'UNVERIFIED';
  notes?: string;
  hashSignature?: string; // SHA-256 integrity signature
  createdAt: string; // UTC ISO-8601
}

// 8. CustodyTransfer Entity (Formal handoff in Chain of Custody)
export interface CustodyTransfer {
  id: string; // UUID v4
  shipmentId: string; // FK to Shipment
  fromUserId: string; // FK to releasing User
  fromOrganizationId: string; // FK to releasing Org
  toUserId: string; // FK to receiving User
  toOrganizationId: string; // FK to receiving Org
  locationId: string; // FK to Location of transfer
  status: CustodyTransferStatus;
  handoverTime: string; // UTC ISO-8601
  fromDigitalSignature?: string;
  toDigitalSignature?: string;
  witnessUserId?: string; // FK to third-party or security witness
  sealNumbersVerified: boolean;
  packageCountVerified: boolean;
  grossWeightVerifiedGrams?: number;
  notes?: string;
  createdAt: string; // UTC ISO-8601
  updatedAt: string; // UTC ISO-8601
}

// 9. Document Entity (Encrypted/Partitioned object metadata)
export interface Document {
  id: string; // UUID v4
  shipmentId?: string; // FK to Shipment (optional for general org docs)
  organizationId: string; // FK to Organization (tenant owner)
  category: DocumentCategory;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storageObjectKey: string; // Private storage object path
  sha256Hash: string; // Integrity check of binary
  uploadedByUserId: string; // FK to User
  isConfidential: boolean;
  verifiedByCustoms: boolean;
  expiresAt?: string; // UTC ISO-8601
  createdAt: string; // UTC ISO-8601
  updatedAt: string; // UTC ISO-8601
}

// 10. Incident Entity (Security exceptions, deviations, customs flags)
export interface Incident {
  id: string; // UUID v4
  shipmentId: string; // FK to Shipment
  reportedByUserId: string; // FK to User
  reportingOrganizationId: string; // FK to Organization
  severity: IncidentSeverity;
  status: IncidentStatus;
  incidentType: 'SEAL_BROKEN' | 'ROUTE_DEVIATION' | 'CUSTOMS_SEIZURE' | 'WEIGHT_DISCREPANCY' | 'COMMUNICATION_LOST' | 'UNAUTHORIZED_STOP';
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  occurredAt: string; // UTC ISO-8601
  resolvedAt?: string; // UTC ISO-8601
  resolvedByUserId?: string; // FK to User
  resolutionNotes?: string;
  createdAt: string; // UTC ISO-8601
  updatedAt: string; // UTC ISO-8601
}

// 11. Notification Entity
export interface Notification {
  id: string; // UUID v4
  recipientUserId: string; // FK to User
  recipientOrganizationId: string; // FK to Organization
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: string; // UTC ISO-8601
  linkPath?: string; // E.g. /shipments/uuid
  relatedEntityType?: 'SHIPMENT' | 'CUSTODY_TRANSFER' | 'INCIDENT' | 'DOCUMENT';
  relatedEntityId?: string;
  createdAt: string; // UTC ISO-8601
}

// 12. AuditLog Entity (Immutable append-only record)
export interface AuditLog {
  id: string; // UUID v4
  organizationId: string; // FK to Organization
  userId?: string; // FK to User (null for system/webhook actions)
  action: AuditActionType;
  entityType: string; // 'SHIPMENT', 'USER', 'DOCUMENT', etc.
  entityId: string; // Target UUID
  ipAddress?: string;
  userAgent?: string;
  correlationId: string; // Distributed request tracing ID
  beforeState?: Record<string, unknown>; // State prior to change
  afterState?: Record<string, unknown>; // State after change
  metadata?: Record<string, unknown>; // Safe contextual metadata
  tamperSealHash: string; // SHA-256 cryptographic chain hash
  createdAt: string; // UTC ISO-8601
}
