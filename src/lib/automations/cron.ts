/**
 * Schedule parsing and next-run calculation for automations.
 *
 * Two schedule forms are supported:
 *   - Interval:  `every:5m`, `every:2h`, `every:1d`
 *   - Cron:      standard 5-field `m h dom mon dow` (supports *, lists, ranges, steps)
 */

export interface ScheduleParseResult {
  kind: "interval" | "cron";
  valid: boolean;
  description: string;
}

const INTERVAL_RE = /^every:(\d+)(m|h|d)$/i;
const UNIT_MS: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000 };

export function parseSchedule(schedule: string): ScheduleParseResult {
  const s = schedule.trim();
  const interval = s.match(INTERVAL_RE);
  if (interval) {
    return {
      kind: "interval",
      valid: true,
      description: `Every ${interval[1]} ${{ m: "minute(s)", h: "hour(s)", d: "day(s)" }[interval[2].toLowerCase()]}`,
    };
  }
  const fields = s.split(/\s+/);
  if (fields.length === 5 && isValidCron(fields)) {
    return { kind: "cron", valid: true, description: `Cron: ${s}` };
  }
  return { kind: "cron", valid: false, description: "Invalid schedule expression" };
}

function isValidCron(fields: string[]): boolean {
  const bounds: Array<[number, number]> = [
    [0, 59],
    [0, 23],
    [1, 31],
    [1, 12],
    [0, 6],
  ];
  return fields.every((field, i) => {
    try {
      expandField(field, bounds[i][0], bounds[i][1]);
      return true;
    } catch {
      return false;
    }
  });
}

function expandField(field: string, min: number, max: number): Set<number> {
  const values = new Set<number>();
  for (const part of field.split(",")) {
    let step = 1;
    let range = part;
    const stepSplit = part.split("/");
    if (stepSplit.length === 2) {
      range = stepSplit[0];
      step = Number(stepSplit[1]);
      if (!Number.isInteger(step) || step <= 0) throw new Error("bad step");
    }
    let lo = min;
    let hi = max;
    if (range !== "*") {
      const rangeSplit = range.split("-");
      if (rangeSplit.length === 1) {
        lo = hi = Number(rangeSplit[0]);
      } else if (rangeSplit.length === 2) {
        lo = Number(rangeSplit[0]);
        hi = Number(rangeSplit[1]);
      } else {
        throw new Error("bad range");
      }
      if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < min || hi > max || lo > hi) {
        throw new Error("out of bounds");
      }
    }
    for (let v = lo; v <= hi; v += step) values.add(v);
  }
  return values;
}

/**
 * Compute the next run time after `from` (default now). Returns an ISO string, or
 * null if the schedule is invalid or no match is found within a one-year horizon.
 */
export function computeNextRun(schedule: string, from: Date = new Date()): string | null {
  const parsed = parseSchedule(schedule);
  if (!parsed.valid) return null;

  if (parsed.kind === "interval") {
    const m = schedule.trim().match(INTERVAL_RE)!;
    const ms = Number(m[1]) * UNIT_MS[m[2].toLowerCase()];
    return new Date(from.getTime() + ms).toISOString();
  }

  const [minF, hourF, domF, monF, dowF] = schedule.trim().split(/\s+/);
  const minutes = expandField(minF, 0, 59);
  const hours = expandField(hourF, 0, 23);
  const doms = expandField(domF, 1, 31);
  const mons = expandField(monF, 1, 12);
  const dows = expandField(dowF, 0, 6);

  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1); // strictly after `from`

  const horizon = from.getTime() + 366 * 86_400_000;
  while (cursor.getTime() <= horizon) {
    const domMatch = doms.has(cursor.getDate());
    const dowMatch = dows.has(cursor.getDay());
    // Standard cron: when both DOM and DOW are restricted, either may match.
    const domRestricted = domF !== "*";
    const dowRestricted = dowF !== "*";
    const dayOk =
      domRestricted && dowRestricted ? domMatch || dowMatch : domMatch && dowMatch;

    if (
      minutes.has(cursor.getMinutes()) &&
      hours.has(cursor.getHours()) &&
      mons.has(cursor.getMonth() + 1) &&
      dayOk
    ) {
      return cursor.toISOString();
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return null;
}
