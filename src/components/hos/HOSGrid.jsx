import React, { useMemo } from 'react';

const STATUS_COLORS = {
  off_duty:            { bg: '#f1f5f9', line: '#94a3b8', label: 'OFF DUTY',            short: 'OFF' },
  sleeper_berth:       { bg: '#eff6ff', line: '#3b82f6', label: 'SLEEPER BERTH',        short: 'SB'  },
  driving:             { bg: '#f0fdf4', line: '#16a34a', label: 'DRIVING',              short: 'D'   },
  on_duty_not_driving: { bg: '#fefce8', line: '#ca8a04', label: 'ON DUTY (Not Driving)', short: 'ON'  },
};

const ROWS = ['off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving'];
const HOURS = Array.from({ length: 25 }, (_, i) => i); // 0..24

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function HOSGrid({ segments = [] }) {
  // Build per-row filled minute ranges
  const rowRanges = useMemo(() => {
    const map = {};
    ROWS.forEach(r => { map[r] = []; });
    segments.forEach(seg => {
      const start = timeToMinutes(seg.start_time);
      const end = timeToMinutes(seg.end_time);
      if (start == null || end == null || !map[seg.status]) return;
      map[seg.status].push([Math.min(start, end), Math.max(start, end)]);
    });
    return map;
  }, [segments]);

  const totalMinutes = 24 * 60;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Hour labels */}
        <div className="flex ml-40 mb-1">
          {HOURS.map(h => (
            <div key={h} className="flex-1 text-center text-xs text-slate-400 font-mono" style={{ minWidth: 0 }}>
              {h === 0 ? 'M' : h === 12 ? 'N' : h === 24 ? 'M' : h < 10 ? h : h}
            </div>
          ))}
        </div>

        {ROWS.map(status => {
          const cfg = STATUS_COLORS[status];
          const ranges = rowRanges[status];
          return (
            <div key={status} className="flex items-stretch mb-px" style={{ height: 36 }}>
              {/* Label */}
              <div className="w-40 flex-shrink-0 flex items-center pr-2">
                <span className="text-xs font-bold text-slate-600 leading-tight">{cfg.label}</span>
              </div>
              {/* Grid */}
              <div className="flex-1 relative border border-slate-200 rounded" style={{ background: '#fafafa' }}>
                {/* Hour grid lines */}
                {HOURS.slice(0, 24).map(h => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 border-l border-slate-200"
                    style={{ left: `${(h / 24) * 100}%` }}
                  />
                ))}
                {/* Half-hour ticks */}
                {HOURS.slice(0, 24).map(h => (
                  <div
                    key={`half-${h}`}
                    className="absolute top-0 bottom-0 border-l border-slate-100"
                    style={{ left: `${((h + 0.5) / 24) * 100}%` }}
                  />
                ))}
                {/* Filled segments */}
                {ranges.map(([start, end], i) => (
                  <div
                    key={i}
                    className="absolute top-1 bottom-1 rounded-sm opacity-90"
                    style={{
                      left: `${(start / totalMinutes) * 100}%`,
                      width: `${((end - start) / totalMinutes) * 100}%`,
                      background: cfg.line,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Bottom hour labels */}
        <div className="flex ml-40 mt-1">
          {HOURS.map(h => (
            <div key={h} className="flex-1 text-center text-xs text-slate-300 font-mono" style={{ minWidth: 0 }}>
              {h % 6 === 0 ? h : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}