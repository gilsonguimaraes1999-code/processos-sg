/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Tag, Target, ListChecks, ExternalLink } from 'lucide-react';
import { Language, Tutorial, translations, City } from '../types';

interface TutorialCardProps {
  tutorial: Tutorial;
  lang: Language;
  key?: string | number;
}

export default function TutorialCard({ tutorial, lang }: TutorialCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const t = translations[lang];

  const renderSteps = (text: string) => {
    if (!text) return null;
    
    // Improved regex to catch images
    const urlRegex = /(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|svg|bmp)(?:\?[^\s]*)?)/gi;
    const stepRegex = /(Passo\s*\d+|PASSO\s*\d+)/gi;
    const highlightRegex = /(Passo\s*\d+|PASSO\s*\d+|(?:Exemplo|EXEMPLO)[^:\n]*)/gi;
    
    // Split into lines for structural processing
    const lines = text.split('\n');

    const combinedUrlRegex = /(https?:\/\/[^\s]+)/gi;
    const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url);

    return lines.map((line, lineIdx) => {
      let content = line.trim();
      if (!content) return <div key={lineIdx} className="h-4" />;

      const isPassoLine = content.match(stepRegex);
      const isExemploLine = content.match(/^(Exemplo|EXEMPLO)/i);
      const isImageLabel = content.match(/^(Imagem|IMAGEM):/i);
      
      const showBullet = !isPassoLine && !isImageLabel && !isExemploLine;

      if (showBullet) {
        content = content.replace(/^[-*\s\.]+/, '');
      }

      const parts = content.split(combinedUrlRegex);
      return (
        <div key={lineIdx} className={`mb-6 last:mb-0 flex items-start group/line ${isPassoLine ? 'mt-10 mb-8' : isExemploLine ? 'mt-6 mb-4' : ''}`}>
          {showBullet && (
            <span className="shrink-0 mr-3 text-neon-yellow font-black opacity-40 group-hover/line:opacity-100 transition-opacity mt-2 text-[8px]">•</span>
          )}
          
          <div className="flex-1">
            {parts.map((part, i) => {
              if (part.match(combinedUrlRegex)) {
                if (isImage(part)) {
                  return (
                    <div key={i} className="mt-2 mb-8 group/img relative max-w-fit">
                      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 group-hover/img:ring-neon-yellow/30 transition-all duration-500">
                        <img 
                          src={part} 
                          alt="Manual Screenshot" 
                          className="max-w-full h-auto cursor-pointer transition-transform duration-700 hover:scale-[1.01] block"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(part);
                          }}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-center pb-6 pointer-events-none">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white glass px-6 py-2.5 rounded-full border-white/20 shadow-2xl backdrop-blur-md">{t.expandImage}</span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <a 
                      key={i} 
                      href={part} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-neon-yellow hover:text-white underline underline-offset-4 decoration-neon-yellow/30 hover:decoration-white transition-all font-bold mx-1 inline-flex items-center gap-1"
                    >
                      {part}
                    </a>
                  );
                }
              }

              // Highlight "Imagem: ..." lines with a closer, integrated style
              if (part.trim().match(/^(Imagem|IMAGEM):/i)) {
                return (
                  <div key={i} className="inline-flex items-center bg-white/[0.03] border-l-2 border-neon-yellow rounded-r-lg px-4 py-2 mb-1 group-hover/line:bg-white/[0.07] transition-colors">
                    <span className="text-slate-200 text-xs font-black italic tracking-wide uppercase">{part}</span>
                  </div>
                );
              }

              // Highlighting "PASSO X", "EXEMPLO" and **bold** text
              const rawText = part;
              const segments = rawText.split(highlightRegex);
              
              const highlightedSegments = segments.map((seg: string, segIdx: number) => {
                if (seg.match(stepRegex)) {
                  return (
                    <span key={segIdx} className="inline-flex items-center px-4 py-2 rounded-xl bg-neon-yellow text-slate-950 text-xs font-black uppercase tracking-tight mr-3 shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-transform hover:scale-105">
                      {seg}
                    </span>
                  );
                }

                if (seg.match(/Exemplo|EXEMPLO/i)) {
                  return (
                    <span key={segIdx} className="inline-flex items-center px-3 py-1 rounded-lg bg-sky-400/20 text-sky-300 text-[10px] font-black uppercase tracking-widest mr-2 border border-sky-400/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                      {seg}
                    </span>
                  );
                }
                
                // Clean up separators if this segment follows a tag OR precedes one
                let processedSeg = seg;
                if (segIdx > 0 && segments[segIdx-1].match(highlightRegex)) {
                  // Expanded cleaning to remove dashes, colons, dots, and extra spaces
                  processedSeg = processedSeg.replace(/^[:\s\-\.]+/, '');
                }
                if (segIdx < segments.length - 1 && segments[segIdx + 1].match(highlightRegex)) {
                  processedSeg = processedSeg.replace(/[:\s\-\.]+$/, '');
                }

                // 2 & 5. Highlight bold and keywords
                const boldRegex = /\*\*(.*?)\*\*/g;
                const subSegments = processedSeg.split(boldRegex);
                
                return subSegments.map((sub, subIdx) => {
                  if (subIdx % 2 === 1) {
                    return <strong key={subIdx} className="text-neon-yellow font-bold uppercase tracking-wide">{sub}</strong>;
                  }
                  
                  // 5. Highlight technical keywords
                  const techRegex = /(\b3D\b|\btextura\b|\.ydd\b|\.ytd\b|\.yft\b|\bOpenIV\b|\bmods\b)/gi;
                  const techParts = sub.split(techRegex);
                  
                  return techParts.map((tp, tpIdx) => {
                    if (tp.match(techRegex)) {
                      return <span key={tpIdx} className="text-neon-yellow font-bold border-b border-neon-yellow/30">{tp}</span>;
                    }
                    return tp;
                  });
                });
              });

              return <span key={i} className={isPassoLine ? "text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase" : isExemploLine ? "text-sm font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase" : ""}>{highlightedSegments}</span>;
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsExpanded(true)}
        className={`group relative glass rounded-2xl border-l-4 transition-all duration-500 overflow-hidden cursor-pointer ${
          isExpanded ? 'opacity-0 scale-95' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
        } ${(tutorial.category || '').toLowerCase().includes('design') ? 'border-l-neon-purple' : 'border-l-neon-yellow'}`}
      >
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <span className={`text-[10px] font-bold uppercase tracking-[0.15em] mb-2 block ${(tutorial.category || '').toLowerCase().includes('design') ? 'text-neon-purple' : 'text-neon-yellow'}`}>
                {tutorial.category} • {tutorial.subcategory}
              </span>
              
              <h3 className="text-xl font-bold group-hover:text-slate-900 dark:group-hover:text-white transition-colors mb-2 uppercase tracking-wide">
                {tutorial.title}
              </h3>
              
              <p className="text-slate-400 text-xs line-clamp-2">
                {tutorial.primaryQuestion}
              </p>
            </div>

            <div className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg glass text-slate-500 group-hover:text-neon-yellow group-hover:border-neon-yellow transition-all">
              <ChevronDown className="w-5 h-5 -rotate-90" />
            </div>
          </div>

          <div className="mt-6 flex justify-end items-center border-t border-white/5 pt-4">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${(tutorial.category || '').toLowerCase().includes('design') ? 'text-neon-purple' : 'text-neon-yellow'} group-hover:underline`}>
              {t.openManual}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Overlay Mode */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-50/95 dark:bg-bg-dark/95 backdrop-blur-xl overflow-y-auto"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="min-h-screen w-full max-w-5xl mx-auto p-6 md:p-12"
            >
              {/* Overlay Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between mb-12 glass p-4 rounded-2xl border-white/10 backdrop-blur-md">
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors group"
                >
                  <div className="h-8 w-8 rounded-full glass flex items-center justify-center group-hover:border-neon-yellow group-hover:text-neon-yellow">
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.backToTop}</span>
                </button>

                <div className="flex items-center space-x-4">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.15em] hidden sm:block ${(tutorial.category || '').toLowerCase().includes('design') ? 'text-neon-purple' : 'text-neon-yellow'}`}>
                    {tutorial.category} • {tutorial.subcategory}
                  </span>
                  <button 
                    onClick={() => setIsExpanded(false)}
                    className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:border-white/30 transition-all shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Overlay Content */}
              <div className="space-y-12 pb-24">
                <header>
                  <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight leading-none bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-500 bg-clip-text text-transparent">
                    {tutorial.title}
                  </h1>
                  <p className="text-xl text-slate-400 font-light max-w-3xl border-l-2 border-neon-yellow pl-6 py-2">
                    {tutorial.primaryQuestion}
                  </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-12 space-y-12">
                    {/* Objective Section */}
                    <div className="glass p-8 rounded-3xl border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-5">
                        <Target className="w-32 h-32" />
                      </div>
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="h-10 w-10 glass flex items-center justify-center text-xl rounded-xl">🎯</div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.objectiveLabel}</h2>
                      </div>
                      <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
                        {tutorial.objective}
                      </p>
                    </div>

                    {/* Steps Section */}
                    <div className="space-y-8">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 glass flex items-center justify-center text-xl rounded-xl">📖</div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.stepsLabel}</h2>
                      </div>

                      <div className="glass p-8 md:p-12 rounded-[2.5rem] border-white/10 bg-white/[0.01] shadow-2xl">
                        <div className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                          {renderSteps(tutorial.steps)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex flex-wrap gap-4 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                    <div className="glass px-4 py-2 rounded-full">ID: {tutorial.id}</div>
                    <div className="glass px-4 py-2 rounded-full">Ref: Manual_{tutorial.subcategory?.replace(/\s/g, '_')}_V1</div>
                  </div>
                </footer>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-sm cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedImage} 
                alt="Enlarged view" 
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-neon-yellow transition-colors font-bold uppercase tracking-widest text-xs glass px-4 py-2 rounded-full"
              >
                {t.close} ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
