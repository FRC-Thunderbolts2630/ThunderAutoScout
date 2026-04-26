import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { fetchTeamMatches, fetchTeamSimple, fetchTeamEvents } from '@/app/lib/tba';
import SearchBar from '@/app/ui/dashboard/search-bar';
import { getScoutingRecordsForTeam, getTeamStats } from '@/app/lib/scouting-db';
import { ScoutingRecord } from '@/app/lib/types';
import StatsHeader from '@/app/ui/teams/stats-header';
import MatchRow from '@/app/ui/teams/match-row';

export default async function TeamPage({ params }: { params: { teamNumber: string } }) {
  const teamNumber = parseInt(params.teamNumber, 10);
  if (isNaN(teamNumber) || teamNumber < 1) notFound();

  const [teamInfo, matches, events, scoutingRecords, stats] = await Promise.all([
    fetchTeamSimple(teamNumber),
    fetchTeamMatches(teamNumber),
    fetchTeamEvents(teamNumber).catch(() => []),
    getScoutingRecordsForTeam(teamNumber).catch(() => [] as ScoutingRecord[]),
    getTeamStats(teamNumber).catch(() => null),
  ]);

  // Map from event_key → short display name
  const eventNames = new Map(
    events.map((e) => [e.key, e.short_name ?? e.name])
  );

  // Build a map from matchKey+alliance to scouting record
  const scoutingMap = new Map<string, ScoutingRecord>();
  for (const r of scoutingRecords) {
    scoutingMap.set(`${r.matchKey}-${r.alliance}`, r);
  }

  const matchesWithVideo = matches.filter((m) => m.videos.some((v) => v.type === 'youtube'));
  const matchesWithoutVideo = matches.filter((m) => !m.videos.some((v) => v.type === 'youtube'));

  function getRecord(match: import('@/app/lib/types').TBAMatch): ScoutingRecord | null {
    const teamKey = `frc${teamNumber}`;
    const alliance = match.alliances.red.team_keys.includes(teamKey) ? 'red' : 'blue';
    return scoutingMap.get(`${match.key}-${alliance}`) ?? null;
  }

  return (
    <div className="space-y-6">
      {/* Back link + search */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors shrink-0">
          <ArrowLeftIcon className="w-4 h-4" />
          Dashboard
        </Link>
        <SearchBar compact />
      </div>

      {/* Stats header */}
      <StatsHeader teamNumber={teamNumber} teamInfo={teamInfo} stats={stats} />

      {/* Match list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Matches — {matches.length} total · {matchesWithVideo.length} with video
          </h2>
          <span className="text-xs text-gray-600">{scoutingRecords.length} scouted</span>
        </div>

        {matches.length === 0 && (
          <p className="text-gray-500 text-sm">No matches found for team {teamNumber} in 2026.</p>
        )}

        <div className="space-y-2">
          {/* Matches with video first */}
          {matchesWithVideo.map((match) => (
            <MatchRow key={match.key} match={match} scoutingRecord={getRecord(match)} teamNumber={teamNumber} eventName={eventNames.get(match.event_key) ?? undefined} />
          ))}

          {/* Divider */}
          {matchesWithVideo.length > 0 && matchesWithoutVideo.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs text-gray-600">Matches without video</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
          )}

          {/* Matches without video */}
          {matchesWithoutVideo.map((match) => (
            <MatchRow key={match.key} match={match} scoutingRecord={getRecord(match)} teamNumber={teamNumber} eventName={eventNames.get(match.event_key) ?? undefined} />
          ))}
        </div>
      </section>
    </div>
  );
}
