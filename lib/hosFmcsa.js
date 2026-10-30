/**
 * FMCSA property-carrying CMV hours-of-service (simplified reference + clock math).
 * Not a certified ELD — for fleet visibility and manual log support.
 */

export const FMCSA_HOS_KEY = [
  {
    id: '11_hour',
    title: '11-hour driving limit',
    simple: 'After 10 hours off duty, you may drive up to 11 hours.',
    rule: '49 CFR 395.3(a)(3)(i)',
  },
  {
    id: '14_hour',
    title: '14-hour on-duty window',
    simple: 'You cannot drive after 14 consecutive hours on duty (driving + other work) following 10 hours off.',
    rule: '49 CFR 395.3(a)(2)',
  },
  {
    id: '30_min_break',
    title: '30-minute break',
    simple: 'Take at least 30 minutes off duty before you have been driving 8 hours (since last 10-hour off or 30-min break).',
    rule: '49 CFR 395.3(a)(3)(ii)',
  },
  {
    id: '10_hour',
    title: '10-hour off-duty reset',
    simple: '10 consecutive hours off duty (or sleeper) resets your 11-hour drive and 14-hour window.',
    rule: '49 CFR 395.3(a)(1)',
  },
  {
    id: '70_hour',
    title: '70-hour / 8-day limit',
    simple: 'On duty (driving + not driving) may not exceed 70 hours in any 8 consecutive days.',
    rule: '49 CFR 395.3(b)(2)',
  },
  {
    id: '34_hour',
    title: '34-hour restart',
    simple: '34 consecutive hours off duty restarts your 70-hour/8-day cycle.',
    rule: '49 CFR 395.3(c)',
  },
];

export const HOS_LIMITS = {
  maxDriveHours: 11,
  maxWindowHours: 14,
  minOffDutyResetHours: 10,
  breakAfterDriveHours: 8,
  breakMinutes: 30,
  cycle70Hours: 70,
  cycleDays: 8,
  restart34Hours: 34,
};

const MS_HOUR = 3600000;
const MS_MIN = 60000;

function parseSegmentTimes(seg, logDate, now = new Date()) {
  const status = seg.status || 'off_duty';
  let start;
  let end;

  if (seg.start_time?.includes('T')) {
    start = new Date(seg.start_time);
    end = seg.end_time ? new Date(seg.end_time) : now;
  } else if (seg.start_time && logDate) {
    start = new Date(`${logDate}T${seg.start_time}:00`);
    end = seg.end_time
      ? new Date(`${logDate}T${seg.end_time}:00`)
      : now;
    if (end <= start) end = new Date(end.getTime() + 24 * MS_HOUR);
  } else {
    return null;
  }

  if (Number.isNaN(start.getTime())) return null;
  if (Number.isNaN(end.getTime())) end = now;
  if (end > now) end = now;
  if (end <= start) return null;

  return { start, end, status, hours: (end - start) / MS_HOUR };
}

export function flattenDutySegments(hosLogs, now = new Date()) {
  const ranges = [];
  for (const log of hosLogs || []) {
    const date = log.log_date;
    for (const seg of log.duty_segments || []) {
      const r = parseSegmentTimes(seg, date, now);
      if (r) ranges.push(r);
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  return ranges;
}

function hoursInRange(ranges, statusSet, from, to) {
  let total = 0;
  for (const r of ranges) {
    if (!statusSet.has(r.status)) continue;
    const s = Math.max(r.start.getTime(), from.getTime());
    const e = Math.min(r.end.getTime(), to.getTime());
    if (e > s) total += (e - s) / MS_HOUR;
  }
  return total;
}

function sumStatusHours(ranges, statusSet) {
  return ranges
    .filter((r) => statusSet.has(r.status))
    .reduce((s, r) => s + r.hours, 0);
}

const DRIVING = new Set(['driving']);
const ON_DUTY = new Set(['driving', 'on_duty_not_driving']);
const OFF_RESET = new Set(['off_duty', 'sleeper_berth']);

/**
 * Compute live HOS clocks for a driver from recent logs + optional current duty.
 */
export function computeDriverHosClocks(hosLogs, options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  const currentDuty = options.currentDuty || 'off_duty';
  const ranges = flattenDutySegments(hosLogs, now);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const cycleStart = new Date(now.getTime() - (HOS_LIMITS.cycleDays - 1) * 24 * MS_HOUR);
  cycleStart.setHours(0, 0, 0, 0);

  const driveToday = hoursInRange(ranges, DRIVING, todayStart, now);
  const onDutyToday = hoursInRange(ranges, ON_DUTY, todayStart, now);

  const driveRolling = hoursInRange(ranges, DRIVING, cycleStart, now);
  const onDutyRolling = hoursInRange(ranges, ON_DUTY, cycleStart, now);

  const driveRemaining = Math.max(0, HOS_LIMITS.maxDriveHours - driveToday);
  const windowRemaining = Math.max(0, HOS_LIMITS.maxWindowHours - onDutyToday);
  const cycleRemaining = Math.max(0, HOS_LIMITS.cycle70Hours - onDutyRolling);

  // Consecutive off/sleeper ending at now (walk backward)
  let consecutiveOffHours = 0;
  if (OFF_RESET.has(currentDuty)) {
    consecutiveOffHours = options.consecutiveOffHours ?? estimateConsecutiveOff(ranges, now);
  }

  const breakDrivingSinceReset = options.drivingSinceBreakHours ?? estimateDrivingSinceBreak(ranges, now);

  const need30MinBreak =
    breakDrivingSinceReset >= HOS_LIMITS.breakAfterDriveHours
    && currentDuty === 'driving';

  const violations = [];
  if (driveToday > HOS_LIMITS.maxDriveHours) {
    violations.push(`11-hour driving limit exceeded (${driveToday.toFixed(1)}h today)`);
  }
  if (onDutyToday > HOS_LIMITS.maxWindowHours) {
    violations.push(`14-hour window exceeded (${onDutyToday.toFixed(1)}h on duty today)`);
  }
  if (onDutyRolling > HOS_LIMITS.cycle70Hours) {
    violations.push(`70-hour/8-day limit exceeded (${onDutyRolling.toFixed(1)}h)`);
  }
  if (need30MinBreak) {
    violations.push('30-minute break required before more driving (8h drive without break)');
  }

  return {
    computedAt: now.toISOString(),
    currentDuty,
    driveUsedToday: round1(driveToday),
    onDutyUsedToday: round1(onDutyToday),
    driveRemaining: round1(driveRemaining),
    windowRemaining: round1(windowRemaining),
    cycleUsed8Day: round1(onDutyRolling),
    cycleRemaining: round1(cycleRemaining),
    consecutiveOffHours: round1(consecutiveOffHours),
    tenHourResetReady: consecutiveOffHours >= HOS_LIMITS.minOffDutyResetHours,
    thirtyFourHourResetProgress: round1(Math.min(consecutiveOffHours, HOS_LIMITS.restart34Hours)),
    thirtyFourHourResetReady: consecutiveOffHours >= HOS_LIMITS.restart34Hours,
    drivingSinceBreakHours: round1(breakDrivingSinceReset),
    breakRequired: need30MinBreak,
    breakRemainingMinutes: need30MinBreak ? 0 : Math.max(0, Math.round((HOS_LIMITS.breakAfterDriveHours - breakDrivingSinceReset) * 60)),
    violations,
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function estimateConsecutiveOff(ranges, now) {
  let total = 0;
  const sorted = [...ranges].sort((a, b) => b.end - a.end);
  let cursor = now.getTime();
  for (const r of sorted) {
    if (!OFF_RESET.has(r.status)) break;
    if (r.end.getTime() < cursor - MS_MIN) break;
    const chunkStart = Math.max(r.start.getTime(), cursor - 7 * 24 * MS_HOUR);
    const chunkEnd = Math.min(r.end.getTime(), cursor);
    if (chunkEnd > chunkStart) {
      total += (chunkEnd - chunkStart) / MS_HOUR;
      cursor = chunkStart;
    }
  }
  return total;
}

function estimateDrivingSinceBreak(ranges, now) {
  let drive = 0;
  const sorted = [...ranges].sort((a, b) => b.end - a.end);
  for (const r of sorted) {
    if (r.end > now) continue;
    if (OFF_RESET.has(r.status)) {
      const breakH = r.hours;
      if (breakH >= HOS_LIMITS.breakMinutes / 60) break;
      if (breakH >= HOS_LIMITS.minOffDutyResetHours) break;
    }
    if (DRIVING.has(r.status)) drive += r.hours;
  }
  return drive;
}

/** Legacy daily log check (single log row totals). */
export function detectViolationsFromDailyLog(log) {
  const v = [];
  const driving = log.hours_driving || 0;
  const onDuty = (log.hours_driving || 0) + (log.hours_on_duty || 0);
  const offAndSleeper = (log.hours_off_duty || 0) + (log.hours_sleeper || 0);

  if (driving > HOS_LIMITS.maxDriveHours) {
    v.push(`11-Hour Driving Limit exceeded (${driving.toFixed(1)} hrs driven)`);
  }
  if (onDuty > HOS_LIMITS.maxWindowHours) {
    v.push(`14-Hour On-Duty Window exceeded (${onDuty.toFixed(1)} hrs on-duty)`);
  }
  if (offAndSleeper < HOS_LIMITS.minOffDutyResetHours && driving > 0) {
    v.push(`10-Hour Off-Duty reset may be insufficient (${offAndSleeper.toFixed(1)} hrs off/sleeper)`);
  }
  return v;
}

export function formatClockHours(hours) {
  if (hours == null || Number.isNaN(hours)) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h <= 0 && m <= 0) return '0m';
  if (h <= 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
