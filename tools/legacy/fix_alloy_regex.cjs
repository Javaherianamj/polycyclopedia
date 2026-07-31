const fs = require('fs');

const p = './src/components/AlloyingSimulator.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/      <\/div>\s*<\/div>\s*<\/div>\s*\);\s*};/,
`      </div>
    </div>
  );
};`);

fs.writeFileSync(p, c, 'utf8');
