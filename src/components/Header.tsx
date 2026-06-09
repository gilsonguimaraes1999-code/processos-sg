/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sun, Moon, Languages, RotateCw, Search, Sparkles } from 'lucide-react';
import { Language, translations, Tutorial, City } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import AISmartSearch from './AISmartSearch';
import CitySelector from './CitySelector';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  onUpdate: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isUpdating: boolean;
  allTutorials: Tutorial[];
  onTutorialClick: (tutorial: Tutorial) => void;
  cities: City[];
}

export default function Header({
  lang,
  setLang,
  onUpdate,
  searchTerm,
  setSearchTerm,
  isUpdating,
  allTutorials,
  onTutorialClick,
  cities
}: HeaderProps) {
  const [showLangs, setShowLangs] = useState(false);
  const t = translations[lang];

  const languages: { id: Language; label: string }[] = [
    { id: 'pt', label: 'Português' },
    { id: 'en', label: 'English' },
    { id: 'es', label: 'Español' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between backdrop-blur-xl border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-bg-dark/80">
      <div className="flex items-center gap-4 shrink-0">
        <img 
          src="https://i.ibb.co/69s087d/image.png" 
          alt="Nexus" 
          className="w-12 h-12 object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
          referrerPolicy="no-referrer"
        />
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-tight font-sans">
            {t.brandingMain}
          </h1>
          <p className="text-[10px] text-neon-yellow opacity-80 uppercase tracking-widest leading-none font-bold mt-1">
            {t.brandingSub}
          </p>
        </div>
      </div>

      <div className="hidden md:flex flex-1 max-w-2xl mx-8 items-center space-x-3">
        <div className="glass neon-border flex items-center flex-1 px-4 h-11 rounded-lg overflow-hidden">
          <Search className="w-4 h-4 text-white/40 mr-3" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-slate-900 dark:text-white placeholder:text-slate-900/30 dark:placeholder:text-white/20"
          />
        </div>
        <AISmartSearch lang={lang} onTutorialClick={onTutorialClick} allTutorials={allTutorials} />
      </div>

      <div className="flex items-center gap-2 md:gap-6 shrink-0">
        <div className="hidden sm:flex space-x-3 text-xs font-medium uppercase tracking-tighter">
          {languages.map((l) => (
            <span 
              key={l.id}
              onClick={() => setLang(l.id)}
              className={`cursor-pointer transition-all ${lang === l.id ? 'text-neon-yellow' : 'opacity-40 hover:opacity-100 text-slate-900 dark:text-white'}`}
            >
              {l.id === 'pt' ? 'BR' : l.id.toUpperCase()}
            </span>
          ))}
        </div>

        <button
          onClick={onUpdate}
          disabled={isUpdating}
          className={`h-11 px-4 led-pulse rounded-lg bg-neon-yellow/10 text-neon-yellow font-bold text-[10px] uppercase tracking-widest flex items-center justify-center transition-all ${isUpdating ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
        >
          <RotateCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
          <span className="hidden lg:inline">{t.updateButton}</span>
        </button>

        <div className="hidden md:block">
          <CitySelector cities={cities} />
        </div>
      </div>
    </header>
  );
}
