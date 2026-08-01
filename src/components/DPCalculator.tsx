import React, { useState } from 'react';
import { PolymerData } from '../types/polymer';
import type { SourcedValue as SourcedValueData } from '../types/polymer';
import { Calculator } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { SourcedValue } from './SourcedValue';

interface DPCalculatorProps {
  polymer: PolymerData;
}

export const DPCalculator: React.FC<DPCalculatorProps> = ({ polymer }) => {
  const formatVal = (v: SourcedValueData | string | number | null | undefined) => (
    <SourcedValue value={v} />
  );

  const [mnInput, setMnInput] = useState<number>(polymer.academic.mnDefaultValue);
  const [pdiInput, setPdiInput] = useState<number>(2.0);

  const m0 = polymer.academic.monomerMolarMass;
  const dpN = mnInput > 0 ? Math.round(mnInput / m0) : 0;
  const mwCalc = mnInput > 0 ? Math.round(mnInput * pdiInput) : 0;
  const dpW = mwCalc > 0 ? Math.round(mwCalc / m0) : 0;

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 my-6 shadow-xs">
      <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-2">
        <Calculator className="w-5 h-5 text-accent-primary" />
        <span>
          محاسبه‌گر درجه پلیمریزاسیون و توزیع وزن مولکولی (DP<sub>n</sub>, DP<sub>w</sub> & PDI)
        </span>
        <InfoTooltip text="درجه پلیمریزاسیون میانگین عددی (DPn) تعداد متوسط واحدهای مونومری متصل به یکدیگر در زنجیر را سنجش می‌کند." />
      </h3>
      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
        کمیت{' '}
        <span className="en-mono font-bold text-accent-secondary font-mono tabular-nums">
          DP<sub>n</sub>
        </span>{' '}
        نشان‌دهنده <strong>میانگین عددی درجه پلیمریزاسیون</strong> است. برای توصیف کامل خواص
        فیزیکی-مکانیکی و رفتار ویسکوئلاستیک مذاب، تمایز آن با میانگین وزنی (
        <span className="en-mono font-bold font-mono">
          DP<sub>w</sub>
        </span>
        ) و شاخص چندپخشی (
        <span className="en-mono font-bold font-mono">
          PDI = M<sub>w</sub>/M<sub>n</sub>
        </span>
        ) ضروری است:
      </p>

      {/* Standard Clean Mathematical Formula */}
      <div className="bg-bg-base border border-border-subtle p-4 rounded-md text-center my-4">
        <div
          className="inline-flex items-center justify-center gap-6 text-text-primary en-mono font-mono font-bold text-base sm:text-lg select-none flex-wrap"
          dir="ltr"
        >
          {/* DPn Formula */}
          <div className="flex items-center gap-2">
            <span className="text-accent-primary">
              DP<sub className="text-xs">n</sub>
            </span>
            <span className="text-text-secondary font-normal">=</span>
            <span className="inline-flex-col items-center justify-center text-center align-middle">
              <span className="border-b-2 border border-border-subtle px-2 pb-0.5 text-accent-primary font-black leading-none">
                M<sub className="text-xs font-bold">n</sub>
              </span>
              <span className="px-2 pt-1 text-status-success font-black leading-none">
                M<sub className="text-xs font-bold">0</sub>
              </span>
            </span>
          </div>

          <span className="text-text-secondary">|</span>

          {/* DPw Formula */}
          <div className="flex items-center gap-2">
            <span className="text-status-warning">
              DP<sub className="text-xs">w</sub>
            </span>
            <span className="text-text-secondary font-normal">=</span>
            <span className="inline-flex-col items-center justify-center text-center align-middle">
              <span className="border-b-2 border border-border-subtle px-2 pb-0.5 text-status-warning font-black leading-none">
                M<sub className="text-xs font-bold">w</sub>
              </span>
              <span className="px-2 pt-1 text-status-success font-black leading-none">
                M<sub className="text-xs font-bold">0</sub>
              </span>
            </span>
          </div>

          <span className="text-text-secondary">|</span>

          {/* PDI Formula */}
          <div className="flex items-center gap-2">
            <span className="text-accent-tertiary">PDI</span>
            <span className="text-text-secondary font-normal">=</span>
            <span className="inline-flex-col items-center justify-center text-center align-middle">
              <span className="border-b border border-border-subtle px-2 pb-0.5 text-status-warning font-bold leading-none">
                M<sub className="text-xs">w</sub>
              </span>
              <span className="px-2 pt-0.5 text-accent-primary font-bold leading-none">
                M<sub className="text-xs">n</sub>
              </span>
            </span>
          </div>
        </div>

        <div className="text-xs text-text-secondary mt-3 font-medium flex items-center justify-center gap-2 flex-wrap">
          <span>
            جرم مولی واحد تکرارشونده (
            <span className="en-mono font-bold font-mono">
              {formatVal(polymer.academic.monomerName)}
            </span>
            ):
          </span>
          <span className="en-mono font-bold font-mono tabular-nums text-status-success">
            M<sub>0</sub> = {m0} g/mol
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-xs font-bold text-text-secondary mb-1.5 flex items-center gap-1.5">
            <span>
              وزن مولکولی عددی میانگین (M<sub>n</sub> بر حسب g/mol):
            </span>
            <InfoTooltip text="M_n بیانگر میانگین عددی وزن زنجیرها است و نسبت مستقیمی با تعداد مول‌های آمیزه پلیمری دارد." />
          </label>
          <input
            type="number"
            value={mnInput}
            onChange={(e) => setMnInput(Number(e.target.value))}
            placeholder={`مثال: ${formatVal(polymer.academic.mnDefaultValue)}`}
            className="w-full bg-bg-base border border-border-subtle text-text-primary px-3 py-2 rounded-md en-mono font-mono tabular-nums font-bold focus:border-teal-600 outline-none transition-all text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-secondary mb-1.5 flex items-center gap-1.5">
            <span>شاخص چندپخشی (Polydispersity Index - PDI):</span>
            <InfoTooltip text="شاخص PDI = Mw/Mn پهنای توزیع وزن مولکولی را مشخص می‌سازد. در پلیمریزاسیون رادیکالی معمولاً PDI بین 2.0 تا 5.0 است." />
          </label>
          <input
            type="number"
            step="0.1"
            min="1.0"
            max="20.0"
            value={pdiInput}
            onChange={(e) => setPdiInput(Number(e.target.value))}
            className="w-full bg-bg-base border border-border-subtle text-text-primary px-3 py-2 rounded-md en-mono font-mono tabular-nums font-bold focus:border-teal-600 outline-none transition-all text-xs"
          />
        </div>
      </div>

      {/* Output Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3 rounded-xl shadow-sm text-center">
          <div className="text-xs font-bold text-text-secondary flex items-center justify-center gap-1">
            <span>
              درجه پلیمریزاسیون عددی (DP<sub>n</sub>)
            </span>
            <InfoTooltip text="DP_n = M_n / M_0" />
          </div>
          <div className="en-mono font-mono tabular-nums text-lg font-black text-status-success mt-1">
            DP<sub>n</sub> ≈ {dpN.toLocaleString()}
          </div>
        </div>

        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3 rounded-xl shadow-sm text-center">
          <div className="text-xs font-bold text-text-secondary flex items-center justify-center gap-1">
            <span>
              وزن مولکولی وزنی (M<sub>w</sub>)
            </span>
            <InfoTooltip text="M_w = M_n × PDI (محاسباتی بر اساس PDI ورود یافته)" />
          </div>
          <div className="en-mono font-mono tabular-nums text-lg font-black text-status-warning mt-1">
            M<sub>w</sub> ≈ {mwCalc.toLocaleString()} g/mol
          </div>
        </div>

        <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-3 rounded-xl shadow-sm text-center">
          <div className="text-xs font-bold text-text-secondary flex items-center justify-center gap-1">
            <span>
              درجه پلیمریزاسیون وزنی (DP<sub>w</sub>)
            </span>
            <InfoTooltip text="DP_w = M_w / M_0" />
          </div>
          <div className="en-mono font-mono tabular-nums text-lg font-black text-status-success mt-1">
            DP<sub>w</sub> ≈ {dpW.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
