import { TeamStats, TBATeamSimple } from '@/app/lib/types';
import { ZONE_LABEL } from '@/app/lib/constants';

function Sparkline({ values }: { values: (number | null)[] }) {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < 2) return null;
  const max = Math.max(...valid);
  const min = Math.min(...valid);
  const range = max - min || 1;
  const W = 120, H = 32;
  const pts = values
    .map((v, i) => {
      if (v === null) return null;
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');

  return (
    <svg width={W} height={H} aria-hidden className="text-green-400">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StatsHeader({
  teamNumber,
  teamInfo,
  stats,
}: {
  teamNumber: number;
  teamInfo: TBATeamSimple | null;
  stats: TeamStats | null;
}) {
  const location = [teamInfo?.city, teamInfo?.state_prov, teamInfo?.country].filter(Boolean).join(', ');

  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">
            Team {teamNumber}
            {teamInfo?.nickname && <span className="text-gray-400 font-normal ml-2">— {teamInfo.nickname}</span>}
          </h1>
          {location && <p className="text-sm text-gray-500 mt-0.5">{location}</p>}
        </div>
        {stats && <Sparkline values={stats.timesSeries} />}
      </div>

      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label={`Avg to ${ZONE_LABEL}`} value={stats.avgTimeToMiddle !== null ? `${stats.avgTimeToMiddle.toFixed(1)}s` : '—'} highlight />
          <Stat label="Fastest" value={stats.fastestTime !== null ? `${stats.fastestTime.toFixed(1)}s` : '—'} />
          <Stat label="Slowest" value={stats.slowestTime !== null ? `${stats.slowestTime.toFixed(1)}s` : '—'} />
          <Stat label="Scouted" value={String(stats.matchesScoutedCount)} />
        </div>
      ) : (
        <p className="text-sm text-gray-500">No scouting data yet for this team.</p>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-2xl font-bold font-mono ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
