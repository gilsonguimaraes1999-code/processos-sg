/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Database, Save, RotateCcw } from 'lucide-react';

interface ThreeDLogoProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  manualUrl?: string;
  onManualUrlChange?: (url: string) => void;
  onRetry?: () => void;
  diagnosticInfo?: {
    url: string;
    status: string | number;
    duration: string;
    timestamp: string;
    error?: string;
  } | null;
}

export default function ThreeDLogo({ 
  onLogin, 
  isLoading, 
  error,
  manualUrl = '',
  onManualUrlChange,
  onRetry,
  diagnosticInfo
}: ThreeDLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  
  const [step, setStep] = useState<'intro' | 'username' | 'password'>('intro');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleSaveConfig = () => {
    localStorage.setItem('manual_apps_script_url', manualUrl);
    setShowConfig(false);
    if (onRetry) onRetry();
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'username' && username.trim()) {
      setStep('password');
    } else if (step === 'password' && password.trim()) {
      onLogin(username, password);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const stars: { x: number; y: number; z: number; size: number; color: string; opacity: number; pulse: number }[] = [];
    const numStars = 1800;

    // Updated colors to White and Yellow as requested
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
      // Normalize mouse to -0.5 to 0.5
      mouseRef.current = { 
        x: (e.clientX / window.innerWidth) - 0.5, 
        y: (e.clientY / window.innerHeight) - 0.5 
      };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const draw = () => {
      ctx.fillStyle = "#010208";
      ctx.fillRect(0, 0, w, h);

      // Deep space gradient
      const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
      grad.addColorStop(0, 'rgba(15, 15, 2, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      stars.forEach(star => {
        // Subtle rotation and depth movement
        star.z -= 0.5;
        if (star.z <= 0) star.z = 2000;

        // Perspective projection
        const k = 400 / star.z;
        const px = star.x * k + w / 2;
        const py = star.y * k + h / 2;

        // Mouse influence (parallax)
        const mx = mouseRef.current.x * 50 * k;
        const my = mouseRef.current.y * 50 * k;

        // Twinkle effect
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#010208] overflow-hidden font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Decorative ambient yellow glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Static Logo Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="relative z-10"
      >
        <div className="relative">
          {/* Halo effects */}
          <div className="absolute inset-0 blur-[60px] bg-white/10 rounded-full scale-110 pointer-events-none" />
          <div className="absolute inset-0 blur-[40px] bg-yellow-400/10 rounded-full scale-90 pointer-events-none" />
          
          <img
            src="https://i.ibb.co/69s087d/image.png"
            alt="Logo"
            className="w-48 h-48 md:w-64 md:h-64 object-contain filter drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]"
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.div>

      {/* Interaction Area */}
      <div className="mt-16 w-full max-w-sm px-6 relative z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {step === 'intro' ? (
            <motion.button
              key="intro-btn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={() => setStep('username')}
              className="group relative w-full"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl blur opacity-20 group-hover:opacity-60 transition duration-500 animate-pulse" />
              <div className="relative w-full py-5 bg-black/80 rounded-xl border border-white/20 hover:border-yellow-400/50 flex items-center justify-center transition-all duration-300">
                <span className="text-white/80 group-hover:text-yellow-400 font-black uppercase tracking-[0.4em] text-xs">Acessar Portal</span>
              </div>
            </motion.button>
          ) : (
            <motion.form
              key="login-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleNextStep}
              className="w-full space-y-4"
            >
              <div className="relative group">
                <AnimatePresence mode="wait">
                  {step === 'username' ? (
                    <motion.div
                      key="user-input"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="relative"
                    >
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-yellow-400 transition-colors">
                        <User size={18} />
                      </div>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-12 py-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/50 transition-all font-medium"
                      />
                      <button
                        type="submit"
                        disabled={!username.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
                      >
                        <ArrowRight size={20} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pass-input"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="relative"
                    >
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-yellow-400 transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        autoFocus
                        type={showPassword ? "text" : "password"}
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-12 py-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-400/50 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-14 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-2"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button
                        type="submit"
                        disabled={!password.trim() || isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={20} />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <div className="flex flex-col items-center gap-3 mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-400 text-[10px] uppercase font-bold tracking-widest justify-center"
                  >
                    <AlertCircle size={12} />
                    {error}
                  </motion.div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onRetry?.()}
                      className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-white/60 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-colors"
                    >
                      <RotateCcw size={10} />
                      Tentar Novamente
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfig(!showConfig)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${showConfig ? 'bg-yellow-400 text-black' : 'glass text-yellow-400/60 hover:text-yellow-400 border border-yellow-400/20'}`}
                    >
                      <Database size={10} />
                      {showConfig ? 'Fechar' : 'Configurar URL'}
                    </button>
                    
                    {diagnosticInfo && (
                      <button
                        type="button"
                        onClick={() => setShowDiagnostics(!showDiagnostics)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${showDiagnostics ? 'bg-blue-400 text-black' : 'glass text-blue-400/60 hover:text-blue-400 border border-blue-400/20'}`}
                      >
                        {showDiagnostics ? 'Ocultar Diagnóstico' : 'Ver Diagnóstico'}
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {showDiagnostics && diagnosticInfo && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="w-full overflow-hidden"
                      >
                        <div className="p-4 bg-black/90 border border-blue-400/20 rounded-xl space-y-2 mt-2 font-mono text-[9px] leading-relaxed">
                          <p className="text-blue-400 font-bold uppercase mb-1 flex justify-between">
                            <span>Estado do Sistema</span>
                            <span className="opacity-50">{new Date(diagnosticInfo.timestamp).toLocaleTimeString()}</span>
                          </p>
                          <div className="space-y-1 text-white/70">
                            <p className="flex gap-2">
                              <span className="text-blue-400/50 w-16 shrink-0 underline">ENDPOINT:</span>
                              <span className="truncate">{diagnosticInfo.url}</span>
                            </p>
                            <p className="flex gap-2">
                              <span className="text-blue-400/50 w-16 shrink-0 underline">STATUS:</span>
                              <span className={typeof diagnosticInfo.status === 'number' && diagnosticInfo.status >= 400 ? 'text-red-400' : 'text-green-400'}>
                                {diagnosticInfo.status}
                              </span>
                            </p>
                            <p className="flex gap-2">
                              <span className="text-blue-400/50 w-16 shrink-0 underline">TEMPO:</span>
                              <span>{diagnosticInfo.duration}</span>
                            </p>
                            {diagnosticInfo.error && (
                              <p className="flex gap-2 text-red-300 mt-2 bg-red-500/10 p-1 rounded">
                                <span className="text-red-400 font-bold w-16 shrink-0 underline">ERRO:</span>
                                <span>{diagnosticInfo.error}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {showConfig && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="w-full overflow-hidden"
                      >
                        <div className="p-4 bg-black/60 border border-yellow-400/20 rounded-xl space-y-3 mt-2">
                          <label className="block text-[8px] uppercase font-bold text-slate-500 tracking-tighter">URL do Apps Script (Override)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={manualUrl}
                              onChange={(e) => onManualUrlChange?.(e.target.value)}
                              placeholder="https://script.google.com/..."
                              className="flex-1 bg-black/80 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white focus:border-yellow-400/50 outline-none transition-colors"
                            />
                            <button
                              type="button"
                              onClick={handleSaveConfig}
                              className="px-3 bg-yellow-400 text-black rounded-lg hover:scale-105 transition-transform"
                            >
                              <Save size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {step === 'password' && !isLoading && (
                <button
                  type="button"
                  onClick={() => setStep('username')}
                  className="text-white/40 hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors w-full text-center"
                >
                  Voltar para Usuário
                </button>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
