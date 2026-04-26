import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { upsertMatchStartOffset } from '@/app/lib/scouting-db';

const Schema = z.object({
  matchKey: z.string().min(5),
  alliance: z.enum(['red', 'blue']),
  matchStartOffset: z.number().min(0).max(600),
  eventKey: z.string().optional(),
  youtubeVideoId: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const { matchKey, alliance, matchStartOffset, eventKey, youtubeVideoId } = parsed.data;
    await upsertMatchStartOffset(matchKey, alliance, matchStartOffset, eventKey, youtubeVideoId);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[upsert-offset] DB error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
}
