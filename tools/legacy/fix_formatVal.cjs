const fs = require('fs');

const fixFile = (filePath) => {
  let data = fs.readFileSync(filePath, 'utf8');
  
  // Replace the old formatVal definition
  const oldDef = /const formatVal = \(v: any\) => \{(.*?)\};/s;
  const newDef = `const formatVal = (v: any) => {
  if (v?.value === undefined) return v;
  const text = \`\${v.value} \${v.unit}\`.trim();
  return v.note ? (
    <span className="flex flex-col">
      <span dir="ltr">{text}</span>
      <span className="!font-sans font-medium text-[11px] sm:text-xs mt-0.5 text-text-secondary whitespace-normal text-right leading-tight" dir="rtl">{v.note}</span>
    </span>
  ) : (
    <span dir="ltr">{text}</span>
  );
};`;

  if (oldDef.test(data)) {
    data = data.replace(oldDef, newDef);
  } else {
    const singleLineDef = /const formatVal = \(v: any\) => v\?\.value !== undefined \? `\$\{v\.value\} \$\{v\.unit\}`\.trim\(\) : v;/g;
    data = data.replace(singleLineDef, newDef);
  }
  
  fs.writeFileSync(filePath, data, 'utf8');
};

['src/App.tsx', 'src/components/CompareModal.tsx', 'src/components/CatalogPage.tsx', 'src/components/StateSimulator.tsx', 'src/components/DPCalculator.tsx'].forEach(fixFile);
