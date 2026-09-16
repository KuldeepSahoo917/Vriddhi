import { useEffect, useRef, useState } from 'react';

/** Animates a number from `from` to `to` over `durationMs` once the
 * hook mounts. No dependency on an animation library — this is a
 * single tweened number, not worth pulling in GSAP for. */
export function useCountUp(to: number, durationMs = 1400, from = 0): number {
  const [value, setValue] = useState(from);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let frame: number;

    function tick(timestamp: number) {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out cubic — starts fast, settles gently, matches a
      // "counting up" feel better than linear.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, durationMs, from]);

  return value;
}
