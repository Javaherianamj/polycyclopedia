const center = {x: 0, y: 2.39, z: 1.99};
const radius = 1.4;

// The ring should be flat, maybe in a plane. Let's make it rotated so it's visible.
// Let the normal vector of the ring be along X-axis. So the ring is in the YZ plane.
// C_p1 is at (0, 1.4, 1.0).
// Center is (0, 2.39, 1.99).
// Vector from center to C_p1 is (0, -0.99, -0.99).
// Perpendicular vector in YZ plane: (0, 0.99, -0.99).

const v1 = {x: 0, y: -0.99, z: -0.99};
const v2 = {x: 1.4, y: 0, z: 0}; // Let's make it perpendicular to YZ plane so it spreads in X

const atoms = [];
for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    
    // C_p1 is at angle 0.
    const x = center.x + v1.x * c + v2.x * s;
    const y = center.y + v1.y * c + v2.y * s;
    const z = center.z + v1.z * c + v2.z * s;
    atoms.push({element: 'C', x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), z: parseFloat(z.toFixed(2))});
    
    // Hydrogen
    // H is at 1.08 distance from C, outward from center
    if (i !== 0) { // C_p1 doesn't have H, it's attached to backbone
        const hx = center.x + (v1.x * c + v2.x * s) * (1.0 + 1.08/1.4);
        const hy = center.y + (v1.y * c + v2.y * s) * (1.0 + 1.08/1.4);
        const hz = center.z + (v1.z * c + v2.z * s) * (1.0 + 1.08/1.4);
        atoms.push({element: 'H', x: parseFloat(hx.toFixed(2)), y: parseFloat(hy.toFixed(2)), z: parseFloat(hz.toFixed(2))});
    }
}

console.log(JSON.stringify(atoms, null, 2));
