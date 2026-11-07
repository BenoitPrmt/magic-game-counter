'use client';
import { useEffect, useRef } from 'react';
export function HoldButton({ children, label, onStep, disabled }: { children: React.ReactNode; label: string; onStep: () => void; disabled?: boolean }) {
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const held = useRef(false);
  function stop() { if(delay.current) clearTimeout(delay.current); if(interval.current) clearInterval(interval.current); delay.current = null; interval.current = null; }
  useEffect(() => {
    const cancel = () => stop();
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', cancel);
    return () => { stop(); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', cancel); };
  }, []);
  return <button type="button" className="life-button" disabled={disabled} aria-label={label}
    onPointerDown={e => { if(e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); stop(); held.current = false; delay.current = setTimeout(() => { held.current = true; onStep(); interval.current = setInterval(onStep, 125); }, 420); }}
    onPointerUp={stop} onPointerCancel={() => { held.current=true;stop(); }} onLostPointerCapture={stop}
    onClick={() => { if (!held.current) onStep(); held.current = false; }} onContextMenu={e=>e.preventDefault()}>{children}</button>;
}
