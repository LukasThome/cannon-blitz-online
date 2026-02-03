import { describe, expect, it, vi } from 'vitest';
import { checkAuthStatus } from './auth_status.js';


describe('auth status', () => {
  it('returns false when token missing', async () => {
    const res = await checkAuthStatus(null);
    expect(res.ok).toBe(false);
  });

  it('returns true when endpoint ok', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ uid: 'u1' }) }));
    const res = await checkAuthStatus('token', fetchMock);
    expect(res.ok).toBe(true);
    expect(res.uid).toBe('u1');
  });
});
