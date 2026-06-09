/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Globe, ShieldCheck, Database, Target } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface PreloaderModalProps {
  progress: number;
  currentTask: string;
  languagesProcessed: string[];
}

export default function PreloaderModal({ progress, currentTask, languagesProcessed }: PreloaderModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const stars: { x: number; y: number; z: number; size: number; color: string; opacity: number; pulse: number }[] = [];
    const numStars = 1800;
    const colors = ['#ffffff', '#FFD700', '#FFFACD', '#F0E68C', '#ffffff', '#FFD700'];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 8000,
        y: (Math.random() - 0.5) * 8000,
        z: Math.random() * 2000,
        size: Math.random() * 3.8 + 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.7 + 0.3,
        pulse: Math.random() * 0.015 + 0.005
      });
    }

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5
      };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const draw = () => {
      ctx.fillStyle = '#010208';
      ctx.fillRect(0, 0, w, h);

      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
      grad.addColorStop(0, 'rgba(15, 15, 2, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      stars.forEach((star) => {
        star.z -= 0.5;
        if (star.z <= 0) star.z = 2000;

        const k = 400 / star.z;
        const px = star.x * k + w / 2;
        const py = star.y * k + h / 2;
        const mx = mouseRef.current.x * 50 * k;
        const my = mouseRef.current.y * 50 * k;

        star.opacity += star.pulse;
        if (star.opacity > 1 || star.opacity < 0.3) star.pulse *= -1;

        if (px >= -100 && px <= w + 100 && py >= -100 && py <= h + 100) {
          const size = star.size * k;
          ctx.beginPath();
          ctx.arc(px + mx, py + my, size, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = star.opacity;

          if (size > 2.2) {
            ctx.shadowBlur = 12 * k;
            ctx.shadowColor = star.color;
          }

          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const logLine = currentTask === 'Finalizando'
    ? 'Handshake concluído. Iniciando portal...'
    : `Fetching ${currentTask.toLowerCase()}...`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#010208] overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[180px] pointer-events-none z-[1]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-4 border-2 border-dashed border-neon-yellow/20 rounded-full"
            />
            <div className="w-20 h-20 bg-neon-yellow/10 rounded-full flex items-center justify-center border border-neon-yellow/30 relative overflow-hidden">
              <motion.div
                animate={{
                  y: [-10, 10, -10],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-neon-yellow/10 blur-xl"
              />
              <Target className="w-10 h-10 text-neon-yellow" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-widest uppercase">
              Sincronizando
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium">
              Whitelisting Database Contents
            </p>
          </div>

          <div className="w-full space-y-4">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-neon-yellow shadow-[0_0_15px_rgba(255,215,0,0.5)]"
              />
            </div>

            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
              <span className="text-neon-yellow">{currentTask || 'Sincronizando'}</span>
              <span className="text-slate-500">{Math.round(progress)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              { id: 'pt', label: 'Português' },
              { id: 'en', label: 'English' },
              { id: 'es', label: 'Español' }
            ].map((lang) => {
              const isProcessed = languagesProcessed.includes(lang.id);
              return (
                <div
                  key={lang.id}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all duration-500 ${
                    isProcessed
                      ? 'bg-neon-yellow/10 border-neon-yellow/30'
                      : 'bg-white/5 border-white/10 opacity-40'
                  }`}
                >
                  <Globe className={`w-4 h-4 ${isProcessed ? 'text-neon-yellow' : 'text-slate-500'}`} />
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${isProcessed ? 'text-white' : 'text-slate-500'}`}>
                    {lang.label}
                  </span>
                  {isProcessed && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <ShieldCheck className="w-3 h-3 text-neon-yellow shadow-glow" />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-left space-y-2 overflow-hidden h-24 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 text-[8px] font-mono text-neon-yellow opacity-70">
              <Database className="w-3 h-3" />
              <span>SECURE CONTENT HANDLER: ACTIVE</span>
            </div>
            <div className="space-y-1.5 pt-1">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={currentTask}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[9px] font-mono text-slate-400"
                >
                  &gt; {logLine}
                </motion.div>
              </AnimatePresence>
              <div className="text-[9px] font-mono text-slate-600">&gt; Allocating memory buffers...</div>
              <div className="text-[9px] font-mono text-slate-600">&gt; Verifying SSL handshake...</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
