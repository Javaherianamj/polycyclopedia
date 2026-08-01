import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PolymerData } from '../types/polymer';
import { TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface StressStrainChartProps {
  currentPolymer: PolymerData;
  isDark: boolean;
}

export const StressStrainChart: React.FC<StressStrainChartProps> = ({ currentPolymer, isDark }) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const textColor = isDark ? '#EDEDEE' : '#1C1E22';

  const cAccentSecondary = isDark ? '#486581' : '#3E5670';
  const cStatusSuccess = isDark ? '#3BA99C' : '#2F8A7F';
  const cStatusWarning = isDark ? '#D9A441' : '#B8842F';
  const cStatusError = isDark ? '#D9605F' : '#C24B4A';
  const cBorderSubtle = isDark ? '#2A2D33' : '#E3DDCE';
  const cAccentTertiary = isDark ? '#8B6691' : '#7A5980';

  const gridColor = cBorderSubtle;

  // Data sets for comparative stress-strain curves

  const isIncluded = ['ldpe', 'hdpe', 'pp', 'pvc'].includes(currentPolymer.id);

  const parseVal = (str: string | number | undefined) => {
    if (!str) return 0;
    const matches = String(str).match(/\d+(\.\d+)?/g);
    if (!matches) return 0;
    if (matches.length >= 2) return (parseFloat(matches[0]) + parseFloat(matches[1])) / 2;
    return parseFloat(matches[0]);
  };

  const currentTs = parseVal(currentPolymer.mechanical?.tensileStrength?.value) || 30;
  const currentEb = parseVal(currentPolymer.mechanical?.elongationAtBreak?.value) || 100;

  const currentDataset = {
    label: `${currentPolymer.code} (فعلی)`,
    data: [
      { x: 0, y: 0 },
      { x: currentEb * 0.1, y: currentTs * 0.8 },
      { x: currentEb * 0.3, y: currentTs },
      { x: currentEb, y: currentTs * 0.9 },
    ],
    borderColor: cAccentTertiary, // purple
    backgroundColor: 'transparent',
    borderWidth: 4,
    tension: 0.4,
    fill: true,
    borderDash: [5, 5],
  };

  const baseDatasets = [
    {
      id: 'ldpe',
      label: 'LDPE (نرم و انعطاف‌پذیر)',
      data: [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 50, y: 11 },
        { x: 150, y: 12 },
        { x: 350, y: 13.5 },
        { x: 600, y: 15 },
      ],
      borderColor: cStatusSuccess,
      backgroundColor: 'transparent',
      borderWidth: currentPolymer.id === 'ldpe' ? 3 : 1.5,
      tension: 0.4,
      fill: currentPolymer.id === 'ldpe',
    },
    {
      id: 'hdpe',
      label: 'HDPE (صلب با نقطه تسلیم واضح)',
      data: [
        { x: 0, y: 0 },
        { x: 10, y: 30 },
        { x: 25, y: 25 },
        { x: 80, y: 24 },
        { x: 200, y: 26 },
        { x: 350, y: 28 },
      ],
      borderColor: cAccentSecondary,
      backgroundColor: 'transparent',
      borderWidth: currentPolymer.id === 'hdpe' ? 3 : 1.5,
      tension: 0.4,
      fill: currentPolymer.id === 'hdpe',
    },
    {
      id: 'pp',
      label: 'PP (استحکام کششی بالا)',
      data: [
        { x: 0, y: 0 },
        { x: 8, y: 36 },
        { x: 20, y: 30 },
        { x: 100, y: 32 },
        { x: 250, y: 35 },
      ],
      borderColor: cStatusWarning,
      backgroundColor: 'transparent',
      borderWidth: currentPolymer.id === 'pp' ? 3 : 1.5,
      tension: 0.4,
      fill: currentPolymer.id === 'pp',
    },
    {
      id: 'pvc',
      label: 'U-PVC (صلب و ترد)',
      data: [
        { x: 0, y: 0 },
        { x: 3, y: 52 },
        { x: 10, y: 48 },
        { x: 20, y: 50 },
      ],
      borderColor: cStatusError,
      backgroundColor: 'transparent',
      borderWidth: currentPolymer.id === 'pvc' ? 3 : 1.5,
      tension: 0.3,
      fill: currentPolymer.id === 'pvc',
    },
  ];

  const data = {
    datasets: isIncluded ? baseDatasets : [...baseDatasets, currentDataset],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear' as const,
        max: isMobile ? 150 : undefined,
        title: {
          display: true,
          text: 'کرنش کششی / Strain (%)',
          color: textColor,
          font: { family: 'Vazirmatn, sans-serif', size: 12 },
        },
        ticks: { color: textColor, font: { family: 'ui-monospace, monospace' } },
        grid: { color: gridColor },
      },
      y: {
        title: {
          display: true,
          text: 'تنش کششی / Stress (MPa)',
          color: textColor,
          font: { family: 'Vazirmatn, sans-serif', size: 12 },
        },
        ticks: { color: textColor, font: { family: 'ui-monospace, monospace' } },
        grid: { color: gridColor },
        suggestedMax: 60,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        rtl: true,
        textDirection: 'rtl',
        labels: {
          color: textColor,
          font: { family: 'Vazirmatn, sans-serif', size: 12 },
        },
      },
      tooltip: {
        rtl: true,
        textDirection: 'rtl',
        callbacks: {
          label: (context: TooltipItem<'line'>) =>
            `\u202B${context.dataset.label}: ${context.parsed.y} MPa در کرنش ${context.parsed.x}%\u202C`,
        },
      },
    },
  };

  return (
    <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle rounded-lg p-5 my-6 shadow-sm">
      <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-1.5">
        <TrendingUp className="w-5 h-5 text-status-warning" />
        <span>نمودار مقایسه‌ای تنش-کرنش (Stress-Strain Curve)</span>
      </h3>
      <p className="text-xs text-text-secondary mb-4">
        مقایسه رفتار مکانیکی و تغییر شکل{' '}
        <bdi>
          {currentPolymer.nameFa} ({currentPolymer.code})
        </bdi>{' '}
        در برابر سایر پلیمرهای شاخص:
      </p>
      <div
        className="h-[280px] w-full relative"
        aria-label={`نمودار مقایسه‌ای تنش-کرنش ${currentPolymer.nameFa}`}
      >
        <Line data={data} options={options} aria-hidden="true" />

        {/* Accessible Data Table */}
        <table className="sr-only">
          <thead>
            <tr>
              <th scope="col">پلیمر</th>
              <th scope="col">کرنش (درصد)</th>
              <th scope="col">تنش (MPa)</th>
            </tr>
          </thead>
          <tbody>
            {data.datasets.map((dataset, dsIdx) =>
              dataset.data.map((point: { x: number; y: number }, pIdx: number) => (
                <tr key={`${dsIdx}-${pIdx}`}>
                  <td>{dataset.label}</td>
                  <td>{point.x}</td>
                  <td>{point.y}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
