const fs = require('fs');
let content = fs.readFileSync('src/components/Hansen3DChart.tsx', 'utf8');

// replace the event imports
content = content.replace(/MouseEvent, WheelEvent } from 'react';/, "MouseEvent, WheelEvent, TouchEvent } from 'react';");

// add touch handlers
content = content.replace(/const handleMouseDown = \(e: MouseEvent\) => \{/g, `
  const handleTouchStart = (e: TouchEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - lastMousePos.x;
    const dy = e.touches[0].clientY - lastMousePos.y;
    
    setRotationZ(prev => prev + dx * 0.5);
    setRotationX(prev => Math.max(-80, Math.min(80, prev - dy * 0.5)));
    setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleMouseDown = (e: MouseEvent) => {`);

// add touch event listeners to the div
content = content.replace(/onMouseLeave=\{handleMouseUp\}/, `onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}`);

fs.writeFileSync('src/components/Hansen3DChart.tsx', content);
