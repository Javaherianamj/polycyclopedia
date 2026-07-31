const fs = require('fs');

const scale = 2.0;
const dCC = 1.54 * scale;
const dCPh = 1.50 * scale;
const dRing = 1.40 * scale; // average ring C-C distance
const nUnits = 6;

const atoms = [];

// Zig-zag backbone along X-axis in XY plane
const angleZ = 109.5 * Math.PI / 180;
const angleXY = Math.PI - angleZ; 
// Let's just do a simple 2D zigzag backbone with Z=0, and attach rings along Z axis or Y axis.
// Backbone in X-Y plane
let currentX = -((nUnits * 2 - 1) * dCC * Math.cos(angleXY/2)) / 2;
let currentY = 0;

for (let i = 0; i < nUnits * 2; i++) {
  // Backbone carbon
  const isCH2 = (i % 2 === 0);
  const signY = (i % 2 === 0) ? 1 : -1;
  const x = currentX;
  const y = signY * (dCC * Math.sin(angleXY/2));
  const z = 0;
  
  atoms.push({ element: 'C', x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), z: Number(z.toFixed(2)) });
  
  if (!isCH2) {
    // Attach phenyl ring to CH
    // Since backbone is in XY plane, let's put the ring in XZ plane or YZ plane.
    // To avoid collision, we alternate the ring direction +Z and -Z (syndiotactic).
    const signZ = (i % 4 === 1) ? 1 : -1; 
    
    // Ring center is attached to (x, y, z)
    // First ring carbon (C_ipso)
    const cx0 = x;
    const cy0 = y; // + signY * 0.2 just to tilt slightly? No, keep it straight.
    const cz0 = signZ * dCPh;
    
    atoms.push({ element: 'C', x: Number(cx0.toFixed(2)), y: Number(cy0.toFixed(2)), z: Number(cz0.toFixed(2)) });
    
    // Generate the other 5 carbons of the ring
    // The ring is a hexagon. We'll orient it in the XZ plane.
    for (let r = 1; r < 6; r++) {
      const theta = (r * 60) * Math.PI / 180;
      // Distance from center of ring to a vertex is dRing.
      // Wait, if dRing is edge length, then distance from center to vertex is also dRing.
      // We want the ring attached at C_ipso. 
      // The center of the ring is at C_ipso + (dRing) in the Z direction.
      const ringCenterX = cx0;
      const ringCenterY = cy0;
      const ringCenterZ = cz0 + signZ * dRing;
      
      // Let's just place them correctly.
      // Vertex 0 is C_ipso.
      // We rotate around Y axis (so ring is in XZ plane).
      const rx = ringCenterX + dRing * Math.cos(theta - Math.PI/2);
      const rz = ringCenterZ + signZ * dRing * Math.sin(theta - Math.PI/2);
      const ry = ringCenterY;
      
      atoms.push({ element: 'C', x: Number(rx.toFixed(2)), y: Number(ry.toFixed(2)), z: Number(rz.toFixed(2)) });
    }
  }
  
  currentX += dCC * Math.cos(angleXY/2);
}

const newAtomsStr = 'atoms3d: ' + JSON.stringify(atoms, null, 2).replace(/"([^"]+)":/g, '$1:') + ',';

let data = fs.readFileSync('src/data/polymersData.ts', 'utf8');

// The PS polymer has id: 'ps'
const psRegex = /(id:\s*'ps'[\s\S]*?)atoms3d:\s*\[[\s\S]*?\]\,/m;
if(psRegex.test(data)) {
  data = data.replace(psRegex, `$1${newAtomsStr}`);
  fs.writeFileSync('src/data/polymersData.ts', data, 'utf8');
  console.log("Updated PS atoms!");
} else {
  console.log("Could not find PS atoms3d array.");
}

