/**
 * AurumTrack - Authentication Abstraction Types
 * Foundation for Supabase Auth, OAuth, or custom secure JWT providers.
 */

import { User, UserRole, Organization } from '../..//types/entities.js';

export interface AuthSession {
  token: string;
  refreshToken?: string;
  expiresAt: string; // ISO-8601 UTC
  user: User;
  organization: Organization;
}

export interface AuthenticatedContext {
  user: User;
  organization: Organization;
  roles: UserRole[];
  permissions: string[];
  correlationId: string;
  ipAddress?: string;
}

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export interface IAuthService {
  authenticate(token: string, correlationId?: string): Promise<AuthenticatedContext>;
  createSession(user: User, organization: Organization): Promise<AuthSession>;
  revokeSession(token: string): Promise<void>;
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] };
}
