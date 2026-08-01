import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import type { TooltipItem } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { MarketShareItem } from '../types/polymer';
import { PieChart } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface MarketShareChartProps {
  data: MarketShareItem[];
  polymerName: string;
  isDark: boolean;
}

export const MarketShareChart: React.FC<MarketShareChartProps> = ({
  data,
  polymerName,
  isDark,
}) => {
  const textColor = isDark ? '#EDEDEE' : '#1C1E22';
  const cAccentPrimary = isDark ? '#C9793D' : '#A85F28';
  const cAccentSecondary = isDark ? '#486581' : '#3E5670';
  const cStatusSuccess = isDark ? '#3BA99C' : '#2F8A7F';
  const cStatusWarning = isDark ? '#D9A441' : '#B8842F';
  const cStatusError = isDark ? '#D9605F' : '#C24B4A';
  const cTextSecondary = isDark ? '#9A9DA5' : '#6B6E76';
  const cAccentTertiary = isDark ? '#8B6691' : '#7A5980';
  const cBgBase = isDark ? '#15171B' : '#F6F2E7';

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.percentage),
        backgroundColor: [
          cAccentTertiary,
          cAccentSecondary,
          cStatusSuccess,
          cStatusWarning,
          cStatusError,
          cTextSecondary,
        ],
        borderWidth: 1,
        borderColor: cBgBase,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        rtl: true,
        textDirection: 'rtl',
        labels: {
          color: textColor,
          font: { family: 'Vazirmatn, sans-serif', size: 10 },
          padding: 10,
          boxWidth: 12,
        },
      },
      tooltip: {
        rtl: true,
        textDirection: 'rtl',
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) =>
            `\u202B${context.label}: ${context.parsed}%\u202C`,
        },
      },
    },
  };

  return (
    <div className="bg-bg-surface/70 backdrop-blur-md border border-border-subtle rounded-lg p-5 my-6 shadow-sm">
      <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-1.5">
        <PieChart className="w-5 h-5 text-accent-primary" />
        <span>
          سهم بازار کاربردهای <bdi>{polymerName}</bdi> در جهان
        </span>
      </h3>
      <p className="text-xs text-text-secondary mb-4">
        توزیع درصدی مصرف جهانی این پلیمر در صنایع مختلف:
      </p>
      <div
        className="h-[280px] sm:h-[300px] w-full relative"
        aria-label={`نمودار سهم بازار کاربردهای ${polymerName}`}
      >
        <Doughnut data={chartData} options={options} aria-hidden="true" />
      </div>
    </div>
  );
};
