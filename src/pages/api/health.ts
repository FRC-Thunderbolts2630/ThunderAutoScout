import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/app/lib/database';

export interface HealthResponse {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>,
) {
  const start = Date.now();

  // Race the DB ping against a 2-second timeout.
  // database.ts has no connectTimeoutMS set, so we enforce it here.
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Health check timed out after 2000ms')), 2000),
  );

  try {
    await Promise.race([
      (async () => {
        const db = await getDb();
        await db.command({ ping: 1 });
      })(),
      timeout,
    ]);
    return res.status(200).json({ ok: true, latencyMs: Date.now() - start });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[health] DB ping failed:', err);
    return res.status(200).json({ ok: false, latencyMs: Date.now() - start, error: message });
  }
}
