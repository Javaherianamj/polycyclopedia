import React, { useState } from 'react';
import { PolymerData } from '../types/polymer';
import { InfoTooltip } from './InfoTooltip';

interface BranchingSimulatorProps {
  polymer: PolymerData;
}

export const BranchingSimulator: React.FC<BranchingSimulatorProps> = ({ polymer }) => {
  // Branch count slider (number of branches per 1000 carbon atoms)
  const [branchingLevel, setBranchingLevel] = useState<number>(15);

  // Dynamic property calculations for LDPE based on branching level
  // SCB (Short Chain Branching) and LCB (Long Chain Branching) effect
  const calcCrystallinity = Math.max(30, Math.min(65, Math.round(65 - branchingLevel * 1.1)));
  const calcDensity = (0.94 - (branchingLevel / 30) * 0.025).toFixed(3);
  const calcYieldStrength = Math.max(8, Math.round(24 - (branchingLevel / 30) * 12));
  const calcMeltingTemp = Math.max(98, Math.round(115 - (branchingLevel / 30) * 10));

  // Determine classification based on branching
  let classification = 'LDPE استاندارد';
  if (branchingLevel < 8) classification = 'LLDPE-like (شاخه‌داری کم)';
  else if (branchingLevel > 22) classification = 'VLDPE-like (شاخه‌داری بسیار زیاد)';

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 my-6 shadow-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-3 border-b border-border-subtle">
        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-text-primary">
          <span>شبیه‌ساز اثر شاخه‌داری بر خواص (Chain Branching Simulator)</span>
          <InfoTooltip text="در سنتز رادیکالی LDPE، انتقال زنجیر درون‌مولکولی (Backbiting) باعث ایجاد شاخه‌های کوتاه (SCB) می‌شود که نظم بلوری را بر هم می‌زند." />
        </h3>
        <span className="text-xs font-bold px-2.5 py-1 rounded bg-status-warning text-bg-surface border-status-warning border-status-warning">
          تأثیر بر ریزساختار
        </span>
      </div>

      <p className="text-xs sm:text-sm text-text-secondary mb-5 leading-relaxed">
        شاخه‌های جانبی در پلی‌اتیلن به عنوان نقص در شبکه بلوری عمل می‌کنند. با افزایش میزان
        شاخه‌داری (تعداد شاخه در هر ۱۰۰۰ اتم کربن)، فاصله‌ی بین زنجیره‌های پلیمری افزایش یافته و
        امکان تشکیل نواحی کریستالی متراکم کاهش می‌یابد. با تغییر اسلایدر زیر، اثر میزان شاخه‌داری را
        بر معماری زنجیر و خواص نهایی مشاهده کنید.
      </p>

      {/* Interactive Visual Canvas Box */}
      <div className="bg-bg-base border border-border-subtle rounded p-4 mb-6 shadow-inner relative overflow-hidden">
        <div className="flex justify-between items-center text-xs text-text-secondary mb-4 relative z-10">
          <span className="font-bold">مورفولوژی فضایی زنجیر پلیمری:</span>
          <span className="text-status-warning font-bold bg-bg-surface/80 px-2 py-0.5 rounded">
            {classification}
          </span>
        </div>

        {/* Chain Visualization SVG */}
        <div className="overflow-x-auto py-2" dir="ltr">
          <svg
            className="w-full min-w-[650px] h-[180px] relative z-10"
            viewBox="0 800 180"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Render 3 parallel chains to show steric hindrance and free volume */}
            {[0, 1, 2].map((chainIdx) => {
              // Calculate dynamic vertical gap based on branching
              const gap = 15 + branchingLevel * 1.5;
              const y1 = 90 + (chainIdx - 1) * gap;

              return (
                <g key={`chain-${chainIdx}`} className="transition-all duration-300 ease-out">
                  {/* Backbone */}
                  <path
                    d={`M 25,${y1} Q 50,${y1 - 15} 90,${y1} T 170,${y1} T 250,${y1} T 330,${y1} T 410,${y1} T 490,${y1} T 570,${y1} T 650,${y1} T 730,${y1} T 780,${y1}`}
                    stroke="var(--accent-secondary)"
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <text
                    x="2"
                    y={y1 + 4}
                    fontSize="20"
                    fill="var(--accent-secondary)"
                    fontWeight="900"
                    letterSpacing="-1"
                  >
                    ...
                  </text>
                  <text
                    x="785"
                    y={y1 + 4}
                    fontSize="20"
                    fill="var(--accent-secondary)"
                    fontWeight="900"
                    letterSpacing="-1"
                  >
                    ...
                  </text>

                  {/* Branches for this chain */}
                  {Array.from({ length: Math.ceil(branchingLevel * 0.8) }).map((_, branchIdx) => {
                    const segment = 760 / Math.max(1, Math.ceil(branchingLevel * 0.8));
                    // Stagger branches across chains
                    const x =
                      30 +
                      branchIdx * segment +
                      chainIdx * 15 +
                      Math.sin(branchIdx * chainIdx) * 10;

                    // Alternate branches up and down, but avoid crossing middle chain too much
                    const isTop = (branchIdx + chainIdx) % 2 === 0;
                    const isLongBranch = branchIdx % 3 === 0; // Every 3rd branch is a LCB

                    const branchBaseLen = isLongBranch ? 30 : 15;
                    const y2 = isTop ? y1 - branchBaseLen : y1 + branchBaseLen;

                    const xEnd = x + (branchIdx % 2 === 0 ? 10 : -10);

                    return (
                      <g
                        key={`branch-${chainIdx}-${branchIdx}`}
                        style={{
                          transformOrigin: `${x}px ${y1}px`,
                          transform: `scaleY(${1 + (branchIdx % 2) * 0.1})`,
                        }}
                      >
                        <path
                          d={`M ${x},${y1} Q ${x + 5},${(y1 + y2) / 2} ${xEnd},${y2}`}
                          stroke={isLongBranch ? 'var(--status-error)' : 'var(--status-warning)'}
                          strokeWidth="2.5"
                          fill="none"
                          strokeLinecap="round"
                        />

                        {isLongBranch && (
                          <path
                            d={`M ${(x + xEnd) / 2},${(y1 + y2) / 2} L ${xEnd + 10},${y2 - (isTop ? -8 : 8)}`}
                            stroke="var(--status-warning)"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                          />
                        )}

                        <circle
                          cx={xEnd}
                          cy={y2}
                          r="3"
                          fill={isLongBranch ? 'var(--status-error)' : 'var(--status-warning)'}
                        />
                        {isLongBranch && (
                          <circle
                            cx={xEnd + 10}
                            cy={y2 - (isTop ? -8 : 8)}
                            r="2"
                            fill="var(--status-warning)"
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 left-3 flex gap-3 text-[10px] font-bold text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-primary"></div>زنجیر اصلی
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-status-warning"></div>شاخه کوتاه (SCB)
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-status-error"></div>شاخه بلند (LCB)
          </div>
        </div>
      </div>

      {/* Slider Control */}
      <div className="space-y-5">
        <div className="bg-bg-surface/50 p-4 rounded-lg border border-border-subtle">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-bold text-text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-warning"></span>
              میزان شاخه‌داری (Branches per 1000 C)
            </label>
            <span className="en-mono text-sm font-black text-status-warning bg-bg-surface px-3 py-1 rounded-md border border-border-subtle shadow-sm">
              {branchingLevel} B / 1000C
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="30"
            step="1"
            value={branchingLevel}
            onChange={(e) => setBranchingLevel(Number(e.target.value))}
            className="w-full relative z-10 my-2"
            style={{ '--slider-color': 'var(--status-warning)' } as React.CSSProperties}
          />
          <div className="flex justify-between text-[10px] text-text-secondary mt-2 px-1 font-bold">
            <span>خطی‌تر (چگالی بالا)</span>
            <span>شاخه‌دار (چگالی پایین)</span>
          </div>
        </div>

        {/* Dynamic Property Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-slate-50 to-white from-slate-900 to-slate-950 border border-border-subtle p-3.5 rounded-lg shadow-sm transition-all duration-300">
            <div className="text-[11px] font-bold text-text-secondary mb-1.5 flex items-center justify-between">
              <span>درصد بلورینگی</span>
            </div>
            <div className="en-mono text-xl font-black text-accent-primary">
              {calcCrystallinity} %
            </div>
            <div className="text-[9px] text-text-secondary mt-1">کاهش با افزایش شاخه</div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white from-slate-900 to-slate-950 border border-border-subtle p-3.5 rounded-lg shadow-sm transition-all duration-300">
            <div className="text-[11px] font-bold text-text-secondary mb-1.5 flex items-center justify-between">
              <span>چگالی (Density)</span>
            </div>
            <div className="en-mono text-xl font-black text-status-success">
              {calcDensity} g/cm³
            </div>
            <div className="text-[9px] text-text-secondary mt-1">تابع مستقیم بلورینگی</div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white from-slate-900 to-slate-950 border border-border-subtle p-3.5 rounded-lg shadow-sm transition-all duration-300">
            <div className="text-[11px] font-bold text-text-secondary mb-1.5 flex items-center justify-between">
              <span>دمای ذوب (Tm)</span>
            </div>
            <div className="en-mono text-xl font-black text-status-error">{calcMeltingTemp} °C</div>
            <div className="text-[9px] text-text-secondary mt-1">تضعیف شبکه کریستالی</div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white from-slate-900 to-slate-950 border border-border-subtle p-3.5 rounded-lg shadow-sm transition-all duration-300">
            <div className="text-[11px] font-bold text-text-secondary mb-1.5 flex items-center justify-between">
              <span>استحکام تسلیم</span>
            </div>
            <div className="en-mono text-xl font-black text-status-warning">
              {calcYieldStrength} MPa
            </div>
            <div className="text-[9px] text-text-secondary mt-1">کاهش استحکام مکانیکی</div>
          </div>
        </div>
      </div>
    </div>
  );
};
