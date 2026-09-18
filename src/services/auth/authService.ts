/**
 * AurumTrack - Authentication Service Implementation
 * Provides session handling, token validation abstraction, and credential protection.
 */

import { User, UserRole, Organization, OrganizationType } from '../../types/entities.js';
import { AuthenticatedContext, AuthSession, IAuthService, IPasswordHasher } from './types.js';
import { AuthenticationError, logger } from '../logging/logger.js';
import { getPermissionsForRole } from './rbacService.js';

/**
 * Standard password policy for bullion logistics personnel:
 * Min 12 chars, upper, lower, number, special symbol.
 */
export function checkPasswordPolicy(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!password || password.length < 12) {
    errors.push('Password must be at least 12 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one numeral.');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Cryptographic Password Hasher Interface Implementation.
 * Uses Web Crypto / Node crypto subtle SHA-256 with salted key derivation.
 * In production, connect to Argon2id or Supabase Auth managed hashing.
 */
export class SecurePasswordHasher implements IPasswordHasher {
  public async hash(password: string): Promise<string> {
    // Zero-plaintext guarantee
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const data = encoder.encode(saltHex + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    return `sha256$${saltHex}$${hashHex}`;
  }

  public async verify(password: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'sha256') {
      return false;
    }
    const [, saltHex, originalHashHex] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(saltHex + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const calculatedHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    return calculatedHex === originalHashHex;
  }
}

/**
 * Core Authentication Service
 * Manages token resolution, tenant context building, and session lifecycle.
 */
export class AuthService implements IAuthService {
  private sessions = new Map<string, AuthSession>();
  private passwordHasher = new SecurePasswordHasher();

  public validatePasswordStrength(password: string) {
    return checkPasswordPolicy(password);
  }

  public async createSession(user: User, organization: Organization): Promise<AuthSession> {
    // Generate secure cryptographically random session token
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = 'at_sec_' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString();
    const session: AuthSession = {
      token,
      expiresAt,
      user,
      organization,
    };

    this.sessions.set(token, session);

    logger.info('AUTH_SESSION_CREATED', `Session created for user ${user.id}`, {
      organizationId: organization.id,
      userId: user.id,
      context: { email: user.email, role: user.role },
    });

    return session;
  }

  public async authenticate(token: string, correlationId = 'sys-ctx'): Promise<AuthenticatedContext> {
    if (!token) {
      throw new AuthenticationError('Authorization header or token is missing');
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    const session = this.sessions.get(cleanToken);

    if (!session) {
      logger.warn('AUTH_TOKEN_INVALID', 'Attempted authentication with invalid or expired token', {
        context: { tokenPrefix: cleanToken.substring(0, 10) + '...' },
      });
      throw new AuthenticationError('Invalid or expired authentication session');
    }

    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(cleanToken);
      throw new AuthenticationError('Session expired. Please log in again.');
    }

    const permissions = getPermissionsForRole(session.user.role);

    return {
      user: session.user,
      organization: session.organization,
      roles: [session.user.role],
      permissions,
      correlationId,
    };
  }

  public async revokeSession(token: string): Promise<void> {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    this.sessions.delete(cleanToken);
  }
}

export const authService = new AuthService();
