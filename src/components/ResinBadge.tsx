import React from 'react';

interface ResinBadgeProps {
  resinCode: number;
  code: string;
  compact?: boolean;
}

export const ResinBadge: React.FC<ResinBadgeProps> = ({ resinCode, code, compact = false }) => {
  const ricAbbrMap: Record<number, string> = {
    1: 'PETE',
    2: 'HDPE',
    3: 'V',
    4: 'LDPE',
    5: 'PP',
    6: 'PS',
    7: 'OTHER',
  };

  const abbr = ricAbbrMap[resinCode] || code;

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5 bg-bg-base border border-border-subtle px-2 py-0.5 rounded text-xs font-bold text-text-primary"
        title={`کد بازیافت رزین ${resinCode} (${abbr})`}
      >
        <div className="w-4 h-4 flex-shrink-0">
          <svg className="w-full h-full text-status-success" viewBox="0 100" fill="none">
            <path d="M 22 75 L 42 25" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <polygon points="34,22 48,14 46,29" fill="currentColor" />
            <path d="M 58 25 L 78 75" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <polygon points="72,66 86,78 72,82" fill="currentColor" />
            <path d="M 78 81 L 22 81" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <polygon points="28,73 14,78 28,88" fill="currentColor" />
            <text
              x="50"
              y="56"
              textAnchor="middle"
              dominantBaseline="central"
              className="en-mono font-mono tabular-nums font-black text-2xl fill-text-primary"
            >
              {resinCode}
            </text>
          </svg>
        </div>
        <span className="en-mono font-mono tabular-nums text-xs font-bold">
          #{resinCode} ({abbr})
        </span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2.5 bg-bg-surface border-border-subtle px-3 py-1.5 rounded-md text-xs font-bold text-text-primary hover:border border-border-subtle hover:border-slate-600 transition-all group"
      title={`کد بازیافت رزین ${resinCode} (${abbr}) طبق استاندارد ASTM D7611 / ISO 11469`}
    >
      {/* Official RIC Mobius Chasing Arrows Triangle Icon */}
      <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
        <svg
          className="w-full h-full text-status-success group-hover:text-status-success transition-colors"
          viewBox="0 100"
          fill="none"
        >
          {/* Arrow 1: Left going up to Top */}
          <path d="M 22 75 L 42 25" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
          <polygon points="34,22 48,14 46,29" fill="currentColor" />

          {/* Arrow 2: Top going down to Bottom-Right */}
          <path d="M 58 25 L 78 75" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
          <polygon points="72,66 86,78 72,82" fill="currentColor" />

          {/* Arrow 3: Bottom-Right going left to Bottom-Left */}
          <path d="M 78 81 L 22 81" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
          <polygon points="28,73 14,78 28,88" fill="currentColor" />

          {/* Centered Recycling Number inside centroid of triangle */}
          <text
            x="50"
            y="56"
            textAnchor="middle"
            dominantBaseline="central"
            className="en-mono font-mono tabular-nums font-black text-xl fill-text-primary"
          >
            {resinCode}
          </text>
        </svg>
      </div>

      <div className="flex flex-col text-right">
        <span className="text-[10px] text-text-secondary font-medium leading-tight">
          کد بازیافت رزین
        </span>
        <span className="en-mono font-mono tabular-nums text-xs font-bold text-status-success leading-tight">
          Resin #{resinCode} ({abbr})
        </span>
      </div>
    </div>
  );
};
