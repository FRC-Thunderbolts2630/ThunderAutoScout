import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { upsertScoutSettings, listScoutNames } from '@/app/lib/scouting-db';

const PostSchema = z.object({
  scoutName: z.string().min(1).max(50).trim(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const names = await listScoutNames();
      return res.status(200).json({ scoutNames: names });
    } catch {
      return res.status(200).json({ scoutNames: [] });
    }
  }

  if (req.method === 'POST') {
    const parsed = PostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid name' });

    try {
      await upsertScoutSettings(parsed.data.scoutName);
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ error: 'Failed to save' });
    }
  }

  return res.status(405).end();
}
