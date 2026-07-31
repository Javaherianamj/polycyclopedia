const atoms = [];
const add = (element, x, y, z) => atoms.push({ element, x: Math.round(x*100)/100, y: Math.round(y*100)/100, z: Math.round(z*100)/100 });

// We want 1 styrene unit (1 ring).
// To avoid overlap when repeated (since it will be isotactic if we just repeat it translationally), 
// we increase the x-distance between atoms.
const scale_x = 1.5; // Stretch the backbone to avoid overlap of rings

// Backbone
// C1 (CH2)
const cx1 = -1.27 * scale_x;
const cy1 = -0.4;
const cz1 = 0;
add('C', cx1, cy1, cz1);

// C2 (CH)
const cx2 = 0;
const cy2 = 0.4;
const cz2 = 0;
add('C', cx2, cy2, cz2);

// H on C1
add('H', cx1, cy1 - 0.6, 0.89);
add('H', cx1, cy1 - 0.6, -0.89);

// H on C2
add('H', cx2, cy2 + 0.6, -0.89); // H on -Z

// Ph on C2
const ph_sign = 1; // +Z
const phC1_x = cx2;
const phC1_y = cy2 + 1.0;
const phC1_z = ph_sign * 1.0;

const dCenter = 1.4;
const v_len = Math.sqrt(1.0 + 1.0);
const v = { x: 0, y: 1.0 / v_len, z: ph_sign * 1.0 / v_len };
// Actually user asked for 45 degree angle for monomer.
// We'll just generate the chain version first.
const u = { x: 1, y: 0, z: 0 };

const center_x = phC1_x + 1.4 * v.x;
const center_y = phC1_y + 1.4 * v.y;
const center_z = phC1_z + 1.4 * v.z;

const ring_atoms = [];
const r = 1.4;
for (let i = 0; i < 6; i++) {
    const angle = i * 60 * Math.PI / 180;
    const rx = center_x - r * Math.cos(angle) * v.x + r * Math.sin(angle) * u.x;
    const ry = center_y - r * Math.cos(angle) * v.y + r * Math.sin(angle) * u.y;
    const rz = center_z - r * Math.cos(angle) * v.z + r * Math.sin(angle) * u.z;
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
        const hz = center_z + (r + 1.0) * (ring_atoms[i].z - center_z) / r;
        add('H', hx, hy, hz);
    }
}

console.log("UNIT_WIDTH:", 2.54 * scale_x);
console.log(JSON.stringify(atoms, null, 2));

