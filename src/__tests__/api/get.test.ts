import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

vi.mock('@/app/lib/scouting-db', () => ({
  getScoutingRecordsForTeam: vi.fn().mockResolvedValue([]),
  getTeamStats: vi.fn().mockResolvedValue(null),
  getScoutingRecordByMatch: vi.fn().mockResolvedValue(null),
}));

import handler from '@/pages/api/scouting/get';
import {
  getScoutingRecordsForTeam,
  getTeamStats,
  getScoutingRecordByMatch,
} from '@/app/lib/scouting-db';

function req(method: string, query: Record<string, string> = {}): NextApiRequest {
  return { method, query } as NextApiRequest;
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

describe('GET /api/scouting/get', () => {
  it('returns 405 for non-GET methods', async () => {
    const r = res();
    await handler(req('POST'), r);
    expect(r._status).toBe(405);
  });

  it('returns 400 when no params provided', async () => {
    const r = res();
    await handler(req('GET'), r);
    expect(r._status).toBe(400);
  });

  it('returns 400 for non-numeric teamNumber', async () => {
    const r = res();
    await handler(req('GET', { teamNumber: 'abc' }), r);
    expect(r._status).toBe(400);
  });

  it('returns 200 with teamNumber and calls getScoutingRecordsForTeam + getTeamStats', async () => {
    const r = res();
    await handler(req('GET', { teamNumber: '254' }), r);
    expect(r._status).toBe(200);
    expect(r._body).toEqual({ records: [], stats: null });
    expect(getScoutingRecordsForTeam).toHaveBeenCalledWith(254);
    expect(getTeamStats).toHaveBeenCalledWith(254);
  });

  it('returns 200 with matchKey+alliance and calls getScoutingRecordByMatch', async () => {
    const r = res();
    await handler(req('GET', { matchKey: '2026isrtp_qm1', alliance: 'red' }), r);
    expect(r._status).toBe(200);
    expect(r._body).toEqual({ record: null });
    expect(getScoutingRecordByMatch).toHaveBeenCalledWith('2026isrtp_qm1', 'red');
  });

  it('returns 500 with real error message when DB throws on teamNumber path', async () => {
    vi.mocked(getScoutingRecordsForTeam).mockRejectedValueOnce(new Error('atlas down'));
    const r = res();
    await handler(req('GET', { teamNumber: '254' }), r);
    expect(r._status).toBe(500);
    expect((r._body as { error: string }).error).toBe('atlas down');
  });

  it('returns 500 with real error message when DB throws on matchKey path', async () => {
    vi.mocked(getScoutingRecordByMatch).mockRejectedValueOnce(new Error('atlas down'));
    const r = res();
    await handler(req('GET', { matchKey: '2026isrtp_qm1', alliance: 'blue' }), r);
    expect(r._status).toBe(500);
    expect((r._body as { error: string }).error).toBe('atlas down');
  });
});
