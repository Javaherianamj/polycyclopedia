const fs = require('fs');

const svgMap = {
  // Blues/Cyans -> Accent Secondary
  '#2563eb': 'var(--accent-secondary)',
  '#0284c7': 'var(--accent-secondary)',
  '#38bdf8': 'var(--accent-secondary)',
  '#74b3ce': 'var(--accent-secondary)',
  
  // Oranges/Yellows -> Status Warning
  '#f59e0b': 'var(--status-warning)',
  '#fbbf24': 'var(--status-warning)',
  '#d97706': 'var(--status-warning)',
  '#b45309': 'var(--status-warning)',
  
  // Reds -> Status Error
  '#f43f5e': 'var(--status-error)',

  // Teals/Greens -> Accent Primary (assuming #508991 was primary in previous theme)
  '#508991': 'var(--accent-primary)',
  '#004346': 'var(--accent-primary)',
  '#172a3a': 'var(--bg-base)', // Dark navy bg -> base

  // Whites/Neutrals -> CSS variables
  '#ffffff': 'var(--bg-surface)',
  '#fff': 'var(--bg-surface)', // in StateSimulator and Hansen stroke

  // Hansen chart specific backgrounds
  '#f8fafc': 'var(--bg-surface)', // light mode bg
  '#0f172a': 'var(--bg-surface)', // dark mode bg
  '#e2e8f0': 'var(--border-subtle)', // light mode border
  '#1e293b': 'var(--border-subtle)', // dark mode border
  '#94a3b8': 'var(--border-subtle)', // lines
  '#64748b': 'var(--text-secondary)' // labels
};

const files = [
  './src/components/HeroChainAnimation.tsx',
  './src/components/BranchingSimulator.tsx',
  './src/components/TacticitySimulator.tsx',
  './src/components/Hansen3DChart.tsx',
  './src/components/StateSimulator.tsx',
  './src/components/MarketShareChart.tsx',
  './src/components/StressStrainChart.tsx',
  './src/App.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  Object.keys(svgMap).forEach(key => {
    // Escape string if needed, hex is usually fine. Use global match
    const val = svgMap[key];
    const re = new RegExp(key, 'gi');
    content = content.replace(re, val);
  });
  
  // Clean up App.tsx double text classes
  content = content.replace(/text-var\(--accent-primary\) text-accent-secondary/gi, 'text-accent-secondary');
  content = content.replace(/text-var\(--bg-base\) text-accent-secondary/gi, 'text-accent-secondary');
  content = content.replace(/text-var\(--bg-base\)/gi, 'text-text-primary');

  fs.writeFileSync(file, content, 'utf8');
});
