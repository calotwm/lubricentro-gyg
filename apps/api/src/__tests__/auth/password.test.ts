import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../../lib/password.js';

describe('password', () => {
  describe('hashPassword', () => {
    it('should hash a password and return a different string', async () => {
      const password = 'my-secret-password';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password (salt)', async () => {
      const password = 'my-secret-password';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'my-secret-password';
      const hash = await hashPassword(password);

      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'my-secret-password';
      const hash = await hashPassword(password);

      const result = await comparePassword('wrong-password', hash);

      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await hashPassword('some-password');

      const result = await comparePassword('', hash);

      expect(result).toBe(false);
    });
  });
});
