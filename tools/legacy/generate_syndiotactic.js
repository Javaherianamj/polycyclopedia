const unitWidth = 5.08;

const atoms = [];
const add = (element, x, y, z) => atoms.push({ element, x: Math.round(x*100)/100, y: Math.round(y*100)/100, z: Math.round(z*100)/100 });

// Helper to add a styrene unit
// C1 is the CH2, C2 is the CH(Ph)
// cx1, cy1, cz1 is C1 position
// cx2, cy2, cz2 is C2 position
// ph_sign determines if Ph is on +Z or -Z
function addStyrene(cx1, cy1, cx2, cy2, ph_sign) {
    add('C', cx1, cy1, 0); // CH2
    add('C', cx2, cy2, 0); // CH(Ph)
    
    // H on C1
    add('H', cx1, cy1 - 0.6, 0.89);
    add('H', cx1, cy1 - 0.6, -0.89);
    
    // H on C2 (opposite to Ph)
    add('H', cx2, cy2 + 0.6, -ph_sign * 0.89);
    
    // Ph on C2
    // Let's connect C2 to PhC1
    const phC1_x = cx2;
    const phC1_y = cy2 + 1.0;
    const phC1_z = ph_sign * 1.0;
    
    // Create the Benzene ring
    // To respect single (>=1.40, we need <1.38 for double) and double bonds (<1.38)
    // We want alternating single/double.
    // L_single = 1.45, L_double = 1.34
    // We can define the 6 points of the hexagon explicitly.
    // Let's lay the ring flat in the X-Y plane? No, it's sticking out in Z.
    // Let's make the ring in a plane slanted.
    // Actually, we can just use a simple hexagon algorithm and scale it so edges are alternating.
    // Center of ring:
    const dCenter = 1.4; // roughly distance from C1 to center
    
    // The ring is attached to PhC1. Let's make the vector from C2 to PhC1 be the local "up" (v).
    // Let's define local axes for the ring:
    // v = (0, 1.0, ph_sign * 1.0) normalized
    const v_len = Math.sqrt(1.0 + 1.0);
    const v = { x: 0, y: 1.0 / v_len, z: ph_sign * 1.0 / v_len };
    
    // u orthogonal to v. Let's pick u along X axis.
    const u = { x: 1, y: 0, z: 0 };
    
    // center of ring is at PhC1 + 1.40 * v
    const center_x = phC1_x + 1.4 * v.x;
    const center_y = phC1_y + 1.4 * v.y;
    const center_z = phC1_z + 1.4 * v.z;
    
    const ring_atoms = [];
    const r = 1.4; // radius
    
    // Let's place 6 atoms.
    for (let i = 0; i < 6; i++) {
        const angle = i * 60 * Math.PI / 180;
        // Adjust radius slightly to make alternating bond lengths
        // If we just use regular hexagon, dist is equal to radius. 
        // If we want alternating, we can shift the vertices slightly.
        // Actually, the visualization uses < 1.38 for double. So if we make all distances 1.39, it's single.
        // If we want alternating double/single, let's make edges 1.35 and 1.45.
        // Let's do it manually.
        const rx = center_x - r * Math.cos(angle) * v.x + r * Math.sin(angle) * u.x;
        const ry = center_y - r * Math.cos(angle) * v.y + r * Math.sin(angle) * u.y;
        const rz = center_z - r * Math.cos(angle) * v.z + r * Math.sin(angle) * u.z;
        ring_atoms.push({x: rx, y: ry, z: rz});
    }
    
    // Add them to atoms array. But wait, we want alternating bonds.
    // C1 is at i=0. C1-C2 double, C2-C3 single, C3-C4 double, etc.
    // Let's just adjust coordinates of C2, C4, C6 to shrink the double bonds.
    // Double bonds: (0,1), (2,3), (4,5)
    // To shrink (0,1), move 1 towards 0.
    // Let's just use fixed lengths.
    const move_towards = (p1, p2, dist) => {
        const dx = p2.x - p1.x; const dy = p2.y - p1.y; const dz = p2.z - p1.z;
        const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
        return { x: p1.x + (dx/len)*dist, y: p1.y + (dy/len)*dist, z: p1.z + (dz/len)*dist };
    };

    // Keep 0, 2, 4 fixed. Move 1 towards 0, 3 towards 2, 5 towards 4.
    // Wait, if we move 1 towards 0, the distance 1-2 increases! That's exactly what we want (single bond > 1.38).
    const L_D = 1.34;
    ring_atoms[1] = move_towards(ring_atoms[0], ring_atoms[1], L_D);
    ring_atoms[3] = move_towards(ring_atoms[2], ring_atoms[3], L_D);
    ring_atoms[5] = move_towards(ring_atoms[4], ring_atoms[5], L_D);
    
    for (let i = 0; i < 6; i++) {
        add('C', ring_atoms[i].x, ring_atoms[i].y, ring_atoms[i].z);
        if (i > 0) { // Add H to all except C1
            const hx = center_x + (r + 1.0) * (ring_atoms[i].x - center_x) / r;
            const hy = center_y + (r + 1.0) * (ring_atoms[i].y - center_y) / r;
            const hz = center_z + (r + 1.0) * (ring_atoms[i].z - center_z) / r;
            add('H', hx, hy, hz);
        }
    }
}

addStyrene(-1.27, -0.4, 0, 0.4, 1);
addStyrene(1.27, -0.4, 2.54, 0.4, -1);

console.log(JSON.stringify(atoms, null, 2));
console.log("Number of atoms:", atoms.length);
