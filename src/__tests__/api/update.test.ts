import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

vi.mock('@/app/lib/scouting-db', () => ({
  updateScoutingRecord: vi.fn().mockResolvedValue(undefined),
}));

import handler from '@/pages/api/scouting/update';
import { updateScoutingRecord } from '@/app/lib/scouting-db';

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

const VALID_ROBOT = {
  teamNumber: 254,
  timeToMiddle: 3.5,
  analysisMethod: 'auto',
  confidence: 0.9,
  tbaTowerConfirmed: false,
};

const VALID_PAYLOAD = {
  matchKey: '2026isrtp_qm1',
  alliance: 'red',
  robots: [VALID_ROBOT],
};

beforeEach(() => vi.clearAllMocks());

describe('POST /api/scouting/update', () => {
  it('returns 405 for non-POST methods', async () => {
    const r = res();
    await handler(req('GET'), r);
    expect(r._status).toBe(405);
  });

  it('returns 400 for missing matchKey', async () => {
    const r = res();
    await handler(req('POST', { alliance: 'red', robots: [VALID_ROBOT] }), r);
    expect(r._status).toBe(400);
  });

  it('returns 400 for matchKey shorter than 5 chars', async () => {
    const r = res();
    await handler(req('POST', { matchKey: 'ab', alliance: 'red', robots: [VALID_ROBOT] }), r);
    expect(r._status).toBe(400);
  });

  it('returns 400 for invalid alliance', async () => {
    const r = res();
    await handler(req('POST', { matchKey: '2026isrtp_qm1', alliance: 'green', robots: [VALID_ROBOT] }), r);
    expect(r._status).toBe(400);
  });

  it('returns 400 for invalid robot (teamNumber out of range)', async () => {
    const r = res();
    await handler(req('POST', {
      matchKey: '2026isrtp_qm1',
      alliance: 'red',
      robots: [{ ...VALID_ROBOT, teamNumber: -1 }],
    }), r);
    expect(r._status).toBe(400);
  });

  it('returns 400 for invalid robots array (too many)', async () => {
    const r = res();
    await handler(req('POST', {
      matchKey: '2026isrtp_qm1',
      alliance: 'red',
      robots: [VALID_ROBOT, VALID_ROBOT, VALID_ROBOT, VALID_ROBOT],
    }), r);
    expect(r._status).toBe(400);
  });

  it('returns 200 for valid payload and calls updateScoutingRecord', async () => {
    const r = res();
    await handler(req('POST', VALID_PAYLOAD), r);
    expect(r._status).toBe(200);
    expect(r._body).toEqual({ ok: true });
    expect(updateScoutingRecord).toHaveBeenCalledWith(
      '2026isrtp_qm1',
      'red',
      { robots: [VALID_ROBOT] },
    );
  });

  it('returns 200 with optional fields included', async () => {
    const r = res();
    await handler(req('POST', {
      ...VALID_PAYLOAD,
      notes: 'Fast auto',
      scoutName: 'Alice',
      matchStartOffset: 3.3,
      eventKey: '2026isrtp',
      youtubeVideoId: 'abc123',
    }), r);
    expect(r._status).toBe(200);
    expect(updateScoutingRecord).toHaveBeenCalledWith(
      '2026isrtp_qm1',
      'red',
      expect.objectContaining({ notes: 'Fast auto', scoutName: 'Alice', matchStartOffset: 3.3 }),
    );
  });

  it('returns 200 with no robots (partial update)', async () => {
    const r = res();
    await handler(req('POST', { matchKey: '2026isrtp_qm1', alliance: 'blue', notes: 'Good match' }), r);
    expect(r._status).toBe(200);
  });

  it('returns 500 with real error message when DB throws', async () => {
    vi.mocked(updateScoutingRecord).mockRejectedValueOnce(new Error('mongo down'));
    const r = res();
    await handler(req('POST', VALID_PAYLOAD), r);
    expect(r._status).toBe(500);
    // Confirms the error message is now surfaced (not the old generic 'Database error')
    expect((r._body as { error: string }).error).toBe('mongo down');
  });
});
