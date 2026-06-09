/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Target, Globe, ShieldCheck, Database, Loader2 } from 'lucide-react';

interface PreloaderModalProps {
  progress: number;
  currentTask: string;
  languagesProcessed: string[];
}

export default function PreloaderModal({ progress, currentTask, languagesProcessed }: PreloaderModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black"
    >
      {/* Moving Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ 
             backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 215, 0, 0.15) 1px, transparent 0)',
             backgroundSize: '40px 40px' 
           }} 
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center text-center space-y-8">
          
          {/* Main Icon Group */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
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
              Sincronização Ativa
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium">
              Whitelisting Database Contents
            </p>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full space-y-4">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-neon-yellow shadow-[0_0_15px_rgba(255,215,0,0.5)]"
              />
            </div>
            
            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
              <span className="text-neon-yellow">{currentTask}</span>
              <span className="text-slate-500">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Language Checklist */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              { id: 'pt', label: 'Português' },
              { id: 'en', label: 'English' },
              { id: 'es', label: 'Español' }
            ].map((lang) => {
              const isProcessed = languagesProcessed.includes(lang.id);
              return (
                <div key={lang.id} className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all duration-500 ${
                  isProcessed 
                    ? 'bg-neon-yellow/10 border-neon-yellow/30' 
                    : 'bg-white/5 border-white/10 opacity-40'
                }`}>
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

          {/* Activity Logs */}
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
                    &gt; {currentTask === "Finalizando" ? "Handshake concluído. Iniciando portal..." : `Fetching ${currentTask.toLowerCase()}...`}
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
