import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

export function AnimatedNumber({ value, className = '' }: AnimatedNumberProps) {
  const previousValue = useRef(value);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (previousValue.current === value) return;
    previousValue.current = value;
    setChanged(true);
    const timer = window.setTimeout(() => setChanged(false), 650);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <span className={`${className} ${changed ? 'animate-pulse text-secondary-200' : ''}`} aria-live="polite">
      {value.toLocaleString()}
    </span>
  );
}