import { useEffect, useRef, useState } from 'react';

/** Returns a ref to attach and whether the element has entered the
 * viewport at least once. Triggers only once (doesn't re-hide on
 * scroll away) — reveal animations should welcome you in, not
 * flicker every time you scroll past. */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
