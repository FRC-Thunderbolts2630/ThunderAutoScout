import { ZebraData, ZebraTeam } from '@/app/lib/types';
import { ZEBRA_CENTER_X_MIN, ZEBRA_CENTER_X_MAX } from '@/app/lib/constants';

/**
 * Returns the timestamp (in seconds) when the robot first enters the center zone.
 * Returns null if robot never enters the zone or has no position data.
 */
export function getTimeToMiddleFromZebra(
  zebraTeam: ZebraTeam,
  times: number[]
): number | null {
  for (let i = 0; i < times.length; i++) {
    const x = zebraTeam.xs[i];
    if (x !== null && x >= ZEBRA_CENTER_X_MIN && x <= ZEBRA_CENTER_X_MAX) {
      return Math.round(times[i] * 10) / 10; // round to 1 decimal
    }
  }
  return null;
}

/**
 * Analyze all robots in a Zebra dataset.
 * Returns results for only the requested alliance.
 */
export function analyzeZebraForAlliance(
  zebraData: ZebraData,
  alliance: 'red' | 'blue'
): Array<{ teamKey: string; teamNumber: number; timeToMiddle: number | null }> {
  return zebraData.alliances[alliance].map((team) => ({
    teamKey: team.team_key,
    teamNumber: parseInt(team.team_key.replace('frc', ''), 10),
    timeToMiddle: getTimeToMiddleFromZebra(team, zebraData.times),
  }));
}
