"use client";

import { useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  suffix?: string;
}

export default function AnimatedCounter({ target, duration = 2, suffix = "+" }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = target;
    const totalDuration = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalDuration / end), 10);
    const step = Math.max(Math.floor(end / (totalDuration / incrementTime)), 1);

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target, duration, isInView]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}
