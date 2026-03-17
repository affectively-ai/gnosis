import { useEffect, useRef, useCallback, useState } from 'react';
export function useCursorTracking({ sendCursor }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastSentRef = useRef(0);
  // Throttle to 30hz
  const THROTTLE_MS = 33;
  const handleMouseMove = useCallback(
    (event) => {
      const now = Date.now();
      // Update local position immediately (for smooth local cursor if needed)
      const viewportWidth = Math.max(window.innerWidth, 1);
      const viewportHeight = Math.max(window.innerHeight, 1);
      const x = event.clientX / viewportWidth;
      const y = event.clientY / viewportHeight;
      setPosition({ x, y });
      // Throttle network sends
      if (now - lastSentRef.current < THROTTLE_MS) return;
      lastSentRef.current = now;
      // Send normalized position (0-1)
      sendCursor(x, y, {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        viewportWidth,
        viewportHeight,
      });
    },
    [sendCursor]
  );
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);
  return { position };
}
//# sourceMappingURL=useCursorTracking.js.map
