import React, { useState } from 'react';
import { InfoTooltip } from './InfoTooltip';
import { PolymerData } from '../types/polymer';
import { Leaf, Droplet, Dna, Factory, Recycle } from 'lucide-react';

interface LCACircularEconomyProps {
  polymer: PolymerData;
}

export const LCACircularEconomy: React.FC<LCACircularEconomyProps> = ({ polymer }) => {
  const [pcrShare, setPcrShare] = useState<number>(20); // Post-Consumer Recycled content %

  // Calculate CO2 reduction based on PCR content (Standard ISO 14040 / ISO 14044 LCA metrics)
  // Virgin polymer baseline CO2 footprint (kg CO2e / kg polymer) according to ESU-services / PlasticsEurope LCA databases
  const baseCo2Map: Record<string, number> = {
    ldpe: 1.9,
    hdpe: 1.8,
    pp: 1.9,
    ps: 2.5,
    abs: 3.2,
    pvc: 1.9,
    pet: 2.3,
  };
  const virginCo2 = baseCo2Map[polymer.id] || 2.1;
  // Recycled polymer CO2 is roughly ~0.6 kg CO2/kg (70% savings)
  const recycledCo2 = virginCo2 * 0.28;
  const netCo2 = Number(
    (virginCo2 * (1 - pcrShare / 100) + recycledCo2 * (pcrShare / 100)).toFixed(2),
  );
  const savingsPercent = Math.round(((virginCo2 - netCo2) / virginCo2) * 100);

  const lcaStages = [
    {
      stage: '۱. استخراج خوراک پتروشیمی',
      icon: <Droplet className="w-5 h-5 text-accent-tertiary" />,
      desc: 'کرکینگ نفتا و گاز طبیعی جهت تولید مونومرهای اولیه',
      impact: `${(virginCo2 * 0.45).toFixed(1)} kg CO₂e`,
      badge: 'Upstream',
      badgeClass: 'bg-accent-tertiary/10 text-accent-tertiary border border-accent-tertiary/20',
    },
    {
      stage: '۲. سنتز و پلیمریزاسیون',
      icon: <Dna className="w-5 h-5 text-accent-secondary" />,
      desc: 'واکنش‌های کاتالیستی صنعتی، گرانول‌سازی و افزودنی‌زدایی',
      impact: `${(virginCo2 * 0.35).toFixed(1)} kg CO₂e`,
      badge: 'Synthesis',
      badgeClass: 'bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20',
    },
    {
      stage: '۳. شکل‌دهی و تولید قطعه',
      icon: <Factory className="w-5 h-5 text-status-warning" />,
      desc: 'تزریق پلاستیک، اکستروژن یا قالب‌گیری بادی در کارخانجات پایینی',
      impact: `${(virginCo2 * 0.2).toFixed(1)} kg CO₂e`,
      badge: 'Processing',
      badgeClass: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
    },
    {
      stage: '۴. چرخه بازیافت و پایان عمر (EoL)',
      icon: <Recycle className="w-5 h-5 text-status-success" />,
      desc: `بازیافت مکانیکی (ASTM D7611) یا بازیافت شیمیایی پیرولیز`,
      impact: pcrShare > 0 ? `کاهش ${savingsPercent}٪ کربن` : 'پتانسیل بازیافت',
      badge: 'Circular Loop',
      badgeClass: 'bg-status-success/10 text-status-success border border-status-success/20',
    },
  ];

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-status-success/10 text-status-success border border-status-success/30 px-2.5 py-1 rounded-full text-[11px] font-bold mb-2">
            <Leaf className="w-3.5 h-3.5" />
            <span>ارزیابی چرخه حیات و اقتصاد چرخه‌ای (ISO 14040 / ISO 14044 LCA)</span>
          </div>
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <span>چرخه حیات پلیمری و تحلیل ردپای کربن در گرید {polymer.code}</span>
          </h3>
        </div>

        <div className="en-mono font-mono tabular-nums text-xs font-bold text-text-secondary border border-border-subtle px-2.5 py-1 rounded bg-bg-base">
          ISO 14040 / ISO 15270
        </div>
      </div>

      {/* Interactive PCR Content Slider */}
      <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-4 rounded-xl shadow-sm mb-5">
        <div className="flex justify-between items-center text-xs font-bold text-text-primary mb-2">
          <span>سهم مواد بازیافتی مکانیکی (PCR - Post Consumer Recycled):</span>
          <span className="en-mono font-mono tabular-nums font-black text-status-success text-sm">
            {pcrShare}% PCR
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={pcrShare}
          onChange={(e) => setPcrShare(Number(e.target.value))}
          className="w-full relative z-10 my-3"
          style={{ '--slider-color': 'var(--status-success)' } as React.CSSProperties}
        />
        <div className="flex items-center justify-between gap-3 text-xs font-bold text-text-secondary mt-3 pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            <span>ردپای کربن نهایی:</span>
            <span
              className="en-mono font-mono tabular-nums text-sm font-black text-text-primary bg-bg-base px-2 py-0.5 rounded border border-border-subtle"
              dir="ltr"
            >
              {netCo2} kg CO₂e
            </span>
          </div>
          <div className="text-status-success font-bold tabular-nums inline-flex items-center gap-1.5">
            <span className="en-mono font-mono font-black">{savingsPercent}%</span> کاهش CO₂
          </div>
        </div>
      </div>

      {/* 4 LCA Life Cycle Stages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {lcaStages.map((stg, idx) => (
          <div
            key={idx}
            className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle p-4 rounded-xl shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>{stg.icon}</div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full en-mono font-mono tracking-wider uppercase ${stg.badgeClass}`}
                >
                  {stg.badge}
                </span>
              </div>
              <div className="text-xs font-extrabold text-text-primary mb-1">{stg.stage}</div>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">{stg.desc}</p>
            </div>

            <div className="mt-auto border-t border-border-subtle pt-3 flex items-center justify-between">
              <span className="text-[10px] text-text-secondary font-bold">شاخص آلایندگی:</span>
              <span
                className="text-text-primary font-bold en-mono font-mono tabular-nums text-[11px] bg-bg-base border border-border-subtle px-2 py-1 rounded-md shadow-xs"
                dir="ltr"
              >
                {stg.impact}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
