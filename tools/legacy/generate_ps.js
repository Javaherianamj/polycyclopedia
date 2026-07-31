const fs = require('fs');

function rotateVec(v, axis, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    if (axis === 'z') {
        return { x: v.x*cos - v.y*sin, y: v.x*sin + v.y*cos, z: v.z };
    }
    if (axis === 'y') {
        return { x: v.x*cos + v.z*sin, y: v.y, z: -v.x*sin + v.z*cos };
    }
    if (axis === 'x') {
        return { x: v.x, y: v.y*cos - v.z*sin, z: v.y*sin + v.z*cos };
    }
}

const atoms = [];

// Let's create a syndiotactic polystyrene chain of 2 repeating units to see how it looks.
// The user asks to rewrite the repeating unit of Polystyrene in polymersData.
// So we just need ONE repeating unit, or maybe a few. The atoms3d array is usually just one or a few monomers.
// Let's make 1 repeating unit, but with benzene.
// PE backbone: C1 (0,0,0), C2 (1.52, 0, 0) - wait, this is linear, not zig-zag.
// Let's use zig zag.
const l_CC = 1.52;
const l_CH = 1.09;
const l_CarAr = 1.50; // C-C bond to phenyl
const l_ArAr = 1.40; // Benzene C-C
const l_ArH = 1.09; // Benzene C-H

const ang_tetra = 109.5 * Math.PI / 180;
const ang_hex = 120 * Math.PI / 180;

// C1 of backbone
atoms.push({ element: 'C', x: 0, y: 0, z: 0 });
// C2 of backbone
atoms.push({ element: 'C', x: l_CC * Math.sin(ang_tetra/2), y: l_CC * Math.cos(ang_tetra/2), z: 0 });

// H on C1
atoms.push({ element: 'H', x: 0, y: -l_CH * Math.cos(ang_tetra/2), z: l_CH * Math.sin(ang_tetra/2) });
atoms.push({ element: 'H', x: 0, y: -l_CH * Math.cos(ang_tetra/2), z: -l_CH * Math.sin(ang_tetra/2) });

// H on C2
atoms.push({ element: 'H', x: l_CC * Math.sin(ang_tetra/2), y: l_CC * Math.cos(ang_tetra/2) + l_CH * Math.cos(ang_tetra/2), z: -l_CH * Math.sin(ang_tetra/2) });

// Phenyl on C2 (replacing the other H)
// It should go in the direction of (0, l_CH * Math.cos(ang_tetra/2), l_CH * Math.sin(ang_tetra/2)) relative to C2
const phenyl_dir = { x: 0, y: Math.cos(ang_tetra/2), z: Math.sin(ang_tetra/2) };

const Ph_C1 = { 
    element: 'C', 
    x: l_CC * Math.sin(ang_tetra/2) + l_CarAr * phenyl_dir.x, 
    y: l_CC * Math.cos(ang_tetra/2) + l_CarAr * phenyl_dir.y, 
    z: l_CarAr * phenyl_dir.z 
};
atoms.push(Ph_C1);

// Generate benzene ring starting from Ph_C1
// The ring is in a plane. Let's make the plane perpendicular to the x-axis, or slanted.
// Let's define the local axes for the benzene ring.
// u is along the Ph_C1 - C2 bond.
const u = phenyl_dir;
// v is orthogonal to u. Let's pick v along x-axis.
const v = { x: 1, y: 0, z: 0 };
// w = u x v
const w = { x: u.y*v.z - u.z*v.y, y: u.z*v.x - u.x*v.z, z: u.x*v.y - u.y*v.x }; 
// w = { x: 0, y: Math.sin(ang_tetra/2), z: -Math.cos(ang_tetra/2) }

// Ring atoms
for (let i = 1; i < 6; i++) {
    const angle = i * 60 * Math.PI / 180;
    // Position of ring atom i relative to center of ring?
    // Wait, it's easier to just build it as a hexagon.
}

console.log(atoms);

