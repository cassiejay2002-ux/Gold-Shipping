/**
 * AurumTrack - Phase 1 Architectural Verification Test Suite
 * Validates zero-trust validation, RBAC, tenant isolation, audit chain, and storage partitioning.
 */

import { Validator } from '../src/services/validation/validator.js';
import { AuthService, SecurePasswordHasher, checkPasswordPolicy } from '../src/services/auth/authService.js';
import { assertPermission, assertOrganizationAccess, assertShipmentAccess, ROLE_PERMISSIONS } from '../src/services/auth/rbacService.js';
import { AuditLogService } from '../src/services/audit/auditLogService.js';
import { StorageService } from '../src/services/storage/storageService.js';
import { sanitizeContext, ValidationError, ForbiddenError } from '../src/services/logging/logger.js';
import { UserRole, AuditActionType, DocumentCategory, Shipment, ShipmentStatus } from '../src/types/entities.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    throw new Error(`Assertion failed for: ${testName}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('AURUMTRACK PHASE 1 ARCHITECTURAL VERIFICATION SUITE');
  console.log('======================================================\n');

  // 1. Centralized Input Validation Tests
  console.log('--- 1. ZERO-TRUST VALIDATION CHECKS ---');
  const validUuid = '123e4567-e89b-42d3-a456-426614174000';
  assert(Validator.validateUuid(validUuid) === validUuid, 'Valid UUID v4 accepted');

  let uuidFailed = false;
  try {
    Validator.validateUuid('invalid-uuid-1234');
  } catch (e) {
    uuidFailed = e instanceof ValidationError;
  }
  assert(uuidFailed, 'Malformed UUID v4 rejected with ValidationError');

  assert(Validator.validateLatitude(5.6052) === 5.6052, 'Valid latitude accepted');
  let latFailed = false;
  try {
    Validator.validateLatitude(95.5);
  } catch (e) {
    latFailed = e instanceof ValidationError;
  }
  assert(latFailed, 'Out-of-range latitude (+95.5) rejected');

  assert(Validator.validateWeightGrams(215000) === 215000, 'Positive gross weight accepted');
  let weightFailed = false;
  try {
    Validator.validateWeightGrams(-500);
  } catch (e) {
    weightFailed = e instanceof ValidationError;
  }
  assert(weightFailed, 'Negative gold weight rejected');

  assert(Validator.validateFineness(999.9) === 999.9, 'Four-nines purity fineness accepted');
  let purityFailed = false;
  try {
    Validator.validateFineness(1005.0);
  } catch (e) {
    purityFailed = e instanceof ValidationError;
  }
  assert(purityFailed, 'Purity > 1000 per mil rejected');

  // 2. Authentication & Credential Protection Tests
  console.log('\n--- 2. AUTHENTICATION & CREDENTIAL SECURITY ---');
  const weakPolicy = checkPasswordPolicy('short1!');
  assert(!weakPolicy.valid, 'Short password fails bullion security policy');

  const strongPolicy = checkPasswordPolicy('Aurum#Vault2026!Secure');
  assert(strongPolicy.valid, 'Complex 12+ char password passes bullion security policy');

  const hasher = new SecurePasswordHasher();
  const rawSecret = 'SecureGoldBullionEscort#2026';
  const hashed = await hasher.hash(rawSecret);
  assert(hashed.startsWith('sha256$'), 'Password hashed with cryptographic salt');
  assert(!hashed.includes(rawSecret), 'Never stores or leaks raw plaintext password');
  assert(await hasher.verify(rawSecret, hashed), 'Password verify succeeds for matching password');
  assert(!(await hasher.verify('WrongPassword#123', hashed)), 'Password verify rejects incorrect password');

  // 3. RBAC & Multi-Tenant Isolation Tests
  console.log('\n--- 3. RBAC & MULTI-ORGANIZATION ISOLATION ---');
  assert(Object.keys(ROLE_PERMISSIONS).length === 10, 'All 10 required roles defined in RBAC matrix');

  const testOrgA = '11111111-1111-4111-8111-111111111111';
  const testOrgB = '22222222-2222-4222-8222-222222222222';
  const testOrgC = '33333333-3333-4333-8333-333333333333';

  const userContextA = {
    user: { id: 'u1', organizationId: testOrgA, email: 'a@miner.com', fullName: 'User A', role: UserRole.EXPORTER, isActive: true, mfaEnabled: true, createdAt: '', updatedAt: '' },
    organization: { id: testOrgA, legalName: 'Mining Org A', registrationNumber: 'REG-A', jurisdictionCountryCode: 'GH', type: 'MINING_OPERATOR' as any, complianceStatus: 'ACTIVE' as any, primaryContactEmail: '', addressLine1: '', city: '', country: '', createdAt: '', updatedAt: '' },
    roles: [UserRole.EXPORTER],
    permissions: ROLE_PERMISSIONS[UserRole.EXPORTER],
    correlationId: 'req_test_1',
  };

  // Asserting same org passes
  let sameOrgOk = false;
  try {
    assertOrganizationAccess(userContextA, testOrgA);
    sameOrgOk = true;
  } catch {}
  assert(sameOrgOk, 'Same organization access allowed');

  // Asserting cross-org without authorization fails
  let crossOrgBlocked = false;
  try {
    assertOrganizationAccess(userContextA, testOrgB);
  } catch (e) {
    crossOrgBlocked = e instanceof ForbiddenError;
  }
  assert(crossOrgBlocked, 'Cross-organization access to Org B strictly blocked (Fail-Closed)');

  // Shipment with participant list
  const testShipment: Shipment = {
    id: 'sh-uuid-1',
    trackingNumber: 'AT-TEST-001',
    shipperOrgId: testOrgA,
    receiverOrgId: testOrgB,
    carrierOrgId: testOrgC,
    status: ShipmentStatus.IN_TRANSIT,
    originLocationId: 'loc-1',
    destinationLocationId: 'loc-2',
    declaredValueUsd: 1000000,
    currency: 'USD',
    grossWeightGrams: 50000,
    netPureGoldGrams: 49950,
    packageCount: 1,
    escortRequired: true,
    tamperSealIntact: true,
    complianceVerified: true,
    createdAt: '',
    updatedAt: '',
  };

  let authorizedParticipantOk = false;
  try {
    assertShipmentAccess(userContextA, testShipment);
    authorizedParticipantOk = true;
  } catch {}
  assert(authorizedParticipantOk, 'Authorized shipper allowed access to shipment');

  // 4. Append-Only Audit Trail & Tamper Seal Tests
  console.log('\n--- 4. APPEND-ONLY AUDIT LOG CHAIN ---');
  const auditService = new AuditLogService();
  const entry1 = await auditService.record({
    organizationId: testOrgA,
    userId: 'u1',
    action: AuditActionType.SHIPMENT_CREATED,
    entityType: 'SHIPMENT',
    entityId: testShipment.id,
    correlationId: 'corr_test_101',
    metadata: { note: 'Initial consignment registration' },
  });

  const entry2 = await auditService.record({
    organizationId: testOrgA,
    userId: 'u1',
    action: AuditActionType.CUSTODY_TRANSFER_INITIATED,
    entityType: 'CUSTODY_TRANSFER',
    entityId: 'cst-uuid-1',
    correlationId: 'corr_test_102',
    metadata: { handoverTo: testOrgC },
  });

  assert(entry1.tamperSealHash.length === 64, 'SHA-256 seal computed for entry 1');
  assert(entry2.tamperSealHash.length === 64, 'SHA-256 seal computed for entry 2');
  assert(entry1.tamperSealHash !== entry2.tamperSealHash, 'Subsequent entries have distinct chained seals');

  const chainVerification = await auditService.verifyIntegrityChain();
  assert(chainVerification.valid, 'Cryptographic chain verification confirmed valid');
  assert(chainVerification.totalChecked === 2, 'All 2 blocks checked and verified');

  // 5. Partitioned Storage Abstraction Tests
  console.log('\n--- 5. STORAGE ABSTRACTION & PARTITIONING ---');
  const storage = new StorageService();
  const storageKey = storage.generateObjectKey({
    organizationId: testOrgA,
    shipmentId: '44444444-4444-4444-8444-444444444444',
    category: DocumentCategory.ASSAY_CERTIFICATE,
    documentId: 'doc-999',
    originalFileName: 'Refinery Report 2026.pdf',
  });

  assert(
    storageKey === 'organizations/11111111-1111-4111-8111-111111111111/shipments/44444444-4444-4444-8444-444444444444/assay_certificate/doc-999_Refinery_Report_2026.pdf',
    'Storage key safely partitioned by tenant org and shipment ID with sanitized filename'
  );

  const signedUrlResult = await storage.createSignedDownloadUrl(storageKey, testOrgA, 600);
  assert(signedUrlResult.url.includes('sig='), 'Signed download URL generated with signature token');
  assert(signedUrlResult.url.includes('exp='), 'Signed download URL contains expiration timestamp');

  // 6. Sensitive Data Redaction Tests
  console.log('\n--- 6. STRUCTURED LOGGING & SECRET REDACTION ---');
  const dirtyContext = {
    action: 'USER_LOGIN',
    userEmail: 'auditor@vault.ch',
    password: 'SuperSecretBullionPassword#123',
    apiKey: 'ak_live_secret998811',
    token: 'jwt.bearer.secret.token',
    nested: {
      privateKey: 'BEGIN RSA PRIVATE KEY...',
      safeField: 'Gold Consignment ID #441',
    },
  };

  const sanitized = sanitizeContext(dirtyContext) as any;
  assert(sanitized.password === '[REDACTED]', 'Password redacted');
  assert(sanitized.apiKey === '[REDACTED]', 'API Key redacted');
  assert(sanitized.token === '[REDACTED]', 'Token redacted');
  assert(sanitized.nested.privateKey === '[REDACTED]', 'Nested privateKey redacted');
  assert(sanitized.nested.safeField === 'Gold Consignment ID #441', 'Safe contextual information preserved');

  console.log(`\n======================================================`);
  console.log(`TEST SUITE RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`======================================================\n`);
}

runTests().catch(err => {
  console.error('Test suite failure:', err);
  process.exit(1);
});
