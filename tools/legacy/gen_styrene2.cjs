const l_CC = 1.54;
const l_CH = 1.09;
const l_CarAr = 1.50;
const l_ArAr = 1.39;
const l_ArH = 1.09;

const tet = 109.5 * Math.PI / 180;
const tet_half = tet / 2;

const atoms = [];

// Helper to add atoms
function addAtoms(newAtoms) {
    newAtoms.forEach(a => {
        atoms.push({
            element: a.el,
            x: Math.round(a.x * 100) / 100,
            y: Math.round(a.y * 100) / 100,
            z: Math.round(a.z * 100) / 100
        });
    });
}

// Build syndiotactic PS chain, let's do 2 or 4 backbone carbons (1 or 2 repeating units)
// Let's do 4 backbone carbons: C1-C2-C3-C4
// C1: CH2
// C2: CH(Ph) - Ph up
// C3: CH2
// C4: CH(Ph) - Ph down

// Backbone positions
const y0 = 0;
const y1 = l_CC * Math.cos(tet_half);

let currentX = 0;

for (let i = 0; i < 4; i++) {
    const isUp = (i % 2 === 1); // C2, C4
    const isPh = (i % 2 === 1);
    const phSign = (i === 1) ? 1 : -1; // up for C2, down for C4

    const x = currentX;
    const y = isUp ? y1 : y0;
    const z = 0;
    addAtoms([{el: 'C', x, y, z}]);

    if (!isPh) {
        // CH2
        addAtoms([
            {el: 'H', x, y: isUp ? y + l_CH*Math.cos(tet_half) : y - l_CH*Math.cos(tet_half), z: l_CH*Math.sin(tet_half)},
            {el: 'H', x, y: isUp ? y + l_CH*Math.cos(tet_half) : y - l_CH*Math.cos(tet_half), z: -l_CH*Math.sin(tet_half)}
        ]);
    } else {
        // CH(Ph)
        // H is on one side, Ph is on the other.
        // For syndiotactic, the Ph alternates sides. 
        // Ph in +z direction for C2, -z direction for C4
        const phZ = phSign * Math.sin(tet_half);
        const hZ = -phSign * Math.sin(tet_half);
        const vecY = isUp ? Math.cos(tet_half) : -Math.cos(tet_half);

        addAtoms([
            {el: 'H', x, y: y + l_CH*vecY, z: l_CH * hZ}
        ]);

        // Phenyl ring
        const phCx = x;
        const phCy = y + l_CarAr*vecY;
        const phCz = l_CarAr * phZ;
        
        // Phenyl ring center is further along this vector.
        // It's a hexagon.
        // Let's define the local frame of the benzene ring.
        // It's attached to C2 at phC1. 
        // bond vector: { x: 0, y: vecY, z: phZ } normalized.
        // We want the ring face to be roughly parallel to the x-axis to avoid hitting backbone.
        // So the normal of the ring is roughly in the X direction.
        
        const ring_u = { x: 0, y: vecY, z: phZ }; // From C2 to PhC1
        const ring_v = { x: 1, y: 0, z: 0 };
        // Actually, just construct a hexagon in the Y-Z plane and rotate it, or X-Y plane...
        // Ring atoms relative to PhC1:
        // C1 is at origin of ring frame.
        // Center of ring is at distance l_ArAr from C1. (Wait, side is l_ArAr, center to vertex is l_ArAr)
        const dCenter = l_ArAr;
        const centerX = phCx + dCenter * ring_u.x;
        const centerY = phCy + dCenter * ring_u.y;
        const centerZ = phCz + dCenter * ring_u.z;

        // Angle 0 is at PhC1.
        for (let j=0; j<6; j++) {
            const angle = j * 60 * Math.PI / 180;
            // vector from center
            // ring_u points from PhC1 to center? No, C1 is at the edge. 
            // Better to construct relative to center.
            const vx = -Math.cos(angle); // so j=0 is C1
            const vy = Math.sin(angle); // in the orthogonal direction
            
            // local to global:
            // X-axis of local is -ring_u.
            // Y-axis of local is ring_v.
            const rx = centerX + l_ArAr * (-vx * ring_u.x + vy * ring_v.x);
            const ry = centerY + l_ArAr * (-vx * ring_u.y + vy * ring_v.y);
            const rz = centerZ + l_ArAr * (-vx * ring_u.z + vy * ring_v.z);
            
            addAtoms([{el: 'C', x: rx, y: ry, z: rz}]);
            
            if (j > 0) {
                // Add H
                const hx = centerX + (l_ArAr + l_ArH) * (-vx * ring_u.x + vy * ring_v.x);
                const hy = centerY + (l_ArAr + l_ArH) * (-vx * ring_u.y + vy * ring_v.y);
                const hz = centerZ + (l_ArAr + l_ArH) * (-vx * ring_u.z + vy * ring_v.z);
                addAtoms([{el: 'H', x: hx, y: hy, z: hz}]);
            }
        }
    }
    currentX += l_CC * Math.sin(tet_half);
}

console.log(JSON.stringify(atoms, null, 2));
