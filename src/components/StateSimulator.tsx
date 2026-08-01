import React, { useState } from 'react';
import { PolymerData } from '../types/polymer';
import type { SourcedValue as SourcedValueData } from '../types/polymer';
import { InfoTooltip } from './InfoTooltip';
import { SourcedValue } from './SourcedValue';

interface StateSimulatorProps {
  polymer: PolymerData;
}

export const StateSimulator: React.FC<StateSimulatorProps> = ({ polymer }) => {
  const formatVal = (v: SourcedValueData | string | number | null | undefined) => (
    <SourcedValue value={v} />
  );

  // Dynamically calculate temperature bounds based on polymer's thermal properties
  const tg = polymer.thermal.tgValue;
  const tm = polymer.thermal.tmValue;
  const td = polymer.thermal.degradationValue || 350;

  // Dynamic minimum and maximum temperature scale
  const minTemp = Math.min(-150, Math.floor(tg - 60));
  const maxTemp = Math.max(450, Math.ceil(td + 80));

  // Default initial temperature to room temperature or Tg + 30
  const [temp, setTemp] = useState<number>(25);

  // Fill percentage calculation
  const percentage = Math.min(100, Math.max(0, ((temp - minTemp) / (maxTemp - minTemp)) * 100));

  let stateTitle = '';
  let stateDesc = '';
  let color = 'var(--accent-secondary)';
  let badgeColor = 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/30';

  const isAmorphous = tm <= tg || tm === 0;

  if (temp < tg) {
    stateTitle = 'حالت شیشه‌ای و صلب (Glassy State)';
    stateDesc = `پلیمر پایین‌تر از دمای انتقال شیشه‌ای (Tg = ${`${polymer.thermal.tg.value} ${polymer.thermal.tg.unit}`}) قرار دارد. ارتعاشات حرارتی زنجیرها ناچیز بوده، بخش‌های آمورف منجمد شده و ماده رفتار صلب، سخت و شکننده نشان می‌دهد.`;
    color = 'var(--accent-secondary)'; // cold sky blue
    badgeColor = 'bg-sky-500/10 text-accent-secondary border-sky-500/30';
  } else if (!isAmorphous && temp >= tg && temp < tm) {
    stateTitle = 'حالت نیمه‌بلوری / لاستیکی (Semi-Crystalline / Rubbery State)';
    stateDesc = `زنجیرهای پلیمری در مناطق آمورف انرژی کافی برای چرخش بخش‌ها (Segmental Motion) به دست آورده‌اند، اما بلورها (با درصد بلورینگی ${`${polymer.academic.crystallinityRange.value} ${polymer.academic.crystallinityRange.unit}`}) پایداری مکانیکی ماده را حفظ کرده‌اند. این محدوده کاربری اصلی ${polymer.code} در صنایع مختلف است.`;
    color = 'var(--status-success)'; // vibrant emerald green
    badgeColor = 'bg-status-success/10 border-status-success/30';
  } else if (
    (isAmorphous && temp >= tg && temp < td) ||
    (!isAmorphous && temp >= tm && temp < td)
  ) {
    stateTitle = isAmorphous
      ? 'حالت لاستیکی / سیال ویسکوالاستیک (Viscoelastic Melt Flow State)'
      : 'حالت مذاب سیال (Melt / Viscous Flow State)';
    stateDesc = isAmorphous
      ? `نمونه بالاتر از دمای Tg (برابر با ${`${polymer.thermal.tg.value} ${polymer.thermal.tg.unit}`}) قرار دارد. به دلیل آمورف بودن کامل (${polymer.code})، فاز ذوب بلوری وجود ندارد و ماده از فاز شیشه‌ای وارد جریان ویسکوالاستیک جهت فرآیندپذیری می‌شود.`
      : `دمای نمونه از نقطه ذوب بلوری (Tm = ${`${polymer.thermal.tm.value} ${polymer.thermal.tm.unit}`}) عبور کرده است. کریستال‌ها کاملاً باز شده و سیال ویسکوالاستیک تشکیل داده‌اند که آماده فرآیندهای شکل‌دهی اکستروژن، قالب‌گیری تزریقی و دمشی است.`;
    color = 'var(--status-warning)'; // amber melt
    badgeColor = 'bg-status-warning/10 border-status-warning/30';
  } else {
    stateTitle = 'تخریب حرارتی و شکست پیوندها (Thermal Degradation)';
    stateDesc = `دما از آستانه تخریب حرارتی (Td = ${`${polymer.thermal.degradationTemp.value} ${polymer.thermal.degradationTemp.unit}`}) فراتر رفته است! انرژی گرمایی از انرژی پیوندهای سیگما (C-C و C-H) فراتر رفته، زنجیرها دچار شکستگی (Scission)، دپلیمریزاسیون و سقوط شدید وزن مولکولی می‌شوند.`;
    color = 'var(--status-error)'; // red danger
    badgeColor = 'bg-status-error/10 border-status-error/30';
  }

  // Calculate position percentages for Tg, Tm, Td markers on slider
  const tgPos = Math.min(100, Math.max(0, ((tg - minTemp) / (maxTemp - minTemp)) * 100));
  const tmPos = Math.min(100, Math.max(0, ((tm - minTemp) / (maxTemp - minTemp)) * 100));
  const tdPos = Math.min(100, Math.max(0, ((td - minTemp) / (maxTemp - minTemp)) * 100));

  return (
    <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle rounded-lg p-5 my-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-3 border-b border-border-subtle">
        <h3 className="text-xl font-bold flex items-center gap-2 text-text-primary">
          <span>نمودار دینامیکی حالت فیزیکی در برابر دما (State Simulator)</span>
        </h3>
        <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-bg-base text-text-secondary border border-border-subtle">
          <span>بازه پویا:</span>
          <span className="en-mono font-mono" dir="ltr">
            {minTemp}°C ... {maxTemp}°C
          </span>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-text-secondary mb-6 leading-relaxed">
        با حرکت دادن لغزنده، دمای نمونه را از زیر انتقال شیشه‌ای تا تخریب حرارتی تغییر دهید. بازه
        دما به صورت خودکار بر اساس آستانه حرارتی {polymer.code} تنظیم شده است:
      </p>

      <div className="flex flex-col md:flex-row items-stretch gap-6">
        {/* Thermometer Tube Graphic */}
        <div className="flex flex-col items-center justify-center gap-3 bg-bg-base border border-border-subtle p-5 rounded-xl w-full md:w-32 flex-shrink-0 shadow-sm">
          <div className="text-[11px] font-bold text-text-secondary en-mono">{maxTemp}°C</div>

          <div className="w-8 h-48 bg-border-subtle rounded-full relative overflow-hidden border-2 border-bg-surface shadow-inner">
            <div
              className="w-full absolute bottom-0 transition-all duration-200 ease-out rounded-b-full"
              style={{ height: `${percentage}%`, backgroundColor: color }}
            />
          </div>

          <div className="text-[11px] font-bold text-text-secondary en-mono">{minTemp}°C</div>
        </div>

        {/* Controls & State Explanations */}
        <div className="flex-1 w-full space-y-5">
          {/* Slider input & markers */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span className="flex items-center gap-1">
                  تنظیم دمای نمونه:{' '}
                  <InfoTooltip text="با تغییر دمای نمونه، می‌توانید تغییر فازها (شیشه‌ای، لاستیکی، مذاب) و رفتار ماکرومولکولی پلیمر را بر اساس دماهای انتقال شیشه‌ای (Tg) و ذوب (Tm) مشاهده کنید." />
                </span>
                <span
                  className="en-mono text-base sm:text-xl font-extrabold px-3 py-0.5 rounded-lg border shadow-xs transition-colors"
                  style={{ color, borderColor: color }}
                >
                  {temp} °C
                </span>
              </label>
              <button
                onClick={() => setTemp(25)}
                className="text-xs text-accent-secondary hover:underline font-semibold cursor-pointer"
              >
                بازنشانی به دمای محیط (25°C)
              </button>
            </div>

            <div dir="ltr" className="relative pt-2 pb-8">
              <input
                type="range"
                min={minTemp}
                max={maxTemp}
                step="2"
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
                className="w-full relative z-10"
              />

              {/* Phase transition tick marks */}
              <div className="relative w-full h-5 mt-2 text-[10px] en-mono font-bold text-text-secondary">
                <span
                  className="absolute -translate-x-1/2 flex-col items-center cursor-pointer hover:text-sky-500 transition-colors"
                  style={{ left: `${tgPos}%` }}
                  onClick={() => setTemp(tg)}
                  title={`Tg = ${tg}°C`}
                >
                  <span className="w-1.5 h-2.5 bg-accent-secondary rounded-full mb-0.5" />
                  <span className="whitespace-nowrap font-extrabold text-accent-secondary">
                    Tg ({tg}°C)
                  </span>
                </span>

                {!isAmorphous && (
                  <span
                    className="absolute -translate-x-1/2 flex-col items-center cursor-pointer hover:text-status-success transition-colors"
                    style={{ left: `${tmPos}%` }}
                    onClick={() => setTemp(tm)}
                    title={`Tm = ${tm}°C`}
                  >
                    <span className="w-1.5 h-2.5 bg-status-success rounded-full mb-0.5" />
                    <span className="whitespace-nowrap font-extrabold text-status-success">
                      Tm ({tm}°C)
                    </span>
                  </span>
                )}

                <span
                  className="absolute -translate-x-1/2 flex-col items-center cursor-pointer hover:text-status-error transition-colors"
                  style={{ left: `${tdPos}%` }}
                  onClick={() => setTemp(td)}
                  title={`Td = ${td}°C`}
                >
                  <span className="w-1.5 h-2.5 bg-status-error rounded-full mb-0.5" />
                  <span className="whitespace-nowrap font-extrabold text-status-error">
                    Td ({td}°C)
                  </span>
                </span>
              </div>
            </div>
          </div>
          {/* Key Thermal Thresholds Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setTemp(tg - 20)}
              className="p-3.5 rounded-xl border border-border-subtle bg-bg-surface/70 backdrop-blur-md shadow-sm hover:border-accent-secondary hover:shadow-md transition-all text-right cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-text-secondary mb-1">
                انتقال شیشه‌ای (Tg)
              </div>
              <div className="en-mono font-black text-sm text-accent-secondary group-hover:scale-105 transition-transform">
                {formatVal(polymer.thermal.tg)}
              </div>
            </button>

            <button
              onClick={() => setTemp(tm + 10)}
              className="p-3.5 rounded-xl border border-border-subtle bg-bg-surface/70 backdrop-blur-md shadow-sm hover:border-accent-primary hover:shadow-md transition-all text-right cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-text-secondary mb-1">
                نقطه ذوب بلوری (Tm)
              </div>
              <div className="en-mono font-black text-sm text-status-success group-hover:scale-105 transition-transform">
                {formatVal(polymer.thermal.tm)}
              </div>
            </button>

            <button
              onClick={() => setTemp(td + 20)}
              className="p-3.5 rounded-xl border border-border-subtle bg-bg-surface/70 backdrop-blur-md shadow-sm hover:border-accent-primary hover:shadow-md transition-all text-right cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-text-secondary mb-1">
                تخریب حرارتی (Td)
              </div>
              <div className="en-mono font-black text-sm text-status-error group-hover:scale-105 transition-transform">
                {formatVal(polymer.thermal.degradationTemp)}
              </div>
            </button>
          </div>

          {/* Active Phase Box */}
          <div className={`p-5 rounded-xl border ${badgeColor} shadow-sm transition-all mt-4`}>
            <div className="text-xs font-extrabold uppercase tracking-wider mb-1 opacity-80">
              فاز و وضعیت فیزیکی ماده:
            </div>
            <div className="font-extrabold text-base sm:text-lg mb-2" style={{ color }}>
              {stateTitle}
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-text-primary font-medium">
              {stateDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
