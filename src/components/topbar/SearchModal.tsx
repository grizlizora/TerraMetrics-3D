import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Globe, MapPin, Compass } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useI18nStore } from '../../store/useI18nStore';
import { dataLoader } from '../../data/DataLoader';
import { audioManager } from '../../audio/AudioManager';
import { TerraHaptics } from '../../native/TerraHaptics';
import { LiquidGlassPanel } from '../common/LiquidGlassPanel';
import { ContinentName, ISO3Code } from '../../types';
import { getCountryFlag } from '../../utils/flagUtils';

const CONTINENTS_INDEX = [
  { id: 'World' as ContinentName, nameUk: 'Глобально (Світ)', nameEn: 'Global (World)', ukL: 'глобально (світ) світ world', enL: 'global (world) world' },
  { id: 'Europe' as ContinentName, nameUk: 'Європа', nameEn: 'Europe', ukL: 'європа', enL: 'europe' },
  { id: 'Asia' as ContinentName, nameUk: 'Азія', nameEn: 'Asia', ukL: 'азія', enL: 'asia' },
  { id: 'Africa' as ContinentName, nameUk: 'Африка', nameEn: 'Africa', ukL: 'африка', enL: 'africa' },
  { id: 'North America' as ContinentName, nameUk: 'Північна Америка', nameEn: 'North America', ukL: 'північна америка', enL: 'north america' },
  { id: 'South America' as ContinentName, nameUk: 'Південна Америка', nameEn: 'South America', ukL: 'південна америка', enL: 'south america' },
  { id: 'Oceania' as ContinentName, nameUk: 'Океанія', nameEn: 'Oceania', ukL: 'океанія', enL: 'oceania' },
];

export const SearchModal: React.FC = () => {
  const searchModalOpen = useAppStore((s) => s.searchModalOpen);
  const setSearchModalOpen = useAppStore((s) => s.setSearchModalOpen);
  const setSelectedCountry = useAppStore((s) => s.setSelectedCountry);
  const setSelectedContinent = useAppStore((s) => s.setSelectedContinent);

  const t = useI18nStore((s) => s.t);
  const lang = useI18nStore((s) => s.lang);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'countries' | 'continents'>('countries');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (searchModalOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [searchModalOpen]);

  // Scroll active item into view when navigating via keyboard
  useEffect(() => {
    if (searchModalOpen && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, searchModalOpen]);

  // Fast Instant Search (<0.05ms) via DataLoader search index
  const countryResults = useMemo(() => {
    return dataLoader.searchCountries(query, lang);
  }, [query, lang]);

  const continentResults = useMemo(() => {
    if (!query.trim()) return CONTINENTS_INDEX;
    const q = query.toLowerCase().trim();
    return CONTINENTS_INDEX.filter((c) => c.ukL.includes(q) || c.enL.includes(q));
  }, [query]);

  const totalResults = activeTab === 'countries' ? countryResults.length : continentResults.length;

  const handleClose = () => {
    audioManager.playClosePanel();
    TerraHaptics.lightImpact();
    setSearchModalOpen(false);
  };

  const handleSelectCountry = (iso: ISO3Code, name: string) => {
    audioManager.playSelectCountry();
    TerraHaptics.countrySelected();
    setSelectedCountry(iso, name);
    setSearchModalOpen(false);
  };

  const handleSelectContinent = (continent: ContinentName) => {
    audioManager.playSelectContinent();
    TerraHaptics.mediumImpact();
    setSelectedContinent(continent);
    setSearchModalOpen(false);
  };

  // Keyboard accessibility: Escape, ArrowDown, ArrowUp, Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!searchModalOpen) return;

      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (totalResults > 0 ? (prev + 1) % totalResults : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (totalResults > 0 ? (prev - 1 + totalResults) % totalResults : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === 'countries' && countryResults[selectedIndex]) {
          const item = countryResults[selectedIndex];
          handleSelectCountry(item.iso, item.name);
        } else if (activeTab === 'continents' && continentResults[selectedIndex]) {
          const item = continentResults[selectedIndex];
          handleSelectContinent(item.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen, activeTab, selectedIndex, totalResults, countryResults, continentResults]);

  if (!searchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[calc(var(--sat)+16px)] bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="fixed inset-0" onClick={handleClose} />

      <LiquidGlassPanel
        intensity="high"
        className="relative w-full max-w-md p-4 z-10 flex flex-col max-h-[82vh] shadow-2xl rounded-3xl"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-black/10 dark:border-white/10">
          <Search className="w-5 h-5 text-blue-500 shrink-0" strokeWidth={2.2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t('search_placeholder')}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
            className="flex-1 bg-transparent text-sm font-semibold outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
          />
          {/* Unified Close / Clear Action Button */}
          <button
            onClick={() => {
              if (query) {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
                TerraHaptics.lightImpact();
              } else {
                handleClose();
              }
            }}
            aria-label={query ? t('tooltip_clear_search') : t('close')}
            title={query ? t('tooltip_clear_search') : t('tooltip_close_modal')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-1.5 pt-3 pb-2">
          <button
            onClick={() => {
              setActiveTab('countries');
              setSelectedIndex(0);
              TerraHaptics.selectionChanged();
            }}
            className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'countries'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('tab_countries')}</span>
              {countryResults.length > 0 && (
                <span className="text-[10px] opacity-80">({countryResults.length})</span>
              )}
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('continents');
              setSelectedIndex(0);
              TerraHaptics.selectionChanged();
            }}
            className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'continents'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-black/10'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>{t('tab_continents')}</span>
            </div>
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-black/5 dark:divide-white/5 mt-1">
          {activeTab === 'countries' ? (
            countryResults.length > 0 ? (
              countryResults.map((c, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={c.iso}
                    ref={isSelected ? selectedItemRef : null}
                    onClick={() => handleSelectCountry(c.iso, c.name)}
                    className={`w-full flex items-center justify-between p-3 text-left rounded-xl transition-colors group cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 text-base shrink-0 select-none">
                        {getCountryFlag(c.iso)}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-blue-500 transition-colors">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {t(c.continent) || c.continent} • <span className="font-mono text-[10px] opacity-75">{c.iso}</span>
                        </div>
                      </div>
                    </div>
                    <Compass className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                  </button>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-zinc-400">{t('not_found')}</div>
            )
          ) : continentResults.length > 0 ? (
            continentResults.map((c, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={c.id}
                  ref={isSelected ? selectedItemRef : null}
                  onClick={() => handleSelectContinent(c.id)}
                  className={`w-full flex items-center justify-between p-3 text-left rounded-xl transition-colors group cursor-pointer ${
                    isSelected
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 text-sm">
                      <Globe className="w-4 h-4" />
                    </span>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-blue-500 transition-colors">
                      {lang === 'uk' ? c.nameUk : c.nameEn}
                    </div>
                  </div>
                  <Compass className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-zinc-400">{t('not_found')}</div>
          )}
        </div>
      </LiquidGlassPanel>
    </div>
  );
};
