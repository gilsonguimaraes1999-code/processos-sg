/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import ThreeDLogo from './components/ThreeDLogo';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TutorialList from './components/TutorialList';
import PreloaderModal from './components/PreloaderModal';
import { Tutorial, Language, translations, City, ApiResponse } from './types';
import { motion, AnimatePresence } from 'motion/react';
import AISmartSearch from './components/AISmartSearch';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('pt');
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [manualScriptUrl, setManualScriptUrl] = useState<string>(() => localStorage.getItem('manual_apps_script_url') || '');
  const [showConfig, setShowConfig] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [currentPreloadTask, setCurrentPreloadTask] = useState('');
  const [languagesProcessed, setLanguagesProcessed] = useState<string[]>([]);
  const [cache, setCache] = useState<Record<string, ApiResponse>>({});
  const [diagnosticInfo, setDiagnosticInfo] = useState<{
    url: string;
    status: string | number;
    duration: string;
    timestamp: string;
    error?: string;
  } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  const handleTutorialSelected = (tutorial: Tutorial) => {
    setSelectedCategory(null);
    setSearchTerm(tutorial.title);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const fetchData = async (currentLang: Language = lang, useCache: boolean = true) => {
    if (useCache && cache[currentLang]) {
      setTutorials(cache[currentLang].tutorials);
      setCities(cache[currentLang].cities);
      setIsLoading(false);
      return;
    }

    setIsUpdating(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 45000); // Increased to 45s for broad spreadsheet fetch

    try {
      setFetchError(null);
      const startTime = performance.now();
      const langId = typeof currentLang === 'string' ? currentLang : (currentLang as any).id || 'pt';
      
      console.log(`[Diagnostic] Iniciando fetch para lang: ${langId} em ${new Date().toISOString()}`);
      
      const headers: Record<string, string> = { 
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'x-revalidate-force': 'true' 
      };
      if (manualScriptUrl) headers['x-manual-script-url'] = manualScriptUrl;

      // Adicionando timestamp para furar cache do navegador e Vercel Edge
      const fetchUrl = `/api/tutorials?lang=${langId}&_t=${Date.now()}`;
      
      setDiagnosticInfo({
        url: fetchUrl,
        status: 'Pendente...',
        duration: '...',
        timestamp: new Date().toISOString()
      });

      const response = await fetch(fetchUrl, {
        signal: controller.signal,
        headers
      });
      
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      setDiagnosticInfo(prev => prev ? {
        ...prev,
        status: response.status,
        duration: `${duration}ms`
      } : null);

      console.log(`[Diagnostic] Status: ${response.status} (${duration}ms)`);
      console.log(`[Diagnostic] Headers:`, Object.fromEntries(response.headers.entries()));

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `Erro HTTP ${response.status}`;
        try {
          const errData = await response.json();
          errorMsg = errData.details || errData.error || errorMsg;
          console.error("[Diagnostic] Detalhes do erro retornados pelo backend:", errData);
        } catch (e) {
          const rawText = await response.text().catch(() => "Sem corpo");
          console.error("[Diagnostic] O backend não retornou JSON. Corpo bruto:", rawText);
        }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      
      // Validação crítica: Se os dados vierem vazios, algo está errado no cache ou no Google
      if (!data || (!Array.isArray(data.tutorials) && !Array.isArray(data.cities))) {
        console.error("[Diagnostic] Resposta vazia ou inválida recebida:", data);
        throw new Error("O servidor retornou uma resposta vazia ou malformada. Verifique se o Apps Script está ativo.");
      }

      console.log(`[Diagnostic] Dados recebidos: ${data.tutorials?.length || 0} tutoriais, ${data.cities?.length || 0} cidades`);

      const parsedData: ApiResponse = {
        tutorials: Array.isArray(data?.tutorials) ? data.tutorials : [],
        cities: Array.isArray(data?.cities) ? data.cities : []
      };

      setTutorials(parsedData.tutorials);
      setCities(parsedData.cities);
      setCache(prev => ({ ...prev, [langId]: parsedData }));
      
      if (manualScriptUrl) localStorage.setItem('manual_apps_script_url', manualScriptUrl);

      return parsedData;

    } catch (error: any) {
      clearTimeout(timeoutId);
      const msg = error.name === 'AbortError' ? 'Tempo limite atingido (45s).' : `Erro: ${error.message}`;
      
      setDiagnosticInfo(prev => prev ? {
        ...prev,
        status: prev.status === 'Pendente...' ? 'Falha de Rede/Timeout' : prev.status,
        error: error.message
      } : null);

      setFetchError(msg);
      console.error('[Diagnostic] Falha Crítica de Sincronização:', error);
      throw error; 
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchData(lang).catch(() => {}); // Catch silent for standard effect
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const categories = useMemo(() => {
    if (!Array.isArray(tutorials)) return [];
    return Array.from(new Set(tutorials.map(t => t?.category).filter(Boolean)));
  }, [tutorials]);

  const filteredTutorials = useMemo(() => {
    if (!Array.isArray(tutorials)) return [];
    return tutorials.filter(item => {
      if (!item) return false;
      
      const search = searchTerm.toLowerCase().trim();
      if (search === '') return selectedCategory === null || item.category === selectedCategory;

      const titleMatch = (item.title || '').toString().toLowerCase().includes(search);
      const subcategoryMatch = (item.subcategory || '').toString().toLowerCase().includes(search);
      const keywordsMatch = Array.isArray(item.keywords) && item.keywords.some(k => 
        (k || '').toString().toLowerCase().includes(search)
      );
      
      const matchesSearch = titleMatch || subcategoryMatch || keywordsMatch;
      const matchesCategory = selectedCategory === null || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [tutorials, searchTerm, selectedCategory]);

  const preloadAllData = async () => {
    setIsPreloading(true);
    setPreloadProgress(0);
    setLanguagesProcessed([]);
    
    const languages: Language[] = [lang, ...(['pt', 'en', 'es'] as Language[]).filter(item => item !== lang)];
    const stepSize = 100 / languages.length;
    const loadedData: Record<string, ApiResponse> = {};

    try {
      for (let i = 0; i < languages.length; i++) {
        const currentLang = languages[i];
        setCurrentPreloadTask(`Sincronizando: ${currentLang.toUpperCase()}`);
        
        try {
          const data = await fetchData(currentLang, false);
          if (data) loadedData[currentLang] = data;
          setLanguagesProcessed(prev => [...prev, currentLang]);
        } catch (err) {
          console.warn(`[Preloader] Falha ao carregar idioma ${currentLang}:`, err);

          // O idioma atual é obrigatório. Os outros idiomas não podem bloquear o login.
          if (currentLang === lang) {
            throw err;
          }
        }
        
        // Small delay to keep the loading animation readable
        await new Promise(resolve => setTimeout(resolve, 350));
        setPreloadProgress((i + 1) * stepSize);
      }
      
      setCurrentPreloadTask('Finalizando');
      setPreloadProgress(100);

      const currentData = loadedData[lang] || cache[lang];
      if (currentData) {
        setTutorials(currentData.tutorials);
        setCities(currentData.cities);
      }

      await new Promise(resolve => setTimeout(resolve, 650));
      
      setIsPreloading(false);
      setIsAuthenticated(true);
      setShowLanding(false);

    } catch (err: any) {
      console.error("[Preloader] Falha ao pré-carregar dados principais:", err);
      setLoginError(`Falha no carregamento inicial: ${err.message}`);
      setIsPreloading(false);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);

    try {
      // Store current user for role-based features
      setCurrentUser(username.toLowerCase());
      
      // Whitelist/Preload sequence starts here
      await preloadAllData();
    } catch (err) {
      setLoginError('Erro de conexão com o portal.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowLanding(true);
    // Optional: Clear any session items if needed
  };

  return (
    <div className={`min-h-screen bg-bg-dark text-slate-200 font-sans`}>
      <AnimatePresence mode="wait">
        {showLanding && !isPreloading && (
          <ThreeDLogo 
            onLogin={handleLogin} 
            isLoading={loginLoading}
            error={loginError}
            diagnosticInfo={diagnosticInfo}
            manualUrl={manualScriptUrl}
            onManualUrlChange={setManualScriptUrl}
            onRetry={() => {
              setLoginError(null);
              // If it was a preload error, we might need to reset something
              // But usually handleLogin will trigger preloadAllData again
            }}
          />
        )}
        {isPreloading && (
          <PreloaderModal 
            progress={preloadProgress} 
            currentTask={currentPreloadTask} 
            languagesProcessed={languagesProcessed}
          />
        )}
      </AnimatePresence>

      {isAuthenticated && !showLanding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-h-screen overflow-x-hidden"
          >
          <Header 
            lang={lang}
            setLang={setLang}
            onUpdate={() => fetchData(lang, false)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isUpdating={isUpdating}
            allTutorials={tutorials}
            onTutorialClick={handleTutorialSelected}
            cities={cities}
          />

          <main className="flex-1 w-full flex flex-col md:flex-row gap-6 p-4 md:p-6 min-h-0">
            <Sidebar 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              lang={lang}
              onLogout={handleLogout}
              currentUser={currentUser}
              manualScriptUrl={manualScriptUrl}
              onManualUrlChange={setManualScriptUrl}
              onRefreshData={() => fetchData(lang)}
            />

            <section className="flex-1 flex flex-col space-y-6 pt-2">
              {fetchError && (
                <div className="glass p-6 rounded-xl border-red-500/20 bg-red-500/5 text-center flex flex-col items-center">
                  <p className="text-red-400 text-sm mb-4">{fetchError}</p>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => fetchData(lang, false)}
                      className="px-4 py-2 bg-neon-yellow text-black text-[10px] font-bold uppercase tracking-widest rounded-lg hover:scale-105 transition-transform"
                    >
                      Tentar Novamente
                    </button>
                    
                    <button 
                      onClick={() => setShowConfig(!showConfig)}
                      className="px-4 py-2 glass text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {showConfig ? 'Fechar Filtros' : 'Configurar URL'}
                    </button>
                  </div>

                  {showConfig && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-6 w-full max-w-md pt-6 border-t border-white/5"
                    >
                      <label className="block text-left text-[9px] uppercase font-bold text-slate-500 mb-2 tracking-tighter">
                        URL Manual do Apps Script (Override)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={manualScriptUrl}
                          onChange={(e) => setManualScriptUrl(e.target.value)}
                          placeholder="https://script.google.com/macros/s/.../exec"
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-neon-yellow/50 outline-none transition-colors"
                        />
                        <button 
                          onClick={() => {
                            localStorage.setItem('manual_apps_script_url', manualScriptUrl);
                            setShowConfig(false);
                            fetchData(lang, false);
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-neon-yellow text-[9px] font-bold uppercase rounded-lg border border-white/10"
                        >
                          Salvar
                        </button>
                      </div>
                      <p className="mt-2 text-[8px] text-slate-500 text-left italic">
                        * Use isto apenas se a variável de servidor (APPS_SCRIPT_URL) falhar.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-6">
                  <div className="w-16 h-16 led-pulse rounded-full flex items-center justify-center bg-neon-yellow/5">
                    <div className="w-8 h-8 border-4 border-neon-yellow/20 border-t-neon-yellow rounded-full animate-spin" />
                  </div>
                  <p className="text-neon-yellow font-bold uppercase tracking-widest animate-pulse text-[10px]">{t.loading}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Results Header */}
                  <div className="flex items-center justify-between glass px-6 py-3 rounded-xl border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-neon-yellow">{filteredTutorials.length}</span>
                      <span className="opacity-50">{t.foundStats}</span>
                    </div>
                    {selectedCategory && (
                      <div className="px-3 py-1 glass rounded-full text-[10px] uppercase font-bold text-neon-yellow neon-border">
                        {selectedCategory}
                      </div>
                    )}
                  </div>

                  <TutorialList 
                    tutorials={filteredTutorials} 
                    lang={lang} 
                  />
                </div>
              )}
            </section>
          </main>

          {/* Footer */}
          <footer className="h-14 shrink-0 glass flex items-center justify-between px-8 text-[9px] text-slate-500 uppercase tracking-widest mt-auto">
            <div>&copy; {new Date().getFullYear()} • {t.brandingMain} • {t.footerTag}</div>
            <div className="flex space-x-8">
              <span className="text-neon-yellow hidden sm:inline">{t.statusLabel}: {t.statusOnline}</span>
            </div>
          </footer>
        </motion.div>
      )}

      {/* Global CSS for Custom Scrollbar and Ambient effects */}
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.1);
          border-radius: 20px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 215, 0, 0.3);
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}

