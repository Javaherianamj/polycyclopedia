const fs = require('fs');
let file = './src/components/StateSimulator.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/color = '#3b82f6';/g, "color = 'var(--accent-secondary)';");
content = content.replace(/color = '#0284c7';/g, "color = 'var(--accent-secondary)';");
content = content.replace(/color = '#10b981';/g, "color = 'var(--status-success)';");
content = content.replace(/color = '#f59e0b';/g, "color = 'var(--status-warning)';");
content = content.replace(/color = '#ef4444';/g, "color = 'var(--status-error)';");
content = content.replace(/backgroundColor: '#10b981'/g, "backgroundColor: 'var(--status-success)'");

fs.writeFileSync(file, content, 'utf8');
