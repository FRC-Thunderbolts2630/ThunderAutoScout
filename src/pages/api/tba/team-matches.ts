import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchTeamMatches, fetchTeamSimple } from '@/app/lib/tba';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { team, year } = req.query;
  const teamNumber = parseInt(team as string, 10);
  if (isNaN(teamNumber)) return res.status(400).json({ error: 'Invalid team number' });

  const yr = year ? parseInt(year as string, 10) : undefined;

  const [matches, teamInfo] = await Promise.all([
    fetchTeamMatches(teamNumber, yr),
    fetchTeamSimple(teamNumber),
  ]);

  return res.status(200).json({ matches, teamInfo });
}
