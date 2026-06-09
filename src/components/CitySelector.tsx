import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, ExternalLink } from 'lucide-react';
import { City } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CitySelectorProps {
  cities: City[];
}

export default function CitySelector({ cities }: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (cities.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-11 px-4 led-pulse rounded-lg bg-neon-yellow/10 text-neon-yellow font-bold text-[10px] uppercase tracking-widest flex items-center justify-center transition-all hover:scale-105 active:scale-95 group border border-neon-yellow/20`}
      >
        <MapPin className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Cidades</span>
        <ChevronDown className={`w-3 h-3 ml-2 opacity-50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-64 glass-matte rounded-xl overflow-hidden z-50 py-2 origin-top-right shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="px-4 py-2 border-b border-black/5 dark:border-white/5 mb-2 bg-black/5 dark:bg-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecione uma Cidade</span>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
              {cities.map((city) => (
                <a
                  key={city.name}
                  href={city.invite || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition-all group"
                >
                  <div className="h-9 w-9 rounded-full border border-white/20 overflow-hidden bg-slate-800 shrink-0 shadow-lg group-hover:border-neon-yellow/50 transition-colors">
                    <img 
                      src={city.icon} 
                      alt={city.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black tracking-tight text-slate-800 dark:text-slate-200 group-hover:text-neon-yellow transition-colors">{city.name}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Entrar no Discord</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-all text-neon-yellow" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
