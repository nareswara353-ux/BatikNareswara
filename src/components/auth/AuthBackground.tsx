'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

/**
 * Animated background component with floating batik-inspired geometric particles.
 * Uses canvas rendering for smooth 60fps animation without DOM overhead.
 */
export default function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  const initParticles = useCallback((width: number, height: number) => {
    const count = Math.floor((width * height) / 25000);
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 20 + 8,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.12 + 0.03,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.005,
      });
    }

    particlesRef.current = particles;
  }, []);

  const drawBatikMotif = useCallback(
    (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      // Diamond shape — inspired by traditional batik kawung motif
      const half = p.size / 2;
      ctx.beginPath();
      ctx.moveTo(0, -half);
      ctx.lineTo(half, 0);
      ctx.lineTo(0, half);
      ctx.lineTo(-half, 0);
      ctx.closePath();

      ctx.strokeStyle = '#D2691E';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(0, 0, half * 0.35, 0, Math.PI * 2);
      ctx.strokeStyle = '#B8860B';
      ctx.stroke();

      // Decorative dots at cardinal points
      const dotSize = half * 0.12;
      const offsets: [number, number][] = [
        [0, -half * 0.6],
        [half * 0.6, 0],
        [0, half * 0.6],
        [-half * 0.6, 0],
      ];
      ctx.fillStyle = '#D2691E';
      for (const [ox, oy] of offsets) {
        ctx.beginPath();
        ctx.arc(ox, oy, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initParticles(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Wrap around screen edges
        if (p.x < -p.size) p.x = w + p.size;
        if (p.x > w + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = h + p.size;
        if (p.y > h + p.size) p.y = -p.size;

        drawBatikMotif(ctx, p);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initParticles, drawBatikMotif]);

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
