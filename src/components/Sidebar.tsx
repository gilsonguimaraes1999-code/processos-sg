/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  LayoutGrid, 
  BookOpen, 
  Settings, 
  Users, 
  BarChart3, 
  FileText, 
  Shield, 
  MessageSquare, 
  HardDrive, 
  Zap,
  Globe,
  LogOut,
  Database
} from 'lucide-react';
import { Language, translations } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  lang: Language;
  onLogout: () => void;
  currentUser: string | null;
  manualScriptUrl: string;
  onManualUrlChange: (url: string) => void;
  onRefreshData: () => void;
}

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('comercial') || cat.includes('venda')) return <Zap size={16} />;
  if (cat.includes('financeiro') || cat.includes('pagamento')) return <BarChart3 size={16} />;
  if (cat.includes('rh') || cat.includes('pessoas')) return <Users size={16} />;
  if (cat.includes('tutorial') || cat.includes('curso')) return <BookOpen size={16} />;
  if (cat.includes('configur') || cat.includes('sistema')) return <Settings size={16} />;
  if (cat.includes('processo')) return <HardDrive size={16} />;
  if (cat.includes('juridico') || cat.includes('segur')) return <Shield size={16} />;
  if (cat.includes('atendimento') || cat.includes('comunic')) return <MessageSquare size={16} />;
  if (cat.includes('documento')) return <FileText size={16} />;
  if (cat.includes('global') || cat.includes('geral')) return <Globe size={16} />;
  
  return <FileText size={16} />;
};

export default function Sidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  lang,
  onLogout,
  currentUser,
  manualScriptUrl,
  onManualUrlChange,
  onRefreshData
}: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const t = translations[lang];

  const handleSaveUrl = () => {
    localStorage.setItem('manual_apps_script_url', manualScriptUrl);
    setShowConfig(false);
    onRefreshData();
  };

  const handleSelect = (category: string | null) => {
    onSelectCategory(category);
    setIsHovered(false);
  };

  return (
    <div 
      className="relative z-40 hidden md:block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Stealth Vertical Trigger */}
      <div className={`fixed left-0 top-24 bottom-10 w-8 group cursor-pointer transition-all duration-500 flex items-center justify-start pl-2 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
        <div className="h-32 w-1.5 rounded-full bg-neon-yellow/20 group-hover:bg-neon-yellow/50 group-hover:h-40 group-hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all duration-500"></div>
      </div>

      {/* Floating Glass Menu */}
      <motion.aside
        initial={{ x: -20, opacity: 0, scale: 0.95 }}
        animate={{ 
          x: isHovered ? 0 : -340,
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1 : 0.95,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-28 left-4 w-72 glass-heavy p-6 flex flex-col h-[calc(100vh-160px)] rounded-3xl border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] z-50 pointer-events-auto"
      >
        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-6">
          <nav className="space-y-1">
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center p-3 rounded-xl text-sm transition-all duration-300 group ${
                selectedCategory === null
                  ? 'bg-neon-yellow/10 text-slate-900 dark:text-white font-bold neon-border'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-neon-yellow/5 hover:text-neon-yellow'
              }`}
            >
              <LayoutGrid size={16} className={`mr-3 transition-opacity ${selectedCategory === null ? 'opacity-100 text-neon-yellow' : 'opacity-40 group-hover:opacity-100'}`} />
              {t.allCategories}
            </button>
          </nav>

          <div className="space-y-1">
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleSelect(selectedCategory === cat ? null : cat)}
                  className={`w-full flex items-center p-3 rounded-xl text-sm transition-all duration-300 group ${
                    selectedCategory === cat
                      ? 'bg-neon-yellow/10 text-slate-900 dark:text-white font-bold neon-border'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-neon-yellow/5 hover:text-neon-yellow'
                  }`}
                >
                  <div className={`mr-3 transition-opacity ${selectedCategory === cat ? 'opacity-100 text-neon-yellow' : 'opacity-40 group-hover:opacity-100'}`}>
                    {getCategoryIcon(cat)}
                  </div>
                  <span>{cat}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
          {currentUser === 'owner' && (
            <div className="space-y-3">
              <button 
                onClick={() => setShowConfig(!showConfig)}
                className={`w-full h-11 rounded-xl flex items-center justify-center gap-3 transition-all group ${showConfig ? 'bg-neon-yellow text-slate-950 font-bold' : 'glass text-white/60 hover:text-white border border-white/5'}`}
              >
                <Database size={16} className={showConfig ? 'text-slate-950' : 'text-neon-yellow'} />
                <span className="text-[10px] font-black uppercase tracking-widest">Configurar Script</span>
              </button>

              <AnimatePresence>
                {showConfig && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-2xl bg-black/40 border border-neon-yellow/20 space-y-3">
                      <label className="block text-[8px] uppercase font-bold text-slate-500 tracking-tighter">
                        URL Manual do Apps Script
                      </label>
                      <input 
                        type="text"
                        value={manualScriptUrl}
                        onChange={(e) => onManualUrlChange(e.target.value)}
                        placeholder="https://script.google.com/..."
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-[10px] focus:border-neon-yellow/50 outline-none transition-colors text-white"
                      />
                      <button 
                        onClick={handleSaveUrl}
                        className="w-full py-2 bg-neon-yellow/10 border border-neon-yellow/20 rounded-lg text-neon-yellow text-[9px] font-bold uppercase tracking-widest hover:bg-neon-yellow/20 transition-colors"
                      >
                        Salvar e Atualizar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button 
            className="w-full h-11 glass neon-border rounded-xl flex items-center justify-center gap-3 text-white/60 hover:text-white transition-all group"
            onClick={onLogout}
          >
            <LogOut size={16} className="text-neon-yellow group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
          </button>

          <div className="glass neon-border flex items-center justify-between px-4 py-3 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-widest text-slate-500 dark:text-white/40 font-bold mb-1">{t.statusLabel}</span>
              <span className="text-[10px] font-black text-neon-yellow">{t.statusOnline}</span>
            </div>
            <div className="w-8 h-8 rounded-full border border-neon-yellow/20 flex items-center justify-center bg-neon-yellow/5">
              <div className="w-2 h-2 bg-neon-yellow rounded-full shadow-[0_0_8px_#FFD700]"></div>
              <div className="absolute w-2 h-2 bg-neon-yellow rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile view - Standard scrollable list */}
      <div className="md:hidden w-full overflow-x-auto pb-2 flex gap-3 px-2 no-scrollbar">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex-none px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
            selectedCategory === null ? 'bg-neon-yellow text-slate-950 shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          {t.allCategories}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(selectedCategory === cat ? null : cat)}
            className={`flex-none px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              selectedCategory === cat ? 'bg-neon-yellow text-slate-950 shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
