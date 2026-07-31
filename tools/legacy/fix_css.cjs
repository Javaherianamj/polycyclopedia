const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/::-webkit-scrollbar \{[\s\S]*?::-webkit-scrollbar-thumb:hover \{[\s\S]*?\}/, 
`::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bg-base);
}
::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: 9999px;
  border: 2px solid var(--bg-base);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}`);

css = css.replace(/input\[type="range"\] \{[\s\S]*?input\[type="range"\]::-moz-range-thumb:active \{[\s\S]*?\}/,
`/* Custom Range Slider */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  --slider-color: var(--accent-secondary);
}

input[type="range"]::-webkit-slider-runnable-track {
  background: var(--border-subtle);
  height: 8px;
  border-radius: 9999px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  margin-top: -6px;
  background-color: var(--slider-color);
  border: 2px solid var(--bg-surface);
  height: 20px;
  width: 20px;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease, filter 0.15s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  filter: brightness(1.2);
}

input[type="range"]::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

input[type="range"]::-moz-range-track {
  background: var(--border-subtle);
  height: 8px;
  border-radius: 9999px;
}

input[type="range"]::-moz-range-thumb {
  background-color: var(--slider-color);
  border: 2px solid var(--bg-surface);
  height: 20px;
  width: 20px;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease, filter 0.15s ease;
}

input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.15);
  filter: brightness(1.2);
}

input[type="range"]::-moz-range-thumb:active {
  transform: scale(0.95);
}`);

fs.writeFileSync('src/index.css', css, 'utf8');
