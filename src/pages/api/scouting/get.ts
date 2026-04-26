import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getScoutingRecordsForTeam,
  getScoutingRecordByMatch,
  getTeamStats,
} from '@/app/lib/scouting-db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { teamNumber, matchKey, alliance } = req.query;

  try {
    if (teamNumber) {
      const n = parseInt(teamNumber as string, 10);
      if (isNaN(n)) return res.status(400).json({ error: 'Invalid team number' });
      const [records, stats] = await Promise.all([
        getScoutingRecordsForTeam(n),
        getTeamStats(n),
      ]);
      return res.status(200).json({ records, stats });
    }

    if (matchKey && alliance) {
      const record = await getScoutingRecordByMatch(
        matchKey as string,
        alliance as 'red' | 'blue'
      );
      return res.status(200).json({ record });
    }

    return res.status(400).json({ error: 'Provide teamNumber or matchKey+alliance' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    console.error('[get] DB error:', err);
    return res.status(500).json({ error: message });
  }
}
