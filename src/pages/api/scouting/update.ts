import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { updateScoutingRecord } from '@/app/lib/scouting-db';

const RobotTimingSchema = z.object({
  teamNumber: z.number().int().min(1).max(99999),
  timeToMiddle: z.number().min(0).max(30).nullable(),
  analysisMethod: z.enum(['auto', 'manual', 'unset']),
  confidence: z.number().min(0).max(1).nullable(),
  tbaTowerConfirmed: z.boolean(),
  didNotArrive: z.boolean().optional(),
});

const UpdateSchema = z.object({
  matchKey: z.string().min(5),
  alliance: z.enum(['red', 'blue']),
  robots: z.array(RobotTimingSchema).min(1).max(3).optional(),
  notes: z.string().max(500).optional(),
  scoutName: z.string().max(50).optional(),
  matchStartOffset: z.number().min(0).max(600).optional(),
  eventKey: z.string().optional(),
  youtubeVideoId: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error('[update] Validation error:', JSON.stringify(parsed.error.flatten()));
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const { matchKey, alliance, ...updates } = parsed.data;
    await updateScoutingRecord(matchKey, alliance, updates);
    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    console.error('[update] DB error:', err);
    return res.status(500).json({ error: message });
  }
}
