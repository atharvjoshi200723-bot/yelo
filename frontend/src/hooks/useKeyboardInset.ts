import { useEffect, useState } from 'react';

/**
 * Pixels hidden below the visible area when a mobile on-screen keyboard (or any
 * browser chrome) covers the layout viewport.
 *
 * Chrome/Android honour `interactive-widget=resizes-content`, which shrinks
 * window.innerHeight itself, so this returns 0 there. iOS Safari only resizes
 * the visual viewport, so bottom-anchored sheets would otherwise sit underneath
 * the keyboard — they add this as bottom padding to stay reachable.
 */
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const hidden = window.innerHeight - (viewport.height + viewport.offsetTop);
      setInset(hidden > 1 ? Math.round(hidden) : 0);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}
