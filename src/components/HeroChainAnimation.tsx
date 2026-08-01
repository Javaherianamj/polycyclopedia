import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

interface HeroChainAnimationProps {
  chainType:
    | 'branched_long_short'
    | 'linear_pure'
    | 'isotactic'
    | 'atactic'
    | 'polar_cl'
    | 'aromatic'
    | 'ester';
}

export const HeroChainAnimation: React.FC<HeroChainAnimationProps> = ({ chainType }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center'],
  });

  // Map scroll progress to stroke dash array (assuming length ~600)
  const pathLength = 650;
  const strokeDashoffset = useTransform(scrollYProgress, [0, 1], [pathLength, 0]);

  const midY = 60;

  // Backbone path generator
  let backboneD = `M 10 ${midY}`;
  const amplitude = chainType === 'linear_pure' ? 6 : 12;
  const period = chainType === 'linear_pure' ? 20 : 30;

  for (let x = 10; x <= 590; x += 15) {
    backboneD += ` L ${x} ${midY + Math.sin(x / period) * amplitude}`;
  }

  // Branch points
  const branchPoints = [60, 130, 210, 290, 370, 450, 520];

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[650px] h-[120px] mx-auto my-4 relative overflow-hidden rounded-md bg-bg-base border border-border-subtle p-2"
    >
      <svg viewBox="0 600 120" className="w-full h-full">
        {/* Main Backbone */}
        <motion.path
          d={backboneD}
          stroke="var(--accent-secondary)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: pathLength,
            strokeDashoffset: strokeDashoffset,
          }}
        />

        {/* Side groups or branches depending on chainType */}
        {branchPoints.map((x, i) => {
          const y0 = midY + Math.sin(x / period) * amplitude;
          const isUp = i % 2 === 0;

          if (chainType === 'branched_long_short') {
            const isLong = i % 3 === 0;
            const len = isLong ? 28 : 14;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={y0}
                  x2={x + (isUp ? 8 : -8)}
                  y2={isUp ? y0 - len : y0 + len}
                  stroke={isLong ? 'var(--status-warning)' : 'var(--accent-secondary)'}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {isLong && (
                  <circle
                    cx={x + (isUp ? 8 : -8)}
                    cy={isUp ? y0 - len : y0 + len}
                    r="3.5"
                    fill="var(--status-warning)"
                  />
                )}
              </g>
            );
          }

          if (chainType === 'linear_pure' && i % 4 === 0) {
            // Very rare short branches for HDPE
            return (
              <line
                key={i}
                x1={x}
                y1={y0}
                x2={x + 5}
                y2={isUp ? y0 - 10 : y0 + 10}
                stroke="var(--status-warning)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          }

          if (chainType === 'isotactic') {
            // Methyl groups (-CH3) on one side or regular pattern
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={y0}
                  x2={x}
                  y2={y0 - 16}
                  stroke="var(--status-warning)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx={x} cy={y0 - 16} r="4" fill="var(--status-warning)" />
              </g>
            );
          }

          if (chainType === 'polar_cl') {
            // Chlorine atoms
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={y0}
                  x2={x}
                  y2={isUp ? y0 - 18 : y0 + 18}
                  stroke="var(--status-error)"
                  strokeWidth="3"
                />
                <circle cx={x} cy={isUp ? y0 - 18 : y0 + 18} r="5" fill="var(--status-error)" />
              </g>
            );
          }

          if (chainType === 'aromatic') {
            // Phenyl rings
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={y0}
                  x2={x}
                  y2={y0 - 12}
                  stroke="var(--accent-secondary)"
                  strokeWidth="2.5"
                />
                <polygon
                  points={`${x},${y0 - 12} ${x - 8},${y0 - 18} ${x - 8},${y0 - 28} ${x},${y0 - 34} ${x + 8},${y0 - 28} ${x + 8},${y0 - 18}`}
                  fill="none"
                  stroke="var(--accent-secondary)"
                  strokeWidth="2"
                />
              </g>
            );
          }

          if (chainType === 'ester') {
            // Ester carbonyl group
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={y0}
                  x2={x}
                  y2={y0 - 14}
                  stroke="var(--status-warning)"
                  strokeWidth="3"
                />
                <circle cx={x} cy={y0 - 14} r="4.5" fill="var(--status-error)" />
              </g>
            );
          }

          return null;
        })}
      </svg>
      <div className="absolute bottom-1.5 right-3 text-[10px] text-text-secondary font-mono">
        شبیه‌سازی ساختار زنجیر پلیمری
      </div>
    </div>
  );
};
