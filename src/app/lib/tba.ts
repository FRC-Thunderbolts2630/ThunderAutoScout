import { TBAEventSimple, TBAMatch, TBATeamSimple, ZebraData } from '@/app/lib/types';
import { TBA_BASE_URL, YEAR } from '@/app/lib/constants';

function tbaHeaders(): HeadersInit {
  return { 'X-TBA-Auth-Key': process.env.TBA_API_KEY as string };
}

async function tbaFetch<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(`${TBA_BASE_URL}${path}`, {
      headers: tbaHeaders(),
      next: { revalidate },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data === null || data?.Error) return null;
    return data as T;
  } catch {
    return null;
  }
}

export async function fetchTeamEvents(teamNumber: number, year = YEAR): Promise<TBAEventSimple[]> {
  return (await tbaFetch<TBAEventSimple[]>(`/team/frc${teamNumber}/events/${year}/simple`)) ?? [];
}

export async function fetchTeamSimple(teamNumber: number): Promise<TBATeamSimple | null> {
  return tbaFetch<TBATeamSimple>(`/team/frc${teamNumber}/simple`);
}

export async function fetchTeamMatches(teamNumber: number, year = YEAR): Promise<TBAMatch[]> {
  const data = await tbaFetch<TBAMatch[]>(`/team/frc${teamNumber}/matches/${year}`);
  if (!data) return [];
  return data.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
}

export async function fetchEventMatches(eventKey: string): Promise<TBAMatch[]> {
  const data = await tbaFetch<TBAMatch[]>(`/event/${eventKey}/matches`);
  if (!data) return [];
  return data.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
}

export async function fetchMatch(matchKey: string): Promise<TBAMatch | null> {
  return tbaFetch<TBAMatch>(`/match/${matchKey}`);
}

export async function fetchZebraData(matchKey: string): Promise<ZebraData | null> {
  return tbaFetch<ZebraData>(`/match/${matchKey}/zebra_motionworks`, 86400);
}

/** Get YouTube video ID from a TBA match, or null if none */
export function getYouTubeVideoId(match: TBAMatch): string | null {
  return match.videos.find((v) => v.type === 'youtube')?.key ?? null;
}

/** Get the alliance ('red'|'blue') a team is on in a match */
export function getTeamAlliance(match: TBAMatch, teamNumber: number): 'red' | 'blue' | null {
  const key = `frc${teamNumber}`;
  if (match.alliances.red.team_keys.includes(key)) return 'red';
  if (match.alliances.blue.team_keys.includes(key)) return 'blue';
  return null;
}

/** Robot position (0-indexed) within alliance */
export function getRobotPosition(match: TBAMatch, teamNumber: number): number | null {
  const key = `frc${teamNumber}`;
  const redIdx = match.alliances.red.team_keys.indexOf(key);
  if (redIdx >= 0) return redIdx;
  const blueIdx = match.alliances.blue.team_keys.indexOf(key);
  if (blueIdx >= 0) return blueIdx;
  return null;
}

/** Extract auto tower confirmation from TBA score_breakdown for a specific robot position */
export function getTbaTowerConfirmed(
  match: TBAMatch,
  alliance: 'red' | 'blue',
  robotPosition: number // 0-indexed
): boolean {
  const sb = match.score_breakdown?.[alliance];
  if (!sb) return false;
  const pos = robotPosition + 1; // TBA uses 1-indexed Robot1/2/3
  const field = `autoTowerRobot${pos}`;
  return sb[field] != null && sb[field] !== 'None';
}

/** Format a match label like "Qual 14" or "SF 2-1" */
export function formatMatchLabel(match: TBAMatch): string {
  const levelMap: Record<string, string> = {
    qm: 'Qual',
    ef: 'Octo',
    qf: 'QF',
    sf: 'SF',
    f: 'Final',
  };
  const level = levelMap[match.comp_level] ?? match.comp_level.toUpperCase();
  if (match.comp_level === 'qm') return `${level} ${match.match_number}`;
  return `${level} ${match.set_number}-${match.match_number}`;
}
