const tet = 109.5 * Math.PI / 180;
const lCC = 1.54;
const lCH = 1.09;

const atoms = [];
const add = (el, x, y, z) => atoms.push({ el, x, y, z });

// Zig-zag backbone along X.
// C1
add('C', 0, 0, 0);
add('H', 0, -lCH * Math.sin(tet/2), lCH * Math.cos(tet/2));
add('H', 0, -lCH * Math.sin(tet/2), -lCH * Math.cos(tet/2));

// C2
let c2x = lCC * Math.sin(tet/2);
let c2y = lCC * Math.cos(tet/2);
add('C', c2x, c2y, 0);
add('H', c2x, c2y + lCH * Math.sin(tet/2), -lCH * Math.cos(tet/2)); // H pointing back

// Ph1 pointing forward
// To avoid overlap, let's put it on the +Z side.
let ph1_cx = c2x;
let ph1_cy = c2y + lCH * Math.sin(tet/2); // slightly up
let ph1_cz = lCC * Math.cos(tet/2); // forward

// Actually, let's just make the Ph ring flat in the XY plane or YZ plane.
// If backbone is in XY plane, substituents are in Z direction.
// C1 (0,0,0)
// C2 (1.26, 0.89, 0)
// C3 (2.52, 0, 0)
// C4 (3.78, 0.89, 0)

// H on C1:
// (0, -0.63, 0.89) and (0, -0.63, -0.89)

// For C2 (1.26, 0.89, 0):
// H pointing -Z: (1.26, 1.52, -0.89)
// Ph pointing +Z: attach to (1.26, 1.52, 1.50)
// Benzene ring center at (1.26, 1.52, 2.90) (radius 1.40)
// The hexagon is in the X-Z plane? No, if it's in X-Z plane, it's flat.
// Let's write out the atoms.

