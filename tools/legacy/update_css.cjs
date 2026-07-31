const fs = require('fs');
let c = fs.readFileSync('src/index.css', 'utf8');
c = c.replace(/--color-accent-secondary: var\(--accent-secondary\);/, '--color-accent-secondary: var(--accent-secondary);\n  --color-accent-tertiary: var(--accent-tertiary);');
c = c.replace(/--accent-secondary: #486581;/, '--accent-secondary: #486581;\n  --accent-tertiary: #8B6691;'); // Lighter plum for dark mode? Or #7A5980? Let's use #8A6A92 for dark mode and #7A5980 for light. Let's use #9A7C9F for dark mode.
c = c.replace(/--accent-secondary: #3E5670;/, '--accent-secondary: #3E5670;\n  --accent-tertiary: #7A5980;');

// Update scrollbar Firefox
c = c.replace(/\* \{/g, '* {\n  scrollbar-width: thin;\n  scrollbar-color: var(--border-subtle) transparent;\n');
// Make webkit scrollbar match better:
c = c.replace(/::-webkit-scrollbar-track {\n  background: var\(--bg-base\);\n}/, '::-webkit-scrollbar-track {\n  background: transparent;\n}');
c = c.replace(/::-webkit-scrollbar-thumb {\n  background: var\(--border-subtle\);\n  border-radius: 4px;\n}/, '::-webkit-scrollbar-thumb {\n  background: var(--border-subtle);\n  border-radius: 9999px;\n  border: 2px solid var(--bg-base);\n}');

fs.writeFileSync('src/index.css', c);
