import { getDb } from '@/app/lib/database';
import { ScoutingRecord, TeamStats } from '@/app/lib/types';

// ── Scout settings (cross-device name persistence) ───────────────────────

export interface ScoutSettings {
  scoutName: string;
  updatedAt: Date;
}

export async function upsertScoutSettings(scoutName: string): Promise<void> {
  const db = await getDb();
  const col = db.collection<ScoutSettings>('scout_settings');
  await col.createIndex({ scoutName: 1 }, { unique: true }).catch(() => {});
  await col.updateOne(
    { scoutName },
    { $set: { scoutName, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function listScoutNames(): Promise<string[]> {
  const db = await getDb();
  const col = db.collection<ScoutSettings>('scout_settings');
  const docs = await col.find({}).sort({ updatedAt: -1 }).toArray();
  return docs.map((d) => d.scoutName);
}

export async function saveScoutingRecord(record: Omit<ScoutingRecord, '_id'>): Promise<{ ok: boolean; conflict?: ScoutingRecord }> {
  const db = await getDb();
  const col = db.collection<ScoutingRecord>('scouting_records');

  // Ensure indexes exist
  await col.createIndex({ matchKey: 1, alliance: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ 'robots.teamNumber': 1 }).catch(() => {});
  await col.createIndex({ scoutedAt: -1 }).catch(() => {});

  const existing = await col.findOne({ matchKey: record.matchKey, alliance: record.alliance });
  if (existing) return { ok: false, conflict: existing };

  await col.insertOne({ ...record, scoutedAt: new Date(), updatedAt: new Date() });
  return { ok: true };
}

export async function updateScoutingRecord(
  matchKey: string,
  alliance: 'red' | 'blue',
  updates: Partial<ScoutingRecord>
): Promise<void> {
  const db = await getDb();
  const col = db.collection<ScoutingRecord>('scouting_records');
  const now = new Date();
  await col.updateOne(
    { matchKey, alliance },
    {
      $set: { ...updates, updatedAt: now },
      $setOnInsert: { scoutedAt: now },
    },
    { upsert: true },
  );
}

/** Upsert just the match start offset — creates a minimal record if none exists yet.
 *  Used to persist the auto-detected offset immediately so re-entry doesn't re-detect. */
export async function upsertMatchStartOffset(
  matchKey: string,
  alliance: 'red' | 'blue',
  matchStartOffset: number,
  eventKey?: string,
  youtubeVideoId?: string,
): Promise<void> {
  const db = await getDb();
  const col = db.collection<ScoutingRecord>('scouting_records');
  const now = new Date();
  await col.updateOne(
    { matchKey, alliance },
    {
      $set: {
        matchStartOffset,
        updatedAt: now,
        ...(eventKey && { eventKey }),
        ...(youtubeVideoId && { youtubeVideoId }),
      },
      $setOnInsert: { robots: [], notes: '', scoutName: '', scoutedAt: now },
    },
    { upsert: true },
  );
}

export async function getScoutingRecordByMatch(
  matchKey: string,
  alliance: 'red' | 'blue'
): Promise<ScoutingRecord | null> {
  const db = await getDb();
  const col = db.collection<ScoutingRecord>('scouting_records');
  return col.findOne({ matchKey, alliance });
}

export async function getScoutingRecordsForTeam(teamNumber: number): Promise<ScoutingRecord[]> {
  const db = await getDb();
  const col = db.collection<ScoutingRecord>('scouting_records');
  return col
    .find({ 'robots.teamNumber': teamNumber })
    .sort({ scoutedAt: -1 })
    .toArray();
}

export async function getRecentScouting(limit = 10): Promise<ScoutingRecord[]> {
  const db = await getDb();
  const col = db.collection<ScoutingRecord>('scouting_records');
  return col.find({}).sort({ scoutedAt: -1 }).limit(limit).toArray();
}

export async function getTopTeams(limit = 20): Promise<TeamStats[]> {
  const db = await getDb();
  const col = db.collection<ScoutingRecord>('scouting_records');

  const agg = await col
    .aggregate([
      { $unwind: '$robots' },
      { $match: { 'robots.timeToMiddle': { $ne: null } } },
      {
        $group: {
          _id: '$robots.teamNumber',
          avgTimeToMiddle: { $avg: '$robots.timeToMiddle' },
          fastestTime: { $min: '$robots.timeToMiddle' },
          slowestTime: { $max: '$robots.timeToMiddle' },
          matchesScoutedCount: { $sum: 1 },
          timesSeries: { $push: '$robots.timeToMiddle' },
        },
      },
      { $sort: { avgTimeToMiddle: 1 } },
      { $limit: limit },
    ])
    .toArray();

  return agg.map((d) => ({
    teamNumber: d._id,
    avgTimeToMiddle: d.avgTimeToMiddle ?? null,
    fastestTime: d.fastestTime ?? null,
    slowestTime: d.slowestTime ?? null,
    matchesScoutedCount: d.matchesScoutedCount,
    timesSeries: d.timesSeries ?? [],
  }));
}

/** Returns an array of "matchKey|alliance" strings for event match scouting status lookup */
export async function getScoutedMatchKeys(eventKey: string): Promise<string[]> {
  const db = await getDb();
  const col = db.collection<ScoutingRecord>('scouting_records');
  const records = await col
    .find({ eventKey }, { projection: { matchKey: 1, alliance: 1 } })
    .toArray();
  return records.map((r) => `${r.matchKey}|${r.alliance}`);
}

/**
 * Returns match keys (no alliance suffix) where ALL 6 robots have data.
 * A robot "has data" = timeToMiddle is set OR didNotArrive is true (DNA counts).
 * Requires both alliances to be present with exactly 3 qualifying robots each.
 */
export async function getFullyScoutedMatchKeys(eventKey: string): Promise<string[]> {
  const db = await getDb();
  const col = db.collection<ScoutingRecord>('scouting_records');
  const records = await col
    .find({ eventKey }, { projection: { matchKey: 1, alliance: 1, robots: 1 } })
    .toArray();

  // Group by matchKey
  const byMatch = new Map<string, { red?: ScoutingRecord; blue?: ScoutingRecord }>();
  for (const r of records) {
    const entry = byMatch.get(r.matchKey) ?? {};
    (entry as Record<string, ScoutingRecord>)[r.alliance] = r;
    byMatch.set(r.matchKey, entry as { red?: ScoutingRecord; blue?: ScoutingRecord });
  }

  const robotHasData = (rb: { timeToMiddle: number | null; didNotArrive?: boolean }) =>
    rb.timeToMiddle !== null || rb.didNotArrive === true;

  const result: string[] = [];
  for (const [matchKey, { red, blue }] of Array.from(byMatch.entries())) {
    if (!red || !blue) continue;
    const redDone  = red.robots.length  === 3 && red.robots.every(robotHasData);
    const blueDone = blue.robots.length === 3 && blue.robots.every(robotHasData);
    if (redDone && blueDone) result.push(matchKey);
  }
  return result;
}

/** Fetch stats for multiple teams in a single aggregation — used for upcoming-match cards */
export async function getTeamStatsMap(teamNumbers: number[]): Promise<Map<number, TeamStats>> {
  if (!teamNumbers.length) return new Map();
  const db = await getDb();
  const col = db.collection<ScoutingRecord>('scouting_records');

  const agg = await col
    .aggregate([
      { $match: { 'robots.teamNumber': { $in: teamNumbers } } },
      { $unwind: '$robots' },
      {
        $match: {
          'robots.teamNumber': { $in: teamNumbers },
          'robots.timeToMiddle': { $ne: null },
        },
      },
      {
        $group: {
          _id: '$robots.teamNumber',
          avgTimeToMiddle: { $avg: '$robots.timeToMiddle' },
          fastestTime: { $min: '$robots.timeToMiddle' },
          matchesScoutedCount: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const map = new Map<number, TeamStats>();
  for (const d of agg) {
    map.set(d._id as number, {
      teamNumber: d._id as number,
      avgTimeToMiddle: d.avgTimeToMiddle ?? null,
      fastestTime: d.fastestTime ?? null,
      slowestTime: null,
      matchesScoutedCount: d.matchesScoutedCount as number,
      timesSeries: [],
    });
  }
  return map;
}

export async function getTeamStats(teamNumber: number): Promise<TeamStats | null> {
  const records = await getScoutingRecordsForTeam(teamNumber);
  if (!records.length) return null;

  const timings = records.flatMap((r) =>
    r.robots.filter((rb) => rb.teamNumber === teamNumber && rb.timeToMiddle !== null).map((rb) => rb.timeToMiddle!)
  );

  if (!timings.length) {
    return {
      teamNumber,
      avgTimeToMiddle: null,
      fastestTime: null,
      slowestTime: null,
      matchesScoutedCount: records.length,
      timesSeries: records.map(() => null),
    };
  }

  return {
    teamNumber,
    avgTimeToMiddle: timings.reduce((a, b) => a + b, 0) / timings.length,
    fastestTime: Math.min(...timings),
    slowestTime: Math.max(...timings),
    matchesScoutedCount: records.length,
    timesSeries: timings,
  };
}
