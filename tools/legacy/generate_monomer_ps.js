const atoms = [];
const add = (element, x, y, z) => atoms.push({ element, x: Math.round(x*100)/100, y: Math.round(y*100)/100, z: Math.round(z*100)/100 });

// C1 (CH2)
const cx1 = -1.0;
const cy1 = 0.0;
add('C', cx1, cy1, 0);

// C2 (CH)
const cx2 = 0.34;
const cy2 = 0.0;
add('C', cx2, cy2, 0);

// H on C1 (120 deg)
add('H', cx1 - 0.54 * 1.09, cy1 + 0.86 * 1.09, 0);
add('H', cx1 - 0.54 * 1.09, cy1 - 0.86 * 1.09, 0);

// H on C2 (bottom right, 120 deg from double bond)
add('H', cx2 + 0.5 * 1.09, cy2 - 0.86 * 1.09, 0);

// Ph on C2 (top right, 120 deg from double bond)
// C2 to Ph center direction
const ph_dir = { x: 0.5, y: 0.866, z: 0 };
const l_CC_single = 1.45;

const phC1_x = cx2 + l_CC_single * ph_dir.x;
const phC1_y = cy2 + l_CC_single * ph_dir.y;
const phC1_z = 0;

const dCenter = 1.4;
const v = ph_dir;
const u = { x: -v.y, y: v.x, z: 0 };

const center_x = phC1_x + dCenter * v.x;
const center_y = phC1_y + dCenter * v.y;
const center_z = 0;

const ring_atoms = [];
const r = 1.4;
for (let i = 0; i < 6; i++) {
    const angle = i * 60 * Math.PI / 180;
    // C1 is at i=0 (angle 0)
    // -v is direction from center to C1.
    const rx = center_x - r * Math.cos(angle) * v.x + r * Math.sin(angle) * u.x;
    const ry = center_y - r * Math.cos(angle) * v.y + r * Math.sin(angle) * u.y;
    const rz = 0;
    ring_atoms.push({x: rx, y: ry, z: rz});
}

const move_towards = (p1, p2, dist) => {
    const dx = p2.x - p1.x; const dy = p2.y - p1.y; const dz = p2.z - p1.z;
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
    return { x: p1.x + (dx/len)*dist, y: p1.y + (dy/len)*dist, z: p1.z + (dz/len)*dist };
};

const L_D = 1.34;
ring_atoms[1] = move_towards(ring_atoms[0], ring_atoms[1], L_D);
ring_atoms[3] = move_towards(ring_atoms[2], ring_atoms[3], L_D);
ring_atoms[5] = move_towards(ring_atoms[4], ring_atoms[5], L_D);

for (let i = 0; i < 6; i++) {
    add('C', ring_atoms[i].x, ring_atoms[i].y, ring_atoms[i].z);
    if (i > 0) { 
        const hx = center_x + (r + 1.0) * (ring_atoms[i].x - center_x) / r;
        const hy = center_y + (r + 1.0) * (ring_atoms[i].y - center_y) / r;
        const hz = 0;
        add('H', hx, hy, hz);
    }
}

console.log(JSON.stringify(atoms, null, 2));

