import { create } from 'zustand';
import {
  ContinentName,
  ISO3Code,
  MacroCategory,
  SheetSnap,
  SpaceMode,
  SubMode,
  ThemeMode,
} from '../types';

export const DEFAULT_SUBMODES: Record<MacroCategory, SubMode> = {
  society: 'religion',
  state: 'economy',
  nature: 'climate',
};

const getInitialTheme = (): ThemeMode => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('terrametrics_theme') as ThemeMode;
    if (saved === 'dark' || saved === 'light') return saved;
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  }
  return 'dark';
};

interface AppState {
  // Navigation & Category Modes
  category: MacroCategory;
  activeCategory: MacroCategory;
  subMode: SubMode;
  projection: 'globe' | 'mercator';
  theme: ThemeMode;
  spaceMode: SpaceMode;
  spaceLabelsVisible: boolean;
  timeScale: number;

  // Selected Entities
  selectedCountryIso: ISO3Code | null;
  selectedCountryName: string | null;
  selectedContinent: ContinentName;
  isCountrySelected: boolean;

  // Sheet & Modal UI
  sheetSnap: SheetSnap;
  searchOpen: boolean;
  searchModalOpen: boolean;
  climateModalOpen: boolean;
  isSidebarCollapsed: boolean;
  dataVersion: number;
  flyRequestId: number;

  // Actions
  setCategory: (cat: MacroCategory) => void;
  setActiveCategory: (cat: MacroCategory) => void;
  setSubMode: (subMode: SubMode) => void;
  setSpaceMode: (mode: SpaceMode) => void;
  toggleSpaceLabels: () => void;
  setTimeScale: (scale: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  selectCountry: (iso: ISO3Code | null, name?: string | null) => void;
  setSelectedCountry: (iso: ISO3Code | null, name?: string | null) => void;
  selectContinent: (continent: ContinentName) => void;
  setSelectedContinent: (continent: ContinentName) => void;
  setProjection: (projection: 'globe' | 'mercator') => void;
  toggleProjection: () => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setSheetSnap: (snap: SheetSnap) => void;
  setSearchOpen: (open: boolean) => void;
  setSearchModalOpen: (open: boolean) => void;
  setClimateModalOpen: (open: boolean) => void;
  incrementDataVersion: () => void;
  resetToWorld: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  category: 'society',
  activeCategory: 'society',
  subMode: 'religion',
  projection: 'globe',
  theme: getInitialTheme(),
  spaceMode: 'none',
  spaceLabelsVisible: true,
  timeScale: 1,
  isSidebarCollapsed: false,

  selectedCountryIso: null,
  selectedCountryName: null,
  selectedContinent: 'World',
  isCountrySelected: false,

  sheetSnap: 'peek',
  searchOpen: false,
  searchModalOpen: false,
  climateModalOpen: false,
  dataVersion: 1,
  flyRequestId: 0,

  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setCategory: (category) => {
    const subMode = DEFAULT_SUBMODES[category];
    set({ category, activeCategory: category, subMode });
  },

  setActiveCategory: (category) => {
    const subMode = DEFAULT_SUBMODES[category];
    set({ category, activeCategory: category, subMode });
  },

  setSubMode: (subMode) => {
    let category: MacroCategory = 'society';
    if (['economy', 'politics', 'military'].includes(subMode)) category = 'state';
    if (['climate', 'geography', 'resources'].includes(subMode)) category = 'nature';
    set({ subMode, category, activeCategory: category });
  },

  setSpaceMode: (spaceMode) => {
    if (get().theme === 'light' && spaceMode !== 'none') {
      return;
    }
    set({ spaceMode });
  },
  toggleSpaceLabels: () => set((state) => ({ spaceLabelsVisible: !state.spaceLabelsVisible })),
  setTimeScale: (timeScale) => set({ timeScale }),

  selectCountry: (iso, name = null) => {
    if (!iso) {
      set((state) => ({
        selectedCountryIso: null,
        selectedCountryName: null,
        isCountrySelected: false,
        sheetSnap: 'peek',
        flyRequestId: state.flyRequestId + 1,
      }));
    } else {
      set((state) => ({
        selectedCountryIso: iso,
        selectedCountryName: name,
        isCountrySelected: true,
        sheetSnap: 'half',
        flyRequestId: state.flyRequestId + 1,
      }));
    }
  },

  setSelectedCountry: (iso, name = null) => {
    get().selectCountry(iso, name);
  },

  selectContinent: (continent) => {
    set((state) => ({
      selectedContinent: continent,
      selectedCountryIso: null,
      selectedCountryName: null,
      isCountrySelected: false,
      sheetSnap: 'peek',
      flyRequestId: state.flyRequestId + 1,
    }));
  },

  setSelectedContinent: (continent) => {
    get().selectContinent(continent);
  },

  setProjection: (projection) => set({ projection }),

  toggleProjection: () => {
    const next = get().projection === 'globe' ? 'mercator' : 'globe';
    set({ projection: next });
  },

  toggleTheme: () => {
    const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('terrametrics_theme', nextTheme);
      } catch {}
    }
    if (typeof document !== 'undefined') {
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    if (nextTheme === 'light') {
      set({ theme: nextTheme, spaceMode: 'none' });
    } else {
      set({ theme: nextTheme });
    }
  },

  setTheme: (theme) => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('terrametrics_theme', theme);
      } catch {}
    }
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    if (theme === 'light') {
      set({ theme, spaceMode: 'none' });
    } else {
      set({ theme });
    }
  },

  setSheetSnap: (sheetSnap) => set({ sheetSnap }),
  setSearchOpen: (searchOpen) => set({ searchOpen, searchModalOpen: searchOpen }),
  setSearchModalOpen: (searchModalOpen) =>
    set({ searchOpen: searchModalOpen, searchModalOpen }),
  setClimateModalOpen: (climateModalOpen) => set({ climateModalOpen }),
  incrementDataVersion: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),

  resetToWorld: () => {
    set((state) => ({
      selectedContinent: 'World',
      selectedCountryIso: null,
      selectedCountryName: null,
      isCountrySelected: false,
      sheetSnap: 'peek',
      flyRequestId: state.flyRequestId + 1,
    }));
  },
}));
