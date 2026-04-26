import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock the DB module before importing the handler
vi.mock('@/app/lib/scouting-db', () => ({
  upsertMatchStartOffset: vi.fn().mockResolvedValue(undefined),
}));

import handler from '@/pages/api/scouting/upsert-offset';
import { upsertMatchStartOffset } from '@/app/lib/scouting-db';

function req(method: string, body?: unknown): NextApiRequest {
  return { method, body } as NextApiRequest;
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

beforeEach(() => vi.clearAllMocks());

describe('POST /api/scouting/upsert-offset', () => {
  it('rejects non-POST methods', async () => {
    const r = res();
    await handler(req('GET'), r);
    expect(r._status).toBe(405);
  });

  it('returns 400 on missing matchKey', async () => {
    const r = res();
    await handler(req('POST', { alliance: 'red', matchStartOffset: 3.3 }), r);
    expect(r._status).toBe(400);
  });

  it('returns 400 on invalid alliance', async () => {
    const r = res();
    await handler(req('POST', { matchKey: '2026isrtp_qm1', alliance: 'green', matchStartOffset: 3.3 }), r);
    expect(r._status).toBe(400);
  });

  it('returns 400 when matchStartOffset exceeds 600', async () => {
    const r = res();
    await handler(req('POST', { matchKey: '2026isrtp_qm1', alliance: 'red', matchStartOffset: 999 }), r);
    expect(r._status).toBe(400);
  });

  it('returns 400 when matchKey is too short', async () => {
    const r = res();
    await handler(req('POST', { matchKey: 'ab', alliance: 'red', matchStartOffset: 3.3 }), r);
    expect(r._status).toBe(400);
  });

  it('calls upsertMatchStartOffset and returns 200 for valid payload', async () => {
    const r = res();
    await handler(req('POST', {
      matchKey: '2026isrtp_qm1',
      alliance: 'blue',
      matchStartOffset: 3.3,
      eventKey: '2026isrtp',
      youtubeVideoId: 'abc123',
    }), r);
    expect(r._status).toBe(200);
    expect(r._body).toEqual({ ok: true });
    expect(upsertMatchStartOffset).toHaveBeenCalledWith(
      '2026isrtp_qm1', 'blue', 3.3, '2026isrtp', 'abc123',
    );
  });

  it('works without optional eventKey and youtubeVideoId', async () => {
    const r = res();
    await handler(req('POST', {
      matchKey: '2026isrtp_qm5',
      alliance: 'red',
      matchStartOffset: 0,
    }), r);
    expect(r._status).toBe(200);
    expect(upsertMatchStartOffset).toHaveBeenCalledWith(
      '2026isrtp_qm5', 'red', 0, undefined, undefined,
    );
  });

  it('returns 500 when DB throws', async () => {
    vi.mocked(upsertMatchStartOffset).mockRejectedValueOnce(new Error('mongo down'));
    const r = res();
    await handler(req('POST', { matchKey: '2026isrtp_qm1', alliance: 'red', matchStartOffset: 5 }), r);
    expect(r._status).toBe(500);
  });
});
