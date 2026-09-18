-- ====================================================================
-- AurumTrack Database Schema (Phase 1 Foundation)
-- PostgreSQL / Supabase Architecture
-- All identifiers are UUID v4. Timestamps are UTC TIMESTAMPTZ.
-- Strict Multi-Tenant Organization Isolation with Row Level Security (RLS)
-- ====================================================================

-- 0. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. ORGANIZATIONS (Tenant Root Entity)
-- ====================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255),
    registration_number VARCHAR(100) NOT NULL UNIQUE,
    jurisdiction_country_code CHAR(2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'MINING_OPERATOR', 'REFINERY', 'LOGISTICS_CARRIER', 
        'SECURITY_VAULT', 'CUSTOMS_BROKER', 'REGULATORY_BODY', 
        'FINANCIAL_INSTITUTION', 'BUYER'
    )),
    license_number VARCHAR(100),
    compliance_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (compliance_status IN ('ACTIVE', 'PENDING_REVIEW', 'SUSPENDED')),
    primary_contact_email VARCHAR(255) NOT NULL,
    primary_contact_phone VARCHAR(50),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_compliance ON organizations(compliance_status);
CREATE INDEX IF NOT EXISTS idx_organizations_country ON organizations(jurisdiction_country_code);

-- ====================================================================
-- 2. USERS
-- ====================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'SUPER_ADMIN', 'ADMIN', 'EXPORTER', 'SHIPMENT_MANAGER', 
        'LOGISTICS_OPERATOR', 'SECURITY_ESCORT', 'CUSTOMS_OFFICER', 
        'RECEIVER', 'AUDITOR', 'CLIENT'
    )),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    phone_number VARCHAR(50),
    job_title VARCHAR(100),
    badge_number VARCHAR(100),
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ====================================================================
-- 3. LOCATIONS (Vaults, Customs Posts, Airports, Sites)
-- ====================================================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50) NOT NULL CHECK (facility_type IN (
        'AIRPORT', 'REFINERY', 'VAULT', 'CUSTOMS_POST', 'MINING_SITE', 'TRANSIT_HUB'
    )),
    country_code CHAR(2) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    altitude_meters NUMERIC(8, 2),
    is_high_security_zone BOOLEAN NOT NULL DEFAULT FALSE,
    geofence_radius_meters NUMERIC(10, 2) DEFAULT 100.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_facility_type ON locations(facility_type);
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country_code);

-- ====================================================================
-- 4. SHIPMENTS
-- ====================================================================
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(100) NOT NULL UNIQUE,
    shipper_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    receiver_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    carrier_org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_DISPATCH', 'IN_TRANSIT', 'CUSTOMS_HOLD', 
        'CUSTOMS_CLEARED', 'VAULT_SECURED', 'DELIVERED', 'REJECTED', 'INCIDENT_FLAGGED'
    )),
    origin_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    current_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    declared_value_usd NUMERIC(16, 2) NOT NULL CHECK (declared_value_usd >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    gross_weight_grams NUMERIC(12, 3) NOT NULL CHECK (gross_weight_grams > 0),
    net_pure_gold_grams NUMERIC(12, 3) NOT NULL CHECK (net_pure_gold_grams > 0 AND net_pure_gold_grams <= gross_weight_grams),
    package_count INTEGER NOT NULL DEFAULT 1 CHECK (package_count >= 1),
    dispatch_estimated_at TIMESTAMPTZ,
    delivery_estimated_at TIMESTAMPTZ,
    actual_delivered_at TIMESTAMPTZ,
    escort_required BOOLEAN NOT NULL DEFAULT TRUE,
    tamper_seal_intact BOOLEAN NOT NULL DEFAULT TRUE,
    export_permit_number VARCHAR(100),
    compliance_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_shipper_org ON shipments(shipper_org_id);
CREATE INDEX IF NOT EXISTS idx_shipments_receiver_org ON shipments(receiver_org_id);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_org ON shipments(carrier_org_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);

-- ====================================================================
-- 5. GOLD PACKAGES
-- ====================================================================
CREATE TABLE IF NOT EXISTS gold_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    package_barcode VARCHAR(100) NOT NULL UNIQUE,
    tamper_evident_seal_number VARCHAR(100) NOT NULL UNIQUE,
    form VARCHAR(50) NOT NULL CHECK (form IN (
        'DORE_BAR', 'KILO_BAR_9999', 'GOOD_DELIVERY_400OZ', 'GRAINS_GRANULES', 'COINS_ROUNDS'
    )),
    bar_serial_numbers JSONB NOT NULL DEFAULT '[]'::jsonb,
    fineness_purity_per_mil NUMERIC(6, 2) NOT NULL CHECK (fineness_purity_per_mil > 0 AND fineness_purity_per_mil <= 1000.0),
    gross_weight_grams NUMERIC(12, 3) NOT NULL CHECK (gross_weight_grams > 0),
    pure_gold_weight_grams NUMERIC(12, 3) NOT NULL CHECK (pure_gold_weight_grams > 0 AND pure_gold_weight_grams <= gross_weight_grams),
    assay_batch_number VARCHAR(100),
    assay_laboratory_name VARCHAR(255),
    container_type VARCHAR(50) NOT NULL DEFAULT 'ARMOURED_BOX' CHECK (container_type IN (
        'ARMOURED_BOX', 'SEALED_POUCH', 'SECURITY_DRUM', 'CRATE'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'PREPARED' CHECK (status IN (
        'PREPARED', 'SEALED', 'IN_TRANSIT', 'VERIFIED', 'DAMAGED'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gold_packages_shipment ON gold_packages(shipment_id);
CREATE INDEX IF NOT EXISTS idx_gold_packages_seal ON gold_packages(tamper_evident_seal_number);
CREATE INDEX IF NOT EXISTS idx_gold_packages_barcode ON gold_packages(package_barcode);

-- ====================================================================
-- 6. TRACKING EVENTS (Telemetry & Waypoints)
-- ====================================================================
CREATE TABLE IF NOT EXISTS tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'CHECKPOINT_SCAN', 'GPS_PERIODIC_PING', 'GEOFENCE_ENTER', 'GEOFENCE_EXIT', 
        'SEAL_VERIFIED', 'WEIGHT_VERIFIED', 'VAULT_ENTRY', 'VAULT_EXIT', 'CUSTOMS_INSPECTION'
    )),
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    altitude_meters NUMERIC(8, 2),
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    device_id VARCHAR(100),
    battery_percent NUMERIC(5, 2) CHECK (battery_percent >= 0 AND battery_percent <= 100),
    temperature_celsius NUMERIC(6, 2),
    seal_integrity_status VARCHAR(50) NOT NULL DEFAULT 'INTACT' CHECK (seal_integrity_status IN ('INTACT', 'BREACH_DETECTED', 'UNVERIFIED')),
    notes TEXT,
    hash_signature VARCHAR(256),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_recorded_at ON tracking_events(recorded_at);
CREATE INDEX IF NOT EXISTS idx_tracking_events_type ON tracking_events(event_type);

-- ====================================================================
-- 7. CUSTODY TRANSFERS (Chain of Custody Digital Handshakes)
-- ====================================================================
CREATE TABLE IF NOT EXISTS custody_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    from_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    to_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED' CHECK (status IN (
        'INITIATED', 'WITNESSED', 'ACCEPTED', 'DISPUTED', 'REJECTED'
    )),
    handover_time TIMESTAMPTZ NOT NULL,
    from_digital_signature TEXT,
    to_digital_signature TEXT,
    witness_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    seal_numbers_verified BOOLEAN NOT NULL DEFAULT FALSE,
    package_count_verified BOOLEAN NOT NULL DEFAULT FALSE,
    gross_weight_verified_grams NUMERIC(12, 3),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custody_transfers_shipment ON custody_transfers(shipment_id);
CREATE INDEX IF NOT EXISTS idx_custody_transfers_from_org ON custody_transfers(from_organization_id);
CREATE INDEX IF NOT EXISTS idx_custody_transfers_to_org ON custody_transfers(to_organization_id);
CREATE INDEX IF NOT EXISTS idx_custody_transfers_status ON custody_transfers(status);

-- ====================================================================
-- 8. DOCUMENTS (Compliance, Assays, Export Permits)
-- ====================================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'AIR_WAYBILL', 'CERTIFICATE_OF_ORIGIN', 'ASSAY_CERTIFICATE', 
        'EXPORT_PERMIT', 'CUSTOMS_DECLARATION', 'INSURANCE_CERTIFICATE', 
        'CHAIN_OF_CUSTODY_RECEIPT', 'SECURITY_ESCORT_MANIFEST'
    )),
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    mime_type VARCHAR(100) NOT NULL,
    storage_object_key VARCHAR(512) NOT NULL UNIQUE,
    sha256_hash CHAR(64) NOT NULL,
    uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_confidential BOOLEAN NOT NULL DEFAULT TRUE,
    verified_by_customs BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_shipment ON documents(shipment_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_sha256 ON documents(sha256_hash);

-- ====================================================================
-- 9. INCIDENTS (Security Exceptions, Route Deviations)
-- ====================================================================
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    reported_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reporting_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN (
        'OPEN', 'UNDER_INVESTIGATION', 'ESCALATED', 'RESOLVED', 'DISMISSED'
    )),
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN (
        'SEAL_BROKEN', 'ROUTE_DEVIATION', 'CUSTOMS_SEIZURE', 
        'WEIGHT_DISCREPANCY', 'COMMUNICATION_LOST', 'UNAUTHORIZED_STOP'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    latitude NUMERIC(10, 7) CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude NUMERIC(10, 7) CHECK (longitude >= -180.0 AND longitude <= 180.0),
    occurred_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_shipment ON incidents(shipment_id);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_reporting_org ON incidents(reporting_organization_id);

-- ====================================================================
-- 10. NOTIFICATIONS
-- ====================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'URGENT', 'CRITICAL')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    link_path VARCHAR(255),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(recipient_organization_id);

-- ====================================================================
-- 11. AUDIT LOGS (Immutable Append-Only Audit Trail)
-- ====================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    ip_address INET,
    user_agent TEXT,
    correlation_id VARCHAR(64) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    tamper_seal_hash CHAR(64) NOT NULL, -- SHA-256 block chain seal
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs are strictly append-only: No updates or deletes allowed by normal application users
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation ON audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ====================================================================
-- 12. ROW LEVEL SECURITY (RLS) MULTI-TENANT ARCHITECTURE
-- ====================================================================
-- Enable RLS on core tables
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gold_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Sample RLS Policy: Users can only select shipments where their organization is shipper, receiver, or authorized carrier
-- (Or if the user holds the global AUDITOR or SUPER_ADMIN role)
CREATE POLICY shipment_multi_tenant_isolation ON shipments
    FOR SELECT
    USING (
        shipper_org_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID OR
        receiver_org_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID OR
        carrier_org_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID OR
        current_setting('app.current_user_role', true) IN ('SUPER_ADMIN', 'AUDITOR')
    );
