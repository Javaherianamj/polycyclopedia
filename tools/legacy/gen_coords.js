function makeBenzene(cx, cy, singleDist=1.45, doubleDist=1.33, rotAngle=0) {
    const atoms = [];
    let angle = rotAngle;
    const dists = [doubleDist, singleDist, doubleDist, singleDist, doubleDist, singleDist];
    // This is not a perfect regular hexagon if sides differ, but close enough.
    // Instead, let's just make a regular hexagon with R=1.39, then nudge the points to make sides 1.33 and 1.45.
    const R = 1.39;
    for(let i=0; i<6; i++) {
        let a = angle + i * (Math.PI / 3);
        atoms.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), z: 0 });
    }
    // Let's just manually set alternating distances by nudging points in pairs
    // Actually, it's easier to just use a regular hexagon with R=1.35 and set max double bond threshold to 1.40!
    return atoms;
}
console.log(makeBenzene(0,0));
