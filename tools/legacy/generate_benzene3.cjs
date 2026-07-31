let x = 0, y = 1.4; // starting point (C0 attached to backbone)
let currentAngle = 0;
const pts = [{x, y}];
const lengths = [1.34, 1.46, 1.34, 1.46, 1.34, 1.46];

// If internal angles are 120, we turn by 60 degrees (Math.PI/3) each time.
for (let i = 0; i < 5; i++) {
    x += lengths[i] * Math.cos(currentAngle);
    y -= lengths[i] * Math.sin(currentAngle); // go down
    pts.push({x, y});
    currentAngle -= Math.PI / 3;
}

// Map 2D back to our 3D plane (YZ plane rotated by 45 deg or whatever).
// Wait, C0 is (0, 1.4, 1.0).
// In 3D, C0 is origin of our benzene local coords.
// Let's use the local coords directly:
const C0 = {x: 0, y: 1.4, z: 1.0};
const vX = {x: 1, y: 0, z: 0}; // map to 2D x
const vY = {x: 0, y: 0.707, z: 0.707}; // map to 2D y

const atoms = [];
for (let i = 0; i < 6; i++) {
    // shift so C0 is at local (0, 1.4), which it already is in `pts`
    // wait, we want C0 to map to C0 3D. 
    // local displacement from C0:
    const dx = pts[i].x - pts[0].x;
    const dy = pts[i].y - pts[0].y;
    
    const ax = C0.x + dx * vX.x + dy * vY.x;
    const ay = C0.y + dx * vX.y + dy * vY.y;
    const az = C0.z + dx * vX.z + dy * vY.z;
    atoms.push({element: 'C', x: parseFloat(ax.toFixed(2)), y: parseFloat(ay.toFixed(2)), z: parseFloat(az.toFixed(2))});
    
    // Hydrogen
    if (i !== 0) {
        // angle from center of hexagon?
        // Let's compute center of hexagon
        // approximate center
    }
}
// Compute center of 2D
let cx = 0, cy = 0;
pts.forEach(p => { cx += p.x; cy += p.y; });
cx /= 6; cy /= 6;

// add hydrogens
for (let i = 1; i < 6; i++) {
    const dx = pts[i].x - cx;
    const dy = pts[i].y - cy;
    const len = Math.sqrt(dx*dx + dy*dy);
    // h pos in 2D
    const hx = pts[i].x + (dx/len) * 1.08;
    const hy = pts[i].y + (dy/len) * 1.08;
    
    const ddx = hx - pts[0].x;
    const ddy = hy - pts[0].y;
    const ax = C0.x + ddx * vX.x + ddy * vY.x;
    const ay = C0.y + ddx * vX.y + ddy * vY.y;
    const az = C0.z + ddx * vX.z + ddy * vY.z;
    atoms.push({element: 'H', x: parseFloat(ax.toFixed(2)), y: parseFloat(ay.toFixed(2)), z: parseFloat(az.toFixed(2))});
}

console.log(JSON.stringify(atoms, null, 2));

