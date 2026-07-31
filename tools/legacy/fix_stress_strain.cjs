const fs = require('fs');
let content = fs.readFileSync('src/components/StressStrainChart.tsx', 'utf8');

// replace the static data array with a dynamic generation that includes currentPolymer if not already present
let newContent = content.replace(/const data = \{\s*datasets: \[[\s\S]*?\]\s*\};/, `
  const isIncluded = ['ldpe', 'hdpe', 'pp', 'pvc'].includes(currentPolymer.id);
  
  const parseVal = (str) => {
    if (!str) return 0;
    const matches = String(str).match(/\\d+(\\.\\d+)?/g);
    if (!matches) return 0;
    if (matches.length >= 2) return (parseFloat(matches[0]) + parseFloat(matches[1])) / 2;
    return parseFloat(matches[0]);
  };

  const currentTs = parseVal(currentPolymer.mechanical?.tensileStrength?.value) || 30;
  const currentEb = parseVal(currentPolymer.mechanical?.elongationAtBreak?.value) || 100;
  
  const currentDataset = {
    label: \`\${currentPolymer.code} (فعلی)\`,
    data: [
      { x: 0, y: 0 },
      { x: currentEb * 0.1, y: currentTs * 0.8 },
      { x: currentEb * 0.3, y: currentTs },
      { x: currentEb, y: currentTs * 0.9 }
    ],
    borderColor: '#9333ea', // purple
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    borderWidth: 4,
    tension: 0.4,
    fill: true,
    borderDash: [5, 5]
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
        { x: 600, y: 15 }
      ],
      borderColor: '#10b981',
      backgroundColor: currentPolymer.id === 'ldpe' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
      borderWidth: currentPolymer.id === 'ldpe' ? 3 : 1.5,
      tension: 0.4,
      fill: currentPolymer.id === 'ldpe'
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
        { x: 350, y: 28 }
      ],
      borderColor: '#2563eb',
      backgroundColor: currentPolymer.id === 'hdpe' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
      borderWidth: currentPolymer.id === 'hdpe' ? 3 : 1.5,
      tension: 0.4,
      fill: currentPolymer.id === 'hdpe'
    },
    {
      id: 'pp',
      label: 'PP (استحکام کششی بالا)',
      data: [
        { x: 0, y: 0 },
        { x: 8, y: 36 },
        { x: 20, y: 30 },
        { x: 100, y: 32 },
        { x: 250, y: 35 }
      ],
      borderColor: '#f59e0b',
      backgroundColor: currentPolymer.id === 'pp' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
      borderWidth: currentPolymer.id === 'pp' ? 3 : 1.5,
      tension: 0.4,
      fill: currentPolymer.id === 'pp'
    },
    {
      id: 'pvc',
      label: 'U-PVC (صلب و ترد)',
      data: [
        { x: 0, y: 0 },
        { x: 3, y: 52 },
        { x: 10, y: 48 },
        { x: 20, y: 50 }
      ],
      borderColor: '#f43f5e',
      backgroundColor: currentPolymer.id === 'pvc' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
      borderWidth: currentPolymer.id === 'pvc' ? 3 : 1.5,
      tension: 0.3,
      fill: currentPolymer.id === 'pvc'
    }
  ];

  const data = {
    datasets: isIncluded ? baseDatasets : [...baseDatasets, currentDataset]
  };
`);

fs.writeFileSync('src/components/StressStrainChart.tsx', newContent);
