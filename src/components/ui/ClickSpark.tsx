'use client';

import { useRef, useCallback, useEffect } from 'react';

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

const DURATION = 400;
const SPARK_COUNT = 8;
const COLOR = '#00C3D8';

export default function ClickSpark({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    sparksRef.current = sparksRef.current.filter((s) => now - s.startTime < DURATION);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (sparksRef.current.length === 0) {
      rafRef.current = 0;
      return;
    }

    for (const spark of sparksRef.current) {
      const progress = (now - spark.startTime) / DURATION;
      const dist = 12 + progress * 22;
      const alpha = 1 - progress;
      const x1 = spark.x + Math.cos(spark.angle) * dist * 0.4;
      const y1 = spark.y + Math.sin(spark.angle) * dist * 0.4;
      const x2 = spark.x + Math.cos(spark.angle) * dist;
      const y2 = spark.y + Math.sin(spark.angle) * dist;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = COLOR;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const now = performance.now();
      for (let i = 0; i < SPARK_COUNT; i++) {
        sparksRef.current.push({
          x: e.clientX,
          y: e.clientY,
          angle: (Math.PI * 2 * i) / SPARK_COUNT,
          startTime: now,
        });
      }
      if (!rafRef.current) rafRef.current = requestAnimationFrame(animate);
    },
    [animate],
  );

  return (
    <div onClick={handleClick} className="contents">
      {children}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-50 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
