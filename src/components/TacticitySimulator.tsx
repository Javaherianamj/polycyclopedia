import React, { useState, useEffect } from 'react';
import { PolymerData } from '../types/polymer';
import { InfoTooltip } from './InfoTooltip';

interface TacticitySimulatorProps {
  polymer: PolymerData;
}

export const TacticitySimulator: React.FC<TacticitySimulatorProps> = ({ polymer }) => {
  // 8 monomer units sequence: 1 = UP (side A), -1 = DOWN (side B)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [rings, setRings] = useState<number[]>([1, 1, -1, 1, -1, -1, 1, -1]); // Default Atactic
  const [mode, setMode] = useState<'atactic' | 'isotactic' | 'syndiotactic'>('atactic');

  // Set preset tacticity sequences
  const handleSetPreset = (presetMode: 'atactic' | 'isotactic' | 'syndiotactic') => {
    setMode(presetMode);
    if (presetMode === 'isotactic') {
      setRings([1, 1, 1, 1, 1, 1, 1, 1]);
    } else if (presetMode === 'syndiotactic') {
      setRings([1, -1, 1, -1, 1, -1, 1, -1]);
    } else {
      // Atactic random sequence
      setRings([1, 1, -1, 1, -1, -1, 1, -1]);
    }
  };

  // Toggle individual ring position manually
  const toggleRing = (index: number) => {
    const updated = [...rings];
    updated[index] = updated[index] === 1 ? -1 : 1;
    setRings(updated);

    // Determine current mode based on sequence
    const isIso = updated.every((val) => val === updated[0]);
    const isSyndio = updated.every((val, idx) =>
      idx % 2 === 0 ? val === updated[0] : val === -updated[0],
    );

    if (isIso) setMode('isotactic');
    else if (isSyndio) setMode('syndiotactic');
    else setMode('atactic');
  };

  const isPP = polymer.id === 'pp';

  const crystallinity = isPP
    ? mode === 'syndiotactic'
      ? '30 - 45 % (sPP بلوری)'
      : mode === 'isotactic'
        ? '50 - 70 % (iPP نیمه‌بلوری)'
        : '0 % (aPP چسبناک آمورف)'
    : mode === 'syndiotactic'
      ? '40 - 50 % (sPS بلوری بالا)'
      : mode === 'isotactic'
        ? '30 - 40 % (iPS نیمه‌بلوری)'
        : '0 % (aPS / GPPS آمورف)';

  const tmValue = isPP
    ? mode === 'syndiotactic'
      ? '125 - 135 °C'
      : mode === 'isotactic'
        ? '160 - 168 °C'
        : 'ندارد (فاقد نقطه ذوب بلوری)'
    : mode === 'syndiotactic'
      ? '270 °C'
      : mode === 'isotactic'
        ? '240 °C'
        : 'ندارد (فاقد نقطه ذوب بلوری)';

  const appearance =
    mode === 'syndiotactic'
      ? 'کدر / سفیدبلوری'
      : mode === 'isotactic'
        ? 'نیمه‌شفاف'
        : 'کاملاً شفاف نوری';

  const commercialName = isPP
    ? mode === 'syndiotactic'
      ? 'sPP (پلی‌پروپیلن سیندیوتاکتیک - متالوسن)'
      : mode === 'isotactic'
        ? 'iPP (پلی‌پروپیلن ایزوتاکتیک - زیگلر-ناتا)'
        : 'aPP (پلی‌پروپیلن آتاکتیک - رزین نرم)'
    : mode === 'syndiotactic'
      ? 'sPS (سیندیوتاکتیک - متالوسن)'
      : mode === 'isotactic'
        ? 'iPS (ایزوتاکتیک - کریستالیزاسیون کند)'
        : 'aPS (آتاکتیک - گرید عمومی)';

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 my-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-3 border-b border-border-subtle">
        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-text-primary">
          <span>شبیه‌ساز فضاشیمی و تاکتیسیته (Stereochemistry & Tacticity Engine)</span>
          <InfoTooltip text="ارتقای فضاشیمی به کمک کاتالیزورهای کئوردیناسیونی زیگلر-ناتا و متالوسن صورت می‌گیرد." />
        </h3>
        <span className="en-mono text-xs font-bold px-2.5 py-1 rounded bg-accent-primary text-bg-surface border-accent-secondary border-accent-primary">
          کنترل فضایی گروه جانبی R
        </span>
      </div>

      <p className="text-xs sm:text-sm text-text-secondary mb-4 leading-relaxed">
        تاکتیسیته (Tacticity) آرایش فضایی متوالی گروه‌های جانبی (مانند فنیل یا متیل) نسبت به صفحه
        اصلی زنجیر را سنجش می‌کند. کاتالیزورهای{' '}
        <strong>کئوردیناسیون درج (Coordination-Insertion)</strong> کنترل فضایی (Stereospecificity)
        را بر عهده دارند:
      </p>

      {/* Tacticity Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <button
          onClick={() => handleSetPreset('atactic')}
          className={`p-3.5 rounded border text-right transition-all cursor-pointer ${
            mode === 'atactic'
              ? 'bg-amber-50 bg-amber-950/50 border-status-warning text-amber-950 text-amber-100 shadow-xs'
              : 'bg-bg-base border-border-subtle text-text-secondary hover:border-amber-400'
          }`}
        >
          <div className="font-extrabold text-sm mb-1 flex-col sm:flex-row justify-between sm:items-center gap-1">
            <span>آتاکتیک (Atactic)</span>
            <span className="en-mono text-[10px] bg-status-warning text-text-primary font-bold px-1.5 py-0.5 rounded self-start sm:self-auto">
              آرایش تصادفی
            </span>
          </div>
          <p className="text-[11px] text-text-secondary leading-tight">
            گروه‌های جانبی به صورت تصادفی قرار دارند؛ عدم توانایی بسته‌بندی بلوری منجر به ساختار
            کاملاً آمورف می‌شود.
          </p>
        </button>

        <button
          onClick={() => handleSetPreset('isotactic')}
          className={`p-3.5 rounded border text-right transition-all cursor-pointer ${
            mode === 'isotactic'
              ? 'bg-accent-secondary bg-teal-950/50 border-teal-500 text-teal-950 text-teal-100 shadow-xs'
              : 'bg-bg-base border-border-subtle text-text-secondary hover:border-teal-400'
          }`}
        >
          <div className="font-extrabold text-sm mb-1 flex-col sm:flex-row justify-between sm:items-center gap-1">
            <span>ایزوتاکتیک (Isotactic)</span>
            <span className="text-[10px] bg-accent-primary text-text-primary font-bold px-2 py-0.5 rounded self-start sm:self-auto">
              هم‌جهت
            </span>
          </div>
          <p className="text-[11px] text-text-secondary leading-tight">
            تمامی گروه‌های جانبی در یک سمت صفحه زنجیر اصلی متمرکز بوده و قابلیت تبلور مطلوب ایجاد
            می‌کنند.
          </p>
        </button>

        <button
          onClick={() => handleSetPreset('syndiotactic')}
          className={`p-3.5 rounded border text-right transition-all cursor-pointer ${
            mode === 'syndiotactic'
              ? 'bg-indigo-50 bg-indigo-950/50 border-indigo-500 text-indigo-950 text-indigo-100 shadow-xs'
              : 'bg-bg-base border-border-subtle text-text-secondary hover:border-indigo-400'
          }`}
        >
          <div className="font-extrabold text-sm mb-1 flex-col sm:flex-row justify-between sm:items-center gap-1">
            <span>سیندیوتاکتیک (Syndiotactic)</span>
            <span className="text-[10px] bg-accent-primary text-text-primary font-bold px-2 py-0.5 rounded self-start sm:self-auto">
              تناوب یکی‌درمیان
            </span>
          </div>
          <p className="text-[11px] text-text-secondary leading-tight">
            گروه‌های جانبی به صورت کاملاً متناوب در دو سمت صفحه جای می‌گیرند؛ منجر به سرعت تبلور
            بسیار بالا می‌شود.
          </p>
        </button>
      </div>

      {/* Interactive Polymer Chain Visualization */}
      <div className="bg-bg-base border border-border-subtle rounded p-4 mb-4 shadow-inner">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-text-secondary mb-2 gap-2">
          <span className="font-bold flex-wrap items-center gap-1.5 leading-tight">
            <span className="text-sm">آرایش فضایی زنجیر و گروه‌های جانبی R:</span>
            <span className="text-[11px] text-accent-secondary block">
              (روی گروه‌ها جهت جابه‌جایی کلیک کنید)
            </span>
          </span>
          <span className="en-mono text-accent-secondary font-extrabold self-end sm:self-auto text-xs sm:text-sm">
            {commercialName}
          </span>
        </div>

        {/* Interactive Chain SVG */}
        <div className="overflow-x-auto py-2 " dir="ltr">
          <svg
            className="w-full h-auto max-h-[160px]"
            viewBox={`0 ${isMobile ? 380 : 580} 160`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Main Carbon Backbone Line */}
            <line
              x1="20"
              y1="80"
              x2={isMobile ? 360 : 560}
              y2="80"
              stroke="var(--accent-primary)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Repeating Monomer Carbon Nodes */}
            {rings.slice(0, isMobile ? 5 : 8).map((direction, idx) => {
              const cx = 55 + idx * 70;
              const cy = 80;
              const ringY = direction === 1 ? 35 : 125;
              const lineY2 = direction === 1 ? 50 : 110;

              return (
                <g key={idx} onClick={() => toggleRing(idx)} className="cursor-pointer group">
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx}
                    y2={lineY2}
                    stroke={direction === 1 ? 'var(--accent-secondary)' : 'var(--status-warning)'}
                    strokeWidth="3"
                  />

                  {/* Carbon Backbone Node */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill="var(--bg-base)"
                    stroke="var(--accent-secondary)"
                    strokeWidth="2"
                  />

                  {/* Side group */}
                  <g transform={`translate(${cx}, ${ringY})`}>
                    <g
                      style={{ transformOrigin: '0px' }}
                      className="transition-transform duration-200 group-hover:scale-110"
                    >
                      {polymer.id.toLowerCase().includes('ps') ? (
                        <g transform="scale(0.85)">
                          <polygon
                            points="0,-16 14,-8 14,8 0,16 -14,8 -14,-8"
                            fill={
                              direction === 1 ? 'var(--accent-primary)' : 'var(--status-warning)'
                            }
                            stroke={
                              direction === 1 ? 'var(--accent-secondary)' : 'var(--status-warning)'
                            }
                            strokeWidth="2.5"
                          />
                          <circle
                            cx="0"
                            cy="0"
                            r="9"
                            fill="none"
                            stroke={
                              direction === 1 ? 'var(--accent-secondary)' : 'var(--status-warning)'
                            }
                            strokeWidth="2"
                            opacity="0.8"
                          />
                          <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fill="var(--bg-surface)"
                            fontSize="10"
                            fontWeight="bold"
                          >
                            R
                          </text>
                        </g>
                      ) : (
                        <g>
                          <rect
                            x="-14"
                            y="-12"
                            width="28"
                            height="24"
                            rx="4"
                            fill={
                              direction === 1 ? 'var(--accent-primary)' : 'var(--status-warning)'
                            }
                            stroke={
                              direction === 1 ? 'var(--accent-secondary)' : 'var(--status-warning)'
                            }
                            strokeWidth="2"
                          />
                          <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fill="var(--bg-surface)"
                            fontSize="9"
                            fontWeight="bold"
                          >
                            R
                          </text>
                        </g>
                      )}
                    </g>
                  </g>
                  <text
                    x={cx}
                    y={direction === 1 ? 14 : 152}
                    textAnchor="middle"
                    fill={direction === 1 ? 'var(--accent-secondary)' : 'var(--status-warning)'}
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {direction === 1 ? '▲ بالا' : '▼ پایین'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Dynamic Calculated Properties */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-text-secondary mb-1 flex items-center justify-between">
            <span>درصد بلورینگی</span>
            <InfoTooltip text="نظم فضایی گروه R موجب سهولت بسته‌بندی زنجیرها در شبکه کریستالی می‌شود." />
          </div>
          <div className="text-xs sm:text-sm font-bold text-accent-primary">{crystallinity}</div>
        </div>

        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-text-secondary mb-1 flex items-center justify-between">
            <span>دمای ذوب بلوری (Tm)</span>
            <InfoTooltip text="دمای ذوب فاز بلوری تابع ضخامت لاملاها و درجه نظم فضایی است." />
          </div>
          <div className="text-xs sm:text-sm font-bold text-status-success">{tmValue}</div>
        </div>

        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-text-secondary mb-1 flex items-center justify-between">
            <span>ظاهر نوری</span>
            <InfoTooltip text="حضور کریستالیت‌های بزرگتر از طول موج نور مرئی سبب پراکندگی نور و کدر شدن می‌شود." />
          </div>
          <div className="text-xs sm:text-sm font-bold text-accent-primary">{appearance}</div>
        </div>

        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl shadow-sm">
          <div className="text-[11px] font-bold text-text-secondary mb-1 flex items-center justify-between">
            <span>کاتالیزور / گرید</span>
            <InfoTooltip text="کاتالیزورهای متالوسنی تک‌مرکز کنترل بالاتری بر فضاشیمی ارائه می‌کنند." />
          </div>
          <div className="text-xs font-bold text-status-warning">{commercialName}</div>
        </div>
      </div>
    </div>
  );
};
