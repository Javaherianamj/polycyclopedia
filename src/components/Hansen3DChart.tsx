import React, { useState, useRef, useEffect, MouseEvent, WheelEvent, TouchEvent } from 'react';
import { Layers } from 'lucide-react';

interface Hansen3DChartProps {
  polymerCode: string;
  d: number | string;
  p: number | string;
  h: number | string;
}

export const Hansen3DChart: React.FC<Hansen3DChartProps> = ({ polymerCode, d, p, h }) => {
  const [rotationX, setRotationX] = useState(-20); // Elevation
  const [rotationZ, setRotationZ] = useState(-30); // Azimuth
  const [zoom, setZoom] = useState(200); // Scale factor
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const parseVal = (v: number | string) => {
    if (typeof v === 'number') return v;
    const num = parseFloat(v.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const polD = parseVal(d);
  const polP = parseVal(p);
  const polH = parseVal(h);

  const referenceSolvents = [
    { name: 'Water', d: 15.6, p: 16.0, h: 42.3, color: 'var(--accent-secondary)' },
    { name: 'Ethanol', d: 15.8, p: 8.8, h: 19.4, color: 'var(--status-success)' },
    { name: 'Acetone', d: 15.5, p: 10.4, h: 7.0, color: 'var(--status-error)' },
    { name: 'Toluene', d: 18.0, p: 1.4, h: 2.0, color: 'var(--text-secondary)' },
    { name: 'Hexane', d: 14.9, p: 0.0, h: 0.0, color: 'var(--status-warning)' },
  ];

  const allPoints = [
    {
      name: polymerCode,
      d: polD,
      p: polP,
      h: polH,
      color: 'var(--accent-tertiary)',
      isPolymer: true,
      radius: 8,
    },
    ...referenceSolvents.map((s) => ({ ...s, isPolymer: false, radius: 4 })),
  ];

  const handleTouchStart = (e: TouchEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - lastMousePos.x;
    const dy = e.touches[0].clientY - lastMousePos.y;

    setRotationZ((prev) => prev + dx * 0.5);
    setRotationX((prev) => Math.max(-80, Math.min(80, prev - dy * 0.5)));
    setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    setRotationZ((prev) => prev + dx * 0.5);
    setRotationX((prev) => Math.max(-80, Math.min(80, prev - dy * 0.5)));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.max(100, Math.min(400, prev - e.deltaY * 0.2)));
  };

  const project = (xd: number, yp: number, zh: number) => {
    const nx = (xd - 12) / 10 - 0.5;
    const ny = yp / 20 - 0.5;
    const nz = zh / 45 - 0.5;

    const radZ = (rotationZ * Math.PI) / 180;
    const radX = (rotationX * Math.PI) / 180;

    // Rotate around Z axis (azimuth)
    const rx = nx * Math.cos(radZ) - ny * Math.sin(radZ);
    let ry = nx * Math.sin(radZ) + ny * Math.cos(radZ);
    let rz = nz;

    // Rotate around X axis (elevation)
    const y2 = ry * Math.cos(radX) - rz * Math.sin(radX);
    const z2 = ry * Math.sin(radX) + rz * Math.cos(radX);
    ry = y2;
    rz = z2;

    const px = 250 + rx * zoom;
    const py = 160 - ry * zoom; // SVG Y is down
    return { px, py, depth: rz };
  };

  const projectedPoints = allPoints
    .map((pt) => ({
      ...pt,
      ...project(pt.d, pt.p, pt.h),
    }))
    .sort((a, b) => a.depth - b.depth);

  const axes: {
    start: number[];
    end: number[];
    label: string;
    align: 'end' | 'start' | 'middle';
  }[] = [
    { start: [12, 0, 0], end: [22, 0, 0], label: 'δD (Dispersion)', align: 'end' },
    { start: [12, 0, 0], end: [12, 20, 0], label: 'δP (Polar)', align: 'start' },
    { start: [12, 0, 0], end: [12, 0, 45], label: 'δH (Hydrogen)', align: 'middle' },
  ];

  return (
    <div
      ref={containerRef}
      className="bg-bg-base border border-border-subtle rounded-xl p-5 my-6 shadow-sm overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-border-subtle">
        <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
          <Layers className="w-5 h-5 text-accent-primary" />
          <span>نمودار سه‌بعدی حلالیت هانسن (Hansen Space)</span>
        </h3>
        <div className="text-xs text-text-secondary font-bold bg-bg-surface px-3 py-1 rounded-full mt-2 sm:mt-0">
          ماوس را بکشید تا بچرخد • اسکرول برای زوم
        </div>
      </div>

      {!isVisible ? (
        <div className="w-full h-[320px] bg-bg-surface rounded-lg border border-border-subtle flex justify-center items-center">
          <span className="text-text-secondary">در حال بارگذاری...</span>
        </div>
      ) : (
        <div
          className="relative w-full h-[320px] bg-bg-surface rounded-lg border border-border-subtle flex justify-center items-center overflow-hidden cursor-move touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg width="500" height="320" viewBox="0 500 320" className="max-w-full">
            {/* Draw Grid / Bounding Box base */}
            <polygon
              points={`${project(12, 0, 0).px},${project(12, 0, 0).py} ${project(22, 0, 0).px},${project(22, 0, 0).py} ${project(22, 20, 0).px},${project(22, 20, 0).py} ${project(12, 20, 0).px},${project(12, 20, 0).py}`}
              fill="var(--bg-surface)"
              className="hidden"
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
            <polygon
              points={`${project(12, 0, 0).px},${project(12, 0, 0).py} ${project(22, 0, 0).px},${project(22, 0, 0).py} ${project(22, 20, 0).px},${project(22, 20, 0).py} ${project(12, 20, 0).px},${project(12, 20, 0).py}`}
              fill="var(--bg-surface)"
              className="hidden block"
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />

            {/* Draw Axes */}
            {axes.map((ax, i) => {
              const p1 = project(ax.start[0], ax.start[1], ax.start[2]);
              const p2 = project(ax.end[0], ax.end[1], ax.end[2]);
              return (
                <g key={i}>
                  <line
                    x1={p1.px}
                    y1={p1.py}
                    x2={p2.px}
                    y2={p2.py}
                    stroke="var(--border-subtle)"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                  <text
                    x={p2.px}
                    y={p2.py - 10}
                    fill="var(--text-secondary)"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor={ax.align}
                  >
                    {ax.label}
                  </text>
                </g>
              );
            })}

            {/* Draw Points */}
            {projectedPoints.map((pt, i) => (
              <g key={i} className="group transition-transform cursor-pointer">
                <line
                  x1={project(pt.d, pt.p, 0).px}
                  y1={project(pt.d, pt.p, 0).py}
                  x2={pt.px}
                  y2={pt.py}
                  stroke={pt.color}
                  strokeWidth="1"
                  strokeDasharray="2"
                  opacity="0.5"
                />

                <circle
                  cx={pt.px}
                  cy={pt.py}
                  r={pt.radius}
                  fill={pt.color}
                  stroke="var(--bg-surface)"
                  strokeWidth={pt.isPolymer ? 2 : 1}
                />

                <text
                  x={pt.px + 10}
                  y={pt.py - 10}
                  fill={pt.isPolymer ? pt.color : 'var(--text-secondary)'}
                  fontSize={pt.isPolymer ? '12' : '10'}
                  fontWeight="bold"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {pt.name} (δD:{pt.d}, δP:{pt.p}, δH:{pt.h})
                </text>

                {pt.isPolymer && (
                  <text
                    x={pt.px + 12}
                    y={pt.py + 4}
                    fill={pt.color}
                    fontSize="12"
                    fontWeight="900"
                    className="drop-shadow-sm pointer-events-none"
                  >
                    {pt.name}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-2 right-2 bg-bg-surface/90 backdrop-blur p-2 rounded border border-border-subtle text-[10px] flex-col gap-1.5 shadow-sm pointer-events-none">
            <div className="font-bold text-text-secondary mb-1 border-b border-border-subtle pb-1">
              راهنمای حلال‌ها
            </div>
            {referenceSolvents.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-text-secondary font-mono">{s.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-border-subtle">
              <div
                className="w-3 h-3 rounded-full border-2 border border-border-subtle"
                style={{ backgroundColor: 'var(--accent-tertiary)' }}
              />
              <span className="text-accent-tertiary font-bold">{polymerCode} (فعلی)</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-text-secondary mt-3 leading-relaxed">
        پارامترهای حلالیت هانسن به صورت برداری در فضای سه‌بعدی شامل نیروهای پراکندگی (δD)، قطبی (δP)
        و پیوند هیدروژنی (δH) تعریف می‌شوند. فاصله کمتر بین دو نقطه در این فضا، نشان‌دهنده تمایل
        بیشتر به انحلال است.
      </p>
    </div>
  );
};
