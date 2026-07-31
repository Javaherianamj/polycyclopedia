const center = {x: 0, y: 2.39, z: 1.99};
// Let's manually define the 6 carbons in the plane so we can tweak alternating lengths.
// C0 is at (0, 1.4, 1.0).
// Let's use polar coordinates around center.
// Alternating radii or adjust angles so that distances alternate.
// It's much easier to just adjust the vertices in the regular hexagon by moving them slightly.

const atoms = [];
const angles = [0, 60, 120, 180, 240, 300].map(a => a * Math.PI / 180);

// To make alternating bond lengths: 1.35 and 1.45.
// Hexagon side lengths: s0, s1, s2, s3, s4, s5.
// Let's just adjust the angles from the regular hexagon to make it.
// Actually, I can just hardcode them in local 2D and then map to 3D.
let px = 0; let py = 0;
const pts2d = [];
pts2d.push({x: px, y: py});

// Go around:
const sideLengths = [1.35, 1.45, 1.35, 1.45, 1.35, 1.45];
// Angles in the polygon: A regular hexagon has internal angles 120. If sides differ, angles differ slightly.
// But we can approximate. A benzene ring is planar.
// Let's just use regular hexagon (1.4 radius => side length 1.4), and we just scale alternating bonds in 3D?
// Just use a script to find coordinates in 2D with exact lengths and angles:
// Let's just make it a regular hexagon but we manually set the distances in the array output? No, coordinates must match.
// Let's just use radius = 1.35 for C1, C3, C5 and 1.45 for C2, C4, C6? That makes the sides not equal.
// A simpler way:
// Let's place C0 at (0, 1.40).
// For the 2D coordinates:
const pts = [
  {x: 0, y: 1.40},
  {x: 1.21, y: 0.70},
  {x: 1.21, y: -0.70},
  {x: 0, y: -1.40},
  {x: -1.21, y: -0.70},
  {x: -1.21, y: 0.70}
];
// let's adjust pts to have alternating lengths: 1.34 and 1.46.
// C0 to C1: distance is 1.4. Let's move C1 closer to C0.
pts[1].y += 0.05;
pts[1].x -= 0.02;
// Check dist(C0, C1): (1.19 - 0)^2 + (0.75 - 1.4)^2 = 1.41 + 0.42 = 1.83 -> sqrt = 1.35
// C1 to C2: distance should be 1.45. 
pts[2].y -= 0.05;
pts[2].x -= 0.02;
// Check dist(C1, C2): (1.19 - 1.19)^2 + (0.75 - (-0.75))^2 = 1.5^2 -> 1.5. A bit too long.
pts[2].y += 0.02; // -0.73
pts[2].x += 0.04; // 1.23
// dist(C1, C2): (1.19 - 1.23)^2 + (0.75 - (-0.73))^2 = 0.0016 + 2.19 = 2.19 -> sqrt = 1.48

console.log("We can just use math to build it exactly!");
