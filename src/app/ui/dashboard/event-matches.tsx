import Link from 'next/link';
import { CheckIcon, PlayIcon } from '@heroicons/react/24/solid';
import { TBAMatch } from '@/app/lib/types';
import { formatMatchLabel, getYouTubeVideoId } from '@/app/lib/tba';

interface EventMatchesProps {
  matches: TBAMatch[];
  /** Array of "matchKey|alliance" strings — converted to Set inside component for O(1) lookup */
  scoutedKeys: string[];
  /** Match keys (no alliance suffix) where all 6 robots have data */
  fullyScoutedMatchKeys: string[];
  myTeam: number;
}

const LEVEL_ORDER: Record<string, number> = { qm: 0, ef: 1, qf: 2, sf: 3, f: 4 };
const LEVEL_LABEL: Record<string, string> = {
  qm: 'Qualifications', ef: 'Octofinals', qf: 'Quarterfinals', sf: 'Semifinals', f: 'Finals',
};

function scoutUrl(match: TBAMatch, ytId: string, alliance: 'red' | 'blue'): string {
  const red  = match.alliances.red.team_keys.map(k => k.replace('frc', '')).join(',');
  const blue = match.alliances.blue.team_keys.map(k => k.replace('frc', '')).join(',');
  return `/scout?videoId=${ytId}&matchKey=${match.key}&redTeams=${red}&blueTeams=${blue}&alliance=${alliance}`;
}

function AllianceTeams({ teams, myTeam, alliance }: {
  teams: string[];
  myTeam: number;
  alliance: 'red' | 'blue';
}) {
  const color = alliance === 'red' ? 'text-red-400' : 'text-blue-400';
  return (
    <div className={`flex items-center gap-1 text-xs ${color}`}>
      {teams.map((key) => {
        const n = parseInt(key.replace('frc', ''), 10);
        const isMe = n === myTeam;
        return (
          <Link key={key} href={`/teams/${n}`}
            className={`hover:underline transition-colors ${isMe ? 'font-bold text-yellow-300' : 'hover:text-white'}`}>
            {isMe && '★'}{n}
          </Link>
        );
      })}
    </div>
  );
}

function ScoutBadge({ url, alliance, scouted }: {
  url: string | null;
  alliance: 'red' | 'blue';
  scouted: boolean;
}) {
  if (!url) {
    return <span className="text-[10px] text-gray-700">no video</span>;
  }

  const bg = alliance === 'red' ? 'bg-red-900/40 hover:bg-red-800/50 text-red-300'
           : 'bg-blue-900/40 hover:bg-blue-800/50 text-blue-300';

  return (
    <Link href={url}
      aria-label={scouted ? `View scouted ${alliance} alliance` : `Scout ${alliance} alliance`}
      className={scouted
        ? 'flex items-center justify-center w-6 h-6 bg-green-900/40 hover:bg-green-800/50 text-green-400 rounded transition-colors'
        : `flex items-center justify-center w-6 h-6 ${bg} rounded transition-colors`}>
      {scouted ? <CheckIcon className="w-3 h-3" /> : <PlayIcon className="w-3 h-3" />}
    </Link>
  );
}

function MatchRow({ match, scoutedSet, fullyScoutedSet, myTeam }: {
  match: TBAMatch;
  scoutedSet: Set<string>;
  fullyScoutedSet: Set<string>;
  myTeam: number;
}) {
  const ytId = getYouTubeVideoId(match);
  const redScouted    = scoutedSet.has(`${match.key}|red`);
  const blueScouted   = scoutedSet.has(`${match.key}|blue`);
  const fullyDone     = fullyScoutedSet.has(match.key);

  const myAlliance = match.alliances.red.team_keys.includes(`frc${myTeam}`) ? 'red'
    : match.alliances.blue.team_keys.includes(`frc${myTeam}`) ? 'blue' : null;

  // Cover link: open scout page for myTeam's alliance (or red if not in match)
  const rowAlliance = myAlliance ?? 'red';
  const rowHref = ytId ? scoutUrl(match, ytId, rowAlliance) : null;

  return (
    <div className={`relative flex items-center gap-2 px-3 py-2 transition-colors border-b border-white/5 last:border-0 ${rowHref ? 'hover:bg-white/5 cursor-pointer' : 'hover:bg-white/3'} ${myAlliance ? 'border-l-2 ' + (myAlliance === 'red' ? 'border-l-red-600/60' : 'border-l-blue-600/60') : ''}`}>
      {/* Full-row cover link behind interactive elements */}
      {rowHref && (
        <Link href={rowHref} className="absolute inset-0 z-10" aria-label={`Scout ${formatMatchLabel(match)}`} tabIndex={-1} />
      )}

      {/* Per-match completion indicator (all 6 robots have data) */}
      <div className="relative z-20 w-4 shrink-0 flex items-center justify-center">
        {fullyDone && (
          <CheckIcon className="w-3.5 h-3.5 text-green-400" aria-label="All 6 robots scouted" />
        )}
      </div>

      {/* Match label */}
      <span className="relative z-20 text-xs font-mono text-gray-400 w-14 shrink-0">
        {formatMatchLabel(match)}
      </span>

      {/* Red alliance */}
      <div className="relative z-20 flex items-center gap-1 flex-1 min-w-0">
        <AllianceTeams teams={match.alliances.red.team_keys} myTeam={myTeam} alliance="red" />
      </div>

      {/* Blue alliance */}
      <div className="relative z-20 flex items-center gap-1 flex-1 min-w-0">
        <AllianceTeams teams={match.alliances.blue.team_keys} myTeam={myTeam} alliance="blue" />
      </div>

    </div>
  );
}

export default function EventMatches({ matches, scoutedKeys, fullyScoutedMatchKeys, myTeam }: EventMatchesProps) {
  const scoutedSet = new Set(scoutedKeys);
  const fullyScoutedSet = new Set(fullyScoutedMatchKeys);

  if (!matches.length) {
    return (
      <p className="text-gray-500 text-sm text-center py-6">
        No matches found for this event.
      </p>
    );
  }

  // Group by comp_level in order
  const groups = new Map<string, TBAMatch[]>();
  const ordered = [...matches].sort(
    (a, b) => (LEVEL_ORDER[a.comp_level] ?? 9) - (LEVEL_ORDER[b.comp_level] ?? 9) || (a.time ?? 0) - (b.time ?? 0)
  );
  for (const m of ordered) {
    if (!groups.has(m.comp_level)) groups.set(m.comp_level, []);
    groups.get(m.comp_level)!.push(m);
  }

  return (
    <div className="bg-[#151a27] border border-white/8 rounded-xl overflow-hidden">
      {/* Match rows grouped by level */}
      <div className="max-h-[480px] overflow-y-auto">
        {[...groups.entries()].map(([level, lvlMatches]) => (
          <div key={level}>
            {level !== 'qm' && (
              <div className="px-3 py-1 bg-white/5 border-y border-white/8">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {LEVEL_LABEL[level] ?? level.toUpperCase()}
                </span>
              </div>
            )}
            {lvlMatches.map((m) => (
              <MatchRow key={m.key} match={m} scoutedSet={scoutedSet} fullyScoutedSet={fullyScoutedSet} myTeam={myTeam} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
