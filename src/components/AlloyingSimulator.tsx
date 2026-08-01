import React, { useState } from 'react';
import { InfoTooltip } from './InfoTooltip';
import { PolymerData } from '../types/polymer';
import { FlaskConical, Target } from 'lucide-react';

interface AlloyingSimulatorProps {
  polymer: PolymerData;
}

export const AlloyingSimulator: React.FC<AlloyingSimulatorProps> = ({ polymer }) => {
  // Alloy blend type - must be called unconditionally, before any early return
  const [blendRatio, setBlendRatio] = useState<number>(35); // % of second component

  // Only display for suitable polymer grades (primarily ABS or PP)
  const isABS = polymer.id === 'abs';
  const isPP = polymer.id === 'pp';

  if (!isABS && !isPP) return null;

  // Compute empirical mechanical properties based on empirical data from CAMPUS / Sabic / Covestro datasheets (ISO 11469)
  let alloyName = '';
  let secondComponent = '';
  let standardRef = '';
  let tensileStrength = 0;
  let impactStrength = 0;
  let hdt = 0;
  let mfi = 0;
  let applicationTarget = '';

  if (isABS) {
    alloyName = `آلیاژ مهندسی PC/ABS (${100 - blendRatio}% ABS + ${blendRatio}% PC)`;
    secondComponent = 'پلی‌کربنات (PC)';
    standardRef = 'ISO 11469 / ASTM D6762 / ISO 2580';
    // Empirical non-linear rule of mixtures with synergistic impact factor
    const pcFraction = blendRatio / 100;
    tensileStrength = Math.round(42 + 28 * pcFraction); // 42 -> 70 MPa
    // Synergistic impact peak around 40-60% PC
    const synergy = Math.sin(pcFraction * Math.PI) * 180;
    impactStrength = Math.round(180 + 320 * pcFraction + synergy); // J/m
    hdt = Math.round(85 + 42 * pcFraction); // °C
    mfi = Number((22 - 14 * pcFraction).toFixed(1)); // g/10min

    if (blendRatio < 20) {
      applicationTarget = 'قطعات داخلی خودرو و لوازم خانگی با بهبود جزئی ضربه‌پذیری';
    } else if (blendRatio <= 50) {
      applicationTarget =
        'کنسول خودرو، بدنه لپ‌تاپ، تجهیزات پزشکی و قاب مانیتور (تعادل عالی فرآیندپذیری و مقاومت حرارتی)';
    } else {
      applicationTarget =
        'سپر خودرو، قطعات مقاوم در برابر ضربات شدید و محفظه‌های الکترونیکی صنعتی با HDT بالا';
    }
  } else {
    // PP + EPDM / Glass Fiber Alloy
    alloyName = `آلیاژ و کامپوند مهندسی PP/EPDM (${100 - blendRatio}% PP + ${blendRatio}% EPDM/کلسیم کربنات)`;
    secondComponent = 'الاستومر EPDM / اصلاح‌کننده ضربه';
    standardRef = 'ISO 178 / ISO 180 / ASTM D790';
    const epdmFraction = blendRatio / 100;
    tensileStrength = Math.round(34 - 12 * epdmFraction);
    impactStrength = Math.round(40 + 360 * epdmFraction);
    hdt = Math.round(105 - 25 * epdmFraction);
    mfi = Number((12 - 7 * epdmFraction).toFixed(1));

    if (blendRatio < 15) {
      applicationTarget =
        'قطعات تزریقی عمومی، صندلی و ظروف نگهداری با انعطاف‌پذیری بهبودیافته در سرمای منفی';
    } else {
      applicationTarget =
        'سپر خودرو، روکش درهای داخلی خودرو و قطعات مقاوم در برابر ضربات برودتی (سرمای منفی ۲۰ درجه)';
    }
  }

  return (
    <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle rounded-lg p-5 my-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-accent-secondary/10 border border-accent-secondary/30 text-accent-secondary px-3 py-1 rounded-full text-[11px] font-bold mb-3">
            <FlaskConical className="w-5 h-5 text-accent-primary" />
            <span>شبیه‌ساز تخصصی آلیاژسازی و اصلاح خواص پلیمری (Polymer Blending)</span>
          </div>
          <h3 className="text-xl font-black text-text-primary flex items-center gap-2">
            <span>{alloyName}</span>
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            مبتنی بر داده‌های تجربی استاندارد{' '}
            <span className="en-mono text-status-success font-bold">{standardRef}</span>
          </p>
        </div>
      </div>

      {/* Blend Ratio Slider */}
      <div className="bg-bg-surface/80 border border-border-subtle p-5 rounded-xl mb-6">
        <div className="flex justify-between items-center text-xs font-bold mb-2">
          <span className="text-text-secondary">درصد وزنی افزودنی دوم ({secondComponent}):</span>
          <span className="en-mono font-black text-status-success text-base">{blendRatio}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={75}
          step={5}
          value={blendRatio}
          onChange={(e) => setBlendRatio(Number(e.target.value))}
          className="w-full relative z-10 my-3"
          style={{ '--slider-color': 'var(--status-success)' } as React.CSSProperties}
        />
        <div
          className="flex justify-between text-[11px] font-bold text-text-secondary mt-1.5"
          dir="ltr"
        >
          <span>0% (خالص {polymer.code})</span>
          <span>25%</span>
          <span>50%</span>
          <span>75% ({secondComponent} بالا)</span>
        </div>
      </div>

      {/* Empirical Predicted Properties Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl text-center shadow-sm">
          <div className="text-[11px] font-bold text-text-secondary mb-1">
            استحکام کششی (Tensile)
          </div>
          <div className="en-mono font-black text-lg text-accent-secondary">
            {tensileStrength} MPa
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">ISO 527</div>
        </div>

        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl text-center shadow-sm">
          <div className="text-[11px] font-bold text-text-secondary mb-1">مقاومت ضربه‌ای ایزود</div>
          <div className="en-mono font-black text-lg text-status-success">{impactStrength} J/m</div>
          <div className="text-[10px] text-text-secondary mt-0.5">ISO 180 / Izod</div>
        </div>

        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl text-center shadow-sm">
          <div className="text-[11px] font-bold text-text-secondary mb-1">دمای HDT (حرارتی)</div>
          <div className="en-mono font-black text-lg text-status-warning">{hdt} °C</div>
          <div className="text-[10px] text-text-secondary mt-0.5">ISO 75 (1.8 MPa)</div>
        </div>

        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3.5 rounded-xl text-center shadow-sm">
          <div className="text-[11px] font-bold text-text-secondary mb-1">شاخص جریان (MFI)</div>
          <div className="en-mono font-black text-lg text-accent-primary">{mfi} g/10min</div>
          <div className="text-[10px] text-text-secondary mt-0.5">ISO 1133</div>
        </div>
      </div>

      {/* Industrial Application Target */}
      <div className="bg-status-success/10 border border-status-success/30 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
        <Target className="w-5 h-5 text-status-success mt-0.5" />
        <div className="flex-1">
          <div className="font-bold text-status-success mb-1">
            کاربردهای صنعتی ویژه (Alloy Application):
          </div>
          <p className="text-text-primary leading-relaxed text-xs">{applicationTarget}</p>
        </div>
      </div>
    </div>
  );
};
