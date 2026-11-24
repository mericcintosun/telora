"use client";

import { useEffect, useState } from "react";

/** True when the visitor asks for reduced motion. False on the server, so server HTML is the still state. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True when the main pointer is coarse (touch), where a hover tilt has no meaning. */
export function useCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)");
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
