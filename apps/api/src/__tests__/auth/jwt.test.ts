import { describe, it, expect } from 'vitest';
import { signToken, verifyToken, decodeToken } from '../../lib/jwt.js';

describe('jwt', () => {
  describe('signToken', () => {
    it('should sign a token with sub and role', () => {
      const payload = { sub: 'user-123', role: 'admin' };
      const token = signToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should produce different tokens for different payloads', () => {
      const token1 = signToken({ sub: 'user-1', role: 'admin' });
      const token2 = signToken({ sub: 'user-2', role: 'employee' });

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return the payload', () => {
      const original = { sub: 'user-123', role: 'admin' };
      const token = signToken(original);

      const decoded = verifyToken(token);

      expect(decoded.sub).toBe('user-123');
      expect(decoded.role).toBe('admin');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should throw on invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw on tampered token', () => {
      const token = signToken({ sub: 'user-123', role: 'admin' });
      const tampered = token.slice(0, -5) + 'XXXXX';

      expect(() => verifyToken(tampered)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const original = { sub: 'user-123', role: 'employee' };
      const token = signToken(original);

      const decoded = decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.sub).toBe('user-123');
      expect(decoded!.role).toBe('employee');
    });

    it('should return null for invalid token format', () => {
      const decoded = decodeToken('not-a-jwt');
      expect(decoded).toBeNull();
    });
  });
});
