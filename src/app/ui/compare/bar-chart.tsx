import { TeamStats } from '@/app/lib/types';

const CHART_W = 600;
const CHART_H = 180;
const BAR_GAP = 12;
const LABEL_H = 20;
const AXIS_W = 30;

export default function BarChart({ teams }: { teams: TeamStats[] }) {
  if (!teams.length) return null;

  const validTimes = teams.map((t) => t.avgTimeToMiddle ?? 0).filter((v) => v > 0);
  if (!validTimes.length) return null;

  const maxTime = Math.max(...validTimes);
  const barWidth = Math.floor((CHART_W - AXIS_W - (teams.length + 1) * BAR_GAP) / teams.length);

  return (
    <div className="overflow-x-auto">
      <svg
        width={CHART_W}
        height={CHART_H + LABEL_H + 8}
        role="img"
        aria-label="Team autonomous time comparison — shorter bar means faster"
        className="w-full max-w-full"
        viewBox={`0 0 ${CHART_W} ${CHART_H + LABEL_H + 8}`}
      >
        {/* Y axis label */}
        <text x={0} y={CHART_H / 2} fill="#6b7280" fontSize={10} textAnchor="middle"
          transform={`rotate(-90, 8, ${CHART_H / 2})`}>
          seconds
        </text>

        {/* Grid lines */}
        {[0, 5, 10, 15, 20].map((sec) => {
          const y = CHART_H - (sec / maxTime) * CHART_H;
          if (y < 0) return null;
          return (
            <g key={sec}>
              <line x1={AXIS_W} y1={y} x2={CHART_W} y2={y} stroke="#1f2535" strokeWidth={1} />
              <text x={AXIS_W - 4} y={y + 4} fill="#4b5563" fontSize={9} textAnchor="end">{sec}s</text>
            </g>
          );
        })}

        {/* Bars */}
        {teams.map((team, i) => {
          const time = team.avgTimeToMiddle ?? 0;
          const barH = time > 0 ? (time / maxTime) * CHART_H : 4;
          const x = AXIS_W + BAR_GAP + i * (barWidth + BAR_GAP);
          const y = CHART_H - barH;
          const isTop3 = i < 3;

          return (
            <g key={team.teamNumber}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={isTop3 ? '#16a34a' : '#374151'}
                opacity={0.85}
              />
              {/* Time label above bar */}
              {time > 0 && (
                <text x={x + barWidth / 2} y={y - 4} fill="#9ca3af" fontSize={9} textAnchor="middle">
                  {time.toFixed(1)}s
                </text>
              )}
              {/* Team label below */}
              <text
                x={x + barWidth / 2}
                y={CHART_H + LABEL_H - 2}
                fill={isTop3 ? '#4ade80' : '#9ca3af'}
                fontSize={10}
                fontWeight={isTop3 ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                {team.teamNumber}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-gray-600 text-center mt-1">Shorter bar = faster autonomous · Top 3 in green</p>
    </div>
  );
}
