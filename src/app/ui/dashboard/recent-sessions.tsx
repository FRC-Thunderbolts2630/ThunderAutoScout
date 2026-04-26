import Link from 'next/link';
import { ScoutingRecord } from '@/app/lib/types';
import { ClockIcon } from '@heroicons/react/24/outline';

export default function RecentSessions({ records }: { records: ScoutingRecord[] }) {
  if (!records.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No scouting sessions yet. Search for a team to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((r, i) => {
        const teams = r.robots.map((rb) => rb.teamNumber).join(', ');
        const scoutedTeims = r.robots.filter((rb) => rb.timeToMiddle !== null);
        const date = new Date(r.scoutedAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        return (
          <Link
            key={i}
            href={`/scout?matchKey=${r.matchKey}&videoId=${r.youtubeVideoId}&alliance=${r.alliance}`}
            className="flex items-center justify-between p-3 bg-[#1a1f2e] border border-white/5 rounded-lg hover:border-white/15 hover:bg-[#1f2535] transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${r.alliance === 'red' ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'}`}>
                {r.alliance}
              </span>
              <div className="min-w-0">
                <span className="text-sm font-medium text-white truncate block">{r.matchKey}</span>
                <span className="text-xs text-gray-500">Teams: {teams}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-right">
              <div>
                <span className="text-xs text-gray-400 block">{r.scoutName || 'Unknown'}</span>
                <span className="text-xs text-gray-600 flex items-center gap-1 justify-end">
                  <ClockIcon className="w-3 h-3" /> {date}
                </span>
              </div>
              <span className="text-xs text-green-400 font-medium">
                {scoutedTeims.length}/3 timed
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
