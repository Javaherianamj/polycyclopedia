function makeRing(cx, cy, rot=0) {
    let pts = [];
    let d = [1.33, 1.45, 1.33, 1.45, 1.33, 1.45];
    let angle = rot;
    let x = cx, y = cy;
    pts.push({x, y, z: 0});
    // internal angles of a hexagon with alternating sides are not 120.
    // By symmetry, they are 120! 
    for (let i=0; i<5; i++) {
        x += d[i] * Math.cos(angle);
        y += d[i] * Math.sin(angle);
        pts.push({x, y, z:0});
        angle += (Math.PI - (120 * Math.PI / 180));
    }
    return pts;
}

const ring = makeRing(0, 0, 0);
for(let p of ring) {
    console.log(`{ element: 'C', x: ${p.x.toFixed(2)}, y: ${p.y.toFixed(2)}, z: 0 },`);
}
// check distances
for (let i=0; i<6; i++) {
    let p1 = ring[i];
    let p2 = ring[(i+1)%6];
    let dist = Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
    console.log(`d(${i},${(i+1)%6}) = ${dist.toFixed(3)}`);
}
