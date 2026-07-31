const cx = 0, cy = 0;
// Make ring with P5 at (0, 1.45)
// Let's use the makeRing logic but rotate it so P5 is at top.
function makeRing(cx, cy, rot=0) {
    let pts = [];
    let d = [1.33, 1.45, 1.33, 1.45, 1.33, 1.45];
    let angle = rot;
    let x = cx, y = cy;
    pts.push({x, y, z: 0});
    for (let i=0; i<5; i++) {
        x += d[i] * Math.cos(angle);
        y += d[i] * Math.sin(angle);
        pts.push({x, y, z:0});
        angle += (Math.PI - (120 * Math.PI / 180));
    }
    return pts;
}
// If we want P5 at (0, 1.45) and C2 at (0, 0), we can just start P0 at some point.
// Actually just shift the previously generated ring so that P5 is at (0, 1.45)
let ring = [
  { element: 'C', x: -0.66, y: -1.22, z: 0 },
  { element: 'C', x: 0.67, y: -1.22, z: 0 },
  { element: 'C', x: 1.39, y: 0.04, z: 0 },
  { element: 'C', x: 0.73, y: 1.19, z: 0 },
  { element: 'C', x: -0.72, y: 1.19, z: 0 },
  { element: 'C', x: -1.39, y: 0.04, z: 0 } // P5
];
const p5x = -1.39, p5y = 0.04;
// We want P5 to be at (0, 1.45)
// So dx = 0 - (-1.39) = 1.39, dy = 1.45 - 0.04 = 1.41
for(let p of ring) {
   p.x += 1.39;
   p.y += 1.41;
}

const c2 = { element: 'C', x: 0, y: 0, z: 0 };
const c1 = { element: 'C', x: -1.5, y: 0, z: 0 }; // unit width 3.0 => -1.5 to 1.5. Dist is 1.5 > 1.38

const atoms = [c1, c2, ...ring];
for(let p of atoms) {
    console.log(`{ element: 'C', x: ${p.x.toFixed(2)}, y: ${p.y.toFixed(2)}, z: 0 },`);
}
