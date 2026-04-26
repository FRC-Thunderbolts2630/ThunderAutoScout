import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { saveScoutingRecord } from '@/app/lib/scouting-db';

const RobotTimingSchema = z.object({
  teamNumber: z.number().int().min(1).max(99999),
  timeToMiddle: z.number().min(0).max(30).nullable(),
  analysisMethod: z.enum(['auto', 'manual', 'unset']),
  confidence: z.number().min(0).max(1).nullable(),
  tbaTowerConfirmed: z.boolean(),
  didNotArrive: z.boolean().optional(),
});

const SaveSchema = z.object({
  matchKey: z.string().min(5),
  eventKey: z.string().min(3),
  youtubeVideoId: z.string(),
  alliance: z.enum(['red', 'blue']),
  robots: z.array(RobotTimingSchema).min(1).max(3),
  notes: z.string().max(500),
  scoutName: z.string().max(50),
  matchStartOffset: z.number().min(0).max(600).default(0),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const parsed = SaveSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error('[save] Validation error:', JSON.stringify(parsed.error.flatten()));
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const result = await saveScoutingRecord({
      ...parsed.data,
      scoutedAt: new Date(),
      updatedAt: new Date(),
    });

    if (!result.ok) {
      return res.status(409).json({ error: 'Already scouted', existing: result.conflict });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[save] DB error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
}
