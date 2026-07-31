let ring = [
  { element: 'C', x: -0.66, y: -1.22, z: 0 },
  { element: 'C', x: 0.67, y: -1.22, z: 0 },
  { element: 'C', x: 1.39, y: 0.04, z: 0 },
  { element: 'C', x: 0.73, y: 1.19, z: 0 },
  { element: 'C', x: -0.72, y: 1.19, z: 0 },
  { element: 'C', x: -1.39, y: 0.04, z: 0 }
];
// Para-substituted, so attached to P2 (1.39, 0.04) and P5 (-1.39, 0.04).
// Let's attach Carboxyl groups.
// Distance should be 1.45.
const right_c = { element: 'C', x: 1.39 + 1.45, y: 0.04, z: 0 };
const left_c = { element: 'C', x: -1.39 - 1.45, y: 0.04, z: 0 };

// Double bond O (dist 1.22 => double bond < 1.35)
const right_o1 = { element: 'O', x: right_c.x, y: right_c.y + 1.22, z: 0 };
// Single bond OH (dist 1.45)
const right_o2 = { element: 'O', x: right_c.x + 1.45, y: right_c.y, z: 0 };

const left_o1 = { element: 'O', x: left_c.x, y: left_c.y + 1.22, z: 0 };
const left_o2 = { element: 'O', x: left_c.x - 1.45, y: left_c.y, z: 0 };

const atoms = [...ring, right_c, right_o1, right_o2, left_c, left_o1, left_o2];

for(let p of atoms) {
    console.log(`{ element: '${p.element}', x: ${p.x.toFixed(2)}, y: ${p.y.toFixed(2)}, z: 0 },`);
}
