import React, { useState } from 'react';
import { PolymerData } from '../types/polymer';
import { Settings, FileText, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface ProcessingWindowSimulatorProps {
  polymer: PolymerData;
}

interface StandardSpec {
  id: string;
  nameFa: string;
  code: string;
  description: string;
  meltTempRange: [number, number]; // [min, max] °C
  moldTempRange: [number, number]; // [min, max] °C
  pressureRange: [number, number]; // [min, max] bar
  dryingReq: string;
}

export const ProcessingWindowSimulator: React.FC<ProcessingWindowSimulatorProps> = ({
  polymer,
}) => {
  // Define standard benchmarks based on international ISO/ASTM standards & CAMPUS plastics database
  const standards: StandardSpec[] = [
    {
      id: 'iso294',
      nameFa: 'تزریق پلاستیک قطعات آزمایشی (ISO 294-1)',
      code: 'ISO 294-1 / ISO 3167',
      description:
        'استاندارد مرجع بین‌المللی برای آماده‌سازی نمونه‌های آزمایشی کشش و ضربه تحت شرایط کنترل‌شده.',
      meltTempRange:
        polymer.id === 'ldpe'
          ? [180, 230]
          : polymer.id === 'hdpe'
            ? [200, 260]
            : polymer.id === 'pp'
              ? [200, 270]
              : polymer.id === 'ps'
                ? [180, 250]
                : polymer.id === 'abs'
                  ? [220, 260]
                  : polymer.id === 'pvc'
                    ? [170, 205]
                    : [220, 280],
      moldTempRange:
        polymer.id === 'ldpe'
          ? [20, 50]
          : polymer.id === 'hdpe'
            ? [30, 70]
            : polymer.id === 'pp'
              ? [20, 60]
              : polymer.id === 'ps'
                ? [20, 60]
                : polymer.id === 'abs'
                  ? [40, 80]
                  : polymer.id === 'pvc'
                    ? [20, 50]
                    : [50, 90],
      pressureRange: [600, 1200],
      dryingReq:
        polymer.id === 'abs'
          ? '80°C برای 2 تا 4 ساعت'
          : 'نیازی به رطوبت‌زدایی شدید ندارد (کمتر از 0.1٪)',
    },
    {
      id: 'iso2045',
      nameFa: 'اکستروژن فیلم و لوله (ISO 2045 / ASTM D1238)',
      code: 'ISO 2045 / ASTM D1238',
      description:
        'استاندارد فرآیندپذیری در مادی‌های اکسترودری پپ، پلی‌اتیلن و پی‌وی‌سی بر اساس شاخص MFI.',
      meltTempRange:
        polymer.id === 'ldpe'
          ? [160, 210]
          : polymer.id === 'hdpe'
            ? [180, 230]
            : polymer.id === 'pp'
              ? [190, 240]
              : polymer.id === 'ps'
                ? [170, 220]
                : polymer.id === 'abs'
                  ? [200, 240]
                  : polymer.id === 'pvc'
                    ? [160, 190]
                    : [200, 250],
      moldTempRange: [15, 40],
      pressureRange: [150, 450],
      dryingReq: 'کنترل رطوبت ورودی خوراک کمتر از 0.05٪ mass fraction',
    },
    {
      id: 'campus',
      nameFa: 'پایگاه داده مهندسی مواد پلیمری CAMPUS',
      code: 'CAMPUS Plastics DB / ISO 10350',
      description: 'داده‌های مرجع واحدهای پتروشیمی جهانی شامل BASF، Sabic، Covestro و Borealis.',
      meltTempRange:
        polymer.id === 'ldpe'
          ? [170, 220]
          : polymer.id === 'hdpe'
            ? [190, 250]
            : polymer.id === 'pp'
              ? [210, 260]
              : polymer.id === 'ps'
                ? [190, 240]
                : polymer.id === 'abs'
                  ? [210, 270]
                  : polymer.id === 'pvc'
                    ? [165, 195]
                    : [210, 275],
      moldTempRange:
        polymer.id === 'ldpe'
          ? [25, 45]
          : polymer.id === 'hdpe'
            ? [35, 65]
            : polymer.id === 'pp'
              ? [25, 55]
              : polymer.id === 'ps'
                ? [30, 60]
                : polymer.id === 'abs'
                  ? [45, 75]
                  : polymer.id === 'pvc'
                    ? [25, 45]
                    : [40, 80],
      pressureRange: [500, 1100],
      dryingReq:
        polymer.id === 'abs'
          ? '80-85°C در رطوبت‌گیر دهیدراته'
          : 'خشک‌سازی اولیه در صورت نگهداری در انبار مرطوب',
    },
  ];

  const [selectedStdId, setSelectedStdId] = useState<string>('iso294');
  const activeStd = standards.find((s) => s.id === selectedStdId) || standards[0];

  // Midpoint initial values
  const [meltTemp, setMeltTemp] = useState<number>(
    Math.round((activeStd.meltTempRange[0] + activeStd.meltTempRange[1]) / 2),
  );
  const [moldTemp, setMoldTemp] = useState<number>(
    Math.round((activeStd.moldTempRange[0] + activeStd.moldTempRange[1]) / 2),
  );
  const [pressure, setPressure] = useState<number>(
    Math.round((activeStd.pressureRange[0] + activeStd.pressureRange[1]) / 2),
  );

  // Determine status & defects
  const isMeltTooLow = meltTemp < activeStd.meltTempRange[0];
  const isMeltTooHigh = meltTemp > activeStd.meltTempRange[1];
  const isMoldTooLow = moldTemp < activeStd.moldTempRange[0];
  const isMoldTooHigh = moldTemp > activeStd.moldTempRange[1];
  const isPressureTooLow = pressure < activeStd.pressureRange[0];
  const isPressureTooHigh = pressure > activeStd.pressureRange[1];

  let statusMessage = 'پنجره فرآیند مطلوب (Optimal Processing Window)';
  let statusColor = 'emerald';
  const defects: string[] = [];

  if (isMeltTooLow) {
    defects.push('خطر ذوب ناقص و حضور گلهای ذوب‌نشده (Unmelted Gels)');
    defects.push('افزایش شدید گرانروی و فشار پشت نازل (High Injection Pressure drop)');
  }
  if (isMeltTooHigh) {
    defects.push(
      'تخریب حرارتی زنجیرها و ایجاد گاز/تغییر رنگ (Thermal Degradation / Discoloration)',
    );
    defects.push('افزایش زمان خنک‌کاری و سیکل تولید (Longer Cycle Time)');
  }
  if (isMoldTooLow) {
    defects.push(
      'ایجاد تنش‌های پسماند شدید و خطوط جوش ضعیف (High Residual Stresses / Weak Weld Lines)',
    );
    defects.push('کاهش درصد بلورینگی و افت خواص مکانیکی نهایی');
  }
  if (isMoldTooHigh) {
    defects.push('خطر انقباض ناهمگن و تاب‌دیدگی قطعه (Excessive Warpage & Shrinkage)');
    defects.push('چسبندگی قطعه به قالب و سختی در پران (Ejection Difficulty)');
  }
  if (isPressureTooLow) {
    defects.push(
      'فشار ناکافی منجر به پرشدگی ناقص قالب (Short Shot) و مکش سطحی (Sink Marks) می‌شود.',
    );
  }
  if (isPressureTooHigh) {
    defects.push(
      'فشار بیش از حد، خطر پلیسه شدن (Flash)، تنش پسماند و قفل شدن قالب را افزایش می‌دهد.',
    );
  }

  if (defects.length > 0) {
    statusColor = isMeltTooHigh || defects.length >= 3 ? 'rose' : 'amber';
    statusMessage = 'خارج از محدوده استاندارد (Risk of Quality Defect)';
  }

  return (
    <div className="bg-bg-surface/90 border border-border-subtle rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-text-primary">
            <Settings className="w-5 h-5 text-text-secondary" />
            <span>شبیه‌ساز پنجره فرآیند شکل‌دهی (Processing Window Simulator)</span>
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            مستند به استانداردهای بین‌المللی ISO و پایگاه داده‌های معتبر مهندسی پلیمر
          </p>
        </div>

        {/* Standard Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-text-secondary whitespace-nowrap">
            مرجع استاندارد:
          </label>
          <select
            value={selectedStdId}
            onChange={(e) => {
              setSelectedStdId(e.target.value);
              const newStd = standards.find((s) => s.id === e.target.value) || standards[0];
              setMeltTemp(Math.round((newStd.meltTempRange[0] + newStd.meltTempRange[1]) / 2));
              setMoldTemp(Math.round((newStd.moldTempRange[0] + newStd.moldTempRange[1]) / 2));
              setPressure(Math.round((newStd.pressureRange[0] + newStd.pressureRange[1]) / 2));
            }}
            className="w-full sm:w-auto bg-bg-base border border-border-subtle text-xs font-bold text-text-primary px-3 py-1.5 rounded-xl outline-none focus:border-blue-600 cursor-pointer"
          >
            {standards.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameFa}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Standard Info Banner */}
      <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl text-xs text-text-primary mb-5 flex items-start gap-2.5 shadow-sm">
        <FileText className="w-4 h-4 text-text-secondary" />
        <div>
          <span className="font-extrabold text-accent-primary en-mono ml-1">
            [{activeStd.code}]
          </span>
          <span>{activeStd.description}</span>
          <div className="mt-1 font-semibold text-text-secondary">
            شرایط رطوبت‌زدایی پیش‌فرض:{' '}
            <span className="font-bold text-text-primary">{activeStd.dryingReq}</span>
          </div>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Melt Temperature Slider */}
        <div className="bg-bg-surface/60 border border-border-subtle p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-text-secondary flex items-center gap-1">
              دمای مذاب (Melt Temp):{' '}
              <InfoTooltip text="دمای مذاب (Melt Temperature) دمای پلیمر در حالت مذاب درون سیلندر تزریق است. این دما باید به اندازه کافی بالا باشد تا گرانروی کاهش یابد، اما نه آنقدر بالا که باعث تخریب حرارتی (Degradation) پلیمر شود." />
            </span>
            <span className="en-mono font-black text-status-warning text-sm">{meltTemp}°C</span>
          </div>
          <input
            type="range"
            min={activeStd.meltTempRange[0] - 40}
            max={activeStd.meltTempRange[1] + 40}
            value={meltTemp}
            onChange={(e) => setMeltTemp(Number(e.target.value))}
            className="w-full relative z-10 my-1"
            style={{ '--slider-color': 'var(--accent-tertiary)' } as React.CSSProperties}
          />
          <div
            className="flex justify-between text-[10px] font-bold text-text-secondary mt-1"
            dir="ltr"
          >
            <span>Min: {activeStd.meltTempRange[0]}°C</span>
            <span>Max: {activeStd.meltTempRange[1]}°C</span>
          </div>
        </div>

        {/* Mold Temperature Slider */}
        <div className="bg-bg-surface/60 border border-border-subtle p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-text-secondary flex items-center gap-1">
              دمای قالب (Mold Temp):{' '}
              <InfoTooltip text="دمای قالب (Mold Temperature) به دمای سطوح داخلی قالب در دستگاه تزریق پلاستیک گفته می‌شود. تنظیم صحیح این دما برای کنترل سرعت سرد شدن، درصد بلورینگی و جلوگیری از اعوجاج قطعه بسیار حیاتی است." />
            </span>
            <span className="en-mono font-black text-status-success text-sm">{moldTemp}°C</span>
          </div>
          <input
            type="range"
            min={Math.max(10, activeStd.moldTempRange[0] - 20)}
            max={activeStd.moldTempRange[1] + 30}
            value={moldTemp}
            onChange={(e) => setMoldTemp(Number(e.target.value))}
            className="w-full relative z-10 my-1"
            style={{ '--slider-color': 'var(--accent-tertiary)' } as React.CSSProperties}
          />
          <div
            className="flex justify-between text-[10px] font-bold text-text-secondary mt-1"
            dir="ltr"
          >
            <span>Min: {activeStd.moldTempRange[0]}°C</span>
            <span>Max: {activeStd.moldTempRange[1]}°C</span>
          </div>
        </div>

        {/* Injection Pressure Slider */}
        <div className="bg-bg-surface/60 border border-border-subtle p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-text-secondary">فشار تزریق/اکستروژن:</span>
            <span className="en-mono font-black text-accent-tertiary text-sm">{pressure} bar</span>
          </div>
          <input
            type="range"
            min={activeStd.pressureRange[0] - 200}
            max={activeStd.pressureRange[1] + 300}
            value={pressure}
            onChange={(e) => setPressure(Number(e.target.value))}
            className="w-full relative z-10 my-1"
            style={{ '--slider-color': 'var(--accent-tertiary)' } as React.CSSProperties}
          />
          <div
            className="flex justify-between text-[10px] font-bold text-text-secondary mt-1"
            dir="ltr"
          >
            <span>Min: {activeStd.pressureRange[0]} bar</span>
            <span>Max: {activeStd.pressureRange[1]} bar</span>
          </div>
        </div>
      </div>

      {/* Live Status & Defect Diagnosis Card */}
      <div
        className={`border p-4 rounded-xl transition-all ${
          statusColor === 'emerald'
            ? 'bg-status-success/10 border-status-success/30'
            : statusColor === 'amber'
              ? 'bg-status-warning/10 border-status-warning/30'
              : 'bg-status-error/10 border-status-error/30'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {statusColor === 'emerald' ? (
                <CheckCircle className="w-4 h-4 text-status-success" />
              ) : statusColor === 'amber' ? (
                <AlertTriangle className="w-4 h-4 text-status-warning" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-status-error" />
              )}
            </span>
            <span
              className={`text-sm font-extrabold ${
                statusColor === 'emerald'
                  ? 'text-status-success'
                  : statusColor === 'amber'
                    ? 'text-status-warning'
                    : 'text-status-error'
              }`}
            >
              وضعیت فرآیند: {statusMessage}
            </span>
          </div>
          <span className="text-xs en-mono font-bold opacity-80">Standard Check</span>
        </div>

        {defects.length === 0 ? (
          <p className="text-xs text-status-success leading-relaxed font-semibold">
            تنظیمات پارامترهای دمایی و فشاری دقیقاً در مرکز پنجره شکل‌دهی استاندارد قرار دارد. قطعه
            تزریقی/اکسترودی دارای انقباض یکنواخت، حداقل تنش پسماند و ساختار بلورینگی ایده‌آل خواهد
            بود.
          </p>
        ) : (
          <div className="space-y-1 mt-2">
            <div className="text-xs font-bold text-text-primary">
              عیوب عینی پیش‌بینی‌شده در قطعه:
            </div>
            <ul className="list-disc list-inside text-xs text-text-secondary space-y-1">
              {defects.map((d, idx) => (
                <li key={idx} className="leading-relaxed">
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
