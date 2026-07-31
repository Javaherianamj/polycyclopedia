const cx = 0, cy = 0;
// Shifted ring
const ring = [
  { element: 'C', x: -0.66, y: -1.22, z: 0 },
  { element: 'C', x: 0.67, y: -1.22, z: 0 },
  { element: 'C', x: 1.39, y: 0.04, z: 0 },
  { element: 'C', x: 0.73, y: 1.19, z: 0 },
  { element: 'C', x: -0.72, y: 1.19, z: 0 },
  { element: 'C', x: -1.39, y: 0.04, z: 0 } // P5
];
const c2 = { element: 'C', x: -2.84, y: 0.04, z: 0 };
const c1 = { element: 'C', x: -4.17, y: 0.04, z: 0 };
const atoms = [c1, c2, ...ring];
for(let p of atoms) {
    console.log(`{ element: 'C', x: ${p.x.toFixed(2)}, y: ${p.y.toFixed(2)}, z: 0 },`);
}
