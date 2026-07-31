const fs = require('fs');
let content = fs.readFileSync('src/components/StateSimulator.tsx', 'utf8');

content = content.replace(/'🧊 حالت شیشه‌ای و صلب \(Glassy State\)'/g, "'حالت شیشه‌ای و صلب (Glassy State)'");
content = content.replace(/'🌿 حالت نیمه‌بلوری \/ لاستیکی \(Semi-Crystalline \/ Rubbery State\)'/g, "'حالت نیمه‌بلوری / لاستیکی (Semi-Crystalline / Rubbery State)'");
content = content.replace(/'💧 حالت لاستیکی \/ سیال ویسکوالاستیک \(Viscoelastic Melt Flow State\)'/g, "'حالت لاستیکی / سیال ویسکوالاستیک (Viscoelastic Melt Flow State)'");
content = content.replace(/'💧 حالت مذاب سیال \(Melt \/ Viscous Flow State\)'/g, "'حالت مذاب سیال (Melt / Viscous Flow State)'");
content = content.replace(/'🔥 تخریب حرارتی و شکست پیوندها \(Thermal Degradation\)'/g, "'تخریب حرارتی و شکست پیوندها (Thermal Degradation)'");
content = content.replace(/<span className="text-2xl">🌡️<\/span>/g, ""); // wait, I should also replace the parent wrapper if it is just a flex container

fs.writeFileSync('src/components/StateSimulator.tsx', content);
