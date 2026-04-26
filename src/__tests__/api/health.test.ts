import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// vi.mock is hoisted — factory must not reference variables declared below.
// Instead we mock getDb inline and override per-test in beforeEach.
vi.mock('@/app/lib/database', () => ({
  getDb: vi.fn(),
}));

import handler from '@/pages/api/health';
import { getDb } from '@/app/lib/database';

function req(): NextApiRequest {
  return { method: 'GET' } as NextApiRequest;
}

function res(): NextApiResponse & { _status: number; _body: unknown } {
  const r = {
    _status: 200,
    _body: undefined as unknown,
    status(code: number) { this._status = code; return this; },
    json(data: unknown) { this._body = data; return this; },
    end() { return this; },
  };
  return r as unknown as NextApiResponse & { _status: number; _body: unknown };
}

function makeDb(commandResult?: unknown, commandError?: Error) {
  const command = commandError
    ? vi.fn().mockRejectedValueOnce(commandError)
    : vi.fn().mockResolvedValue(commandResult ?? {});
  return { command };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: healthy DB
  vi.mocked(getDb).mockResolvedValue(makeDb() as never);
});

describe('GET /api/health', () => {
  it('returns ok:true and latencyMs when ping succeeds', async () => {
    const r = res();
    await handler(req(), r);
    expect(r._status).toBe(200);
    const body = r._body as { ok: boolean; latencyMs: number };
    expect(body.ok).toBe(true);
    expect(typeof body.latencyMs).toBe('number');
    expect(body.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns ok:false with error message when db.command rejects', async () => {
    vi.mocked(getDb).mockResolvedValue(makeDb(undefined, new Error('connection refused')) as never);
    const r = res();
    await handler(req(), r);
    expect(r._status).toBe(200);
    const body = r._body as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe('connection refused');
  });

  it('returns ok:false when getDb itself rejects', async () => {
    vi.mocked(getDb).mockRejectedValueOnce(new Error('MONGODB_URI is not configured'));
    const r = res();
    await handler(req(), r);
    expect(r._status).toBe(200);
    const body = r._body as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toBe('MONGODB_URI is not configured');
  });

  it('always returns HTTP 200 regardless of DB state', async () => {
    vi.mocked(getDb).mockRejectedValueOnce(new Error('any error'));
    const r = res();
    await handler(req(), r);
    // HTTP status is always 200; the ok field carries health status
    expect(r._status).toBe(200);
  });
});
