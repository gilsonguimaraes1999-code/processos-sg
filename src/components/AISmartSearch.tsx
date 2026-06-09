import React, { useState } from 'react';
import { Sparkles, X, MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations, Tutorial } from '../types';

interface AISmartSearchProps {
  lang: Language;
  onTutorialClick: (tutorial: Tutorial) => void;
  allTutorials: Tutorial[];
}

export default function AISmartSearch({ lang, onTutorialClick, allTutorials }: AISmartSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<{ tutorialId: string; reason: string; confidence: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = translations[lang];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('portal_auth_token') ? { Authorization: `Bearer ${localStorage.getItem('portal_auth_token')}` } : {})
        },
        body: JSON.stringify({ query, lang }),
      });

      if (!response.ok) throw new Error('Falha na busca inteligente');

      const data = await response.json();
      if (data.tutorialId) {
        setResult(data);
      } else {
        setError('Não encontrei um tutorial específico para sua dúvida. Tente ser mais específico.');
      }
    } catch (err) {
      setError('Erro ao processar sua pergunta. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const foundTutorial = result ? allTutorials.find(t => t.id === result.tutorialId) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-5 py-2 bg-neon-yellow text-slate-950 rounded-lg font-black text-[10px] uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] hover:scale-105 active:scale-95 transition-all group whitespace-nowrap"
      >
        <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
        <span>IA Assistente</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-matte rounded-2xl p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2 text-neon-yellow">
                  <MessageSquare size={20} />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em]">Assistente de Processos</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSearch} className="relative mb-6">
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: Quero fazer farm ativo, como faço?"
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-4 pr-12 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neon-yellow/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-2 p-2 bg-neon-yellow text-slate-950 rounded-lg hover:bg-white transition-colors"
                >
                  {isSearching ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                </button>
              </form>

              {isSearching && (
                <div className="flex flex-col items-center py-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-neon-yellow/10 flex items-center justify-center">
                    <Sparkles className="text-neon-yellow animate-pulse" />
                  </div>
                  <p className="text-xs text-slate-400 animate-pulse font-medium">Analisando sua dúvida...</p>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center"
                >
                  {error}
                </motion.div>
              )}

              {result && foundTutorial && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Tutorial Sugerido</div>
                  
                  <div 
                    onClick={() => {
                      onTutorialClick(foundTutorial);
                      setIsOpen(false);
                    }}
                    className="group bg-neon-yellow/5 border border-neon-yellow/30 p-4 rounded-xl hover:bg-neon-yellow/10 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-neon-yellow transition-colors">{foundTutorial.title}</h4>
                      <span className="text-[9px] bg-neon-yellow text-slate-950 px-2 py-0.5 rounded font-black uppercase">{foundTutorial.category}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 italic">"{result.reason}"</p>
                  </div>

                  <button
                    onClick={() => {
                      onTutorialClick(foundTutorial);
                      setIsOpen(false);
                    }}
                    className="w-full py-3 bg-neon-yellow text-slate-950 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white transition-colors"
                  >
                    Abrir Tutorial
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
