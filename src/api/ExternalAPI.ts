import { useAppStore } from '../store/useAppStore';
import { useI18nStore } from '../store/useI18nStore';
import { dataLoader } from '../data/DataLoader';

export interface UIControlItem {
  id: string;
  text: string;
  action: string | null;
  isActive: boolean;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
}

export class ExternalAPI {
  private static instance: ExternalAPI | null = null;
  private observer: MutationObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).TerraMetricsAPI = this;
      this.setupObserver();
    }
  }

  public static init() {
    if (!this.instance) {
      this.instance = new ExternalAPI();
    }
    return this.instance;
  }

  public getVisibleControls(): UIControlItem[] {
    return this.scanUI();
  }

  public onUpdate(callback: (controls: UIControlItem[]) => void) {
    if (typeof window !== 'undefined') {
      window.addEventListener('terra-api-update', ((e: CustomEvent) => {
        callback(e.detail);
      }) as EventListener);
    }
  }

  private setupObserver() {
    if (typeof document === 'undefined') return;
    const targetNode = document.body;
    const config = {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'style', 'data-api-action'],
    };

    let timeout: number | null = null;
    this.observer = new MutationObserver(() => {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        this.broadcastUpdate();
      }, 150);
    });
    this.observer.observe(targetNode, config);
  }

  public scanUI(): UIControlItem[] {
    if (typeof document === 'undefined') return [];
    const elements = document.querySelectorAll('[data-api-id]');
    const controls: UIControlItem[] = [];

    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
        return;
      }

      const rect = el.getBoundingClientRect();
      if (
        rect.width === 0 ||
        rect.height === 0 ||
        rect.bottom < 0 ||
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth
      ) {
        return;
      }

      controls.push({
        id: el.getAttribute('data-api-id') || '',
        text: (el as HTMLElement).innerText?.trim() || el.getAttribute('title') || '',
        action: el.getAttribute('data-api-action'),
        isActive: el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true',
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          centerX: Math.round(rect.x + rect.width / 2),
          centerY: Math.round(rect.y + rect.height / 2),
        },
      });
    });

    return controls;
  }

  public broadcastUpdate() {
    if (typeof window === 'undefined') return;
    const controls = this.scanUI();
    const event = new CustomEvent('terra-api-update', { detail: controls });
    window.dispatchEvent(event);
  }

  public getAppState() {
    const store = useAppStore.getState();
    const i18n = useI18nStore.getState();
    return {
      category: store.category,
      subMode: store.subMode,
      projection: store.projection,
      theme: store.theme,
      spaceMode: store.spaceMode,
      spaceLabelsVisible: store.spaceLabelsVisible,
      timeScale: store.timeScale,
      selectedCountryIso: store.selectedCountryIso,
      selectedContinent: store.selectedContinent,
      lang: i18n.lang,
      isDataReady: Boolean(dataLoader.getGeoJson()),
    };
  }

  public setCategory(cat: any) {
    useAppStore.getState().setCategory(cat);
  }

  public setSubMode(sub: any) {
    useAppStore.getState().setSubMode(sub);
  }

  public setProjection(p: 'globe' | 'mercator') {
    useAppStore.getState().setProjection(p);
  }

  public setSpaceMode(mode: any) {
    useAppStore.getState().setSpaceMode(mode);
  }

  public setTimeScale(scale: number) {
    useAppStore.getState().setTimeScale(scale);
  }

  public selectCountry(iso: string | null) {
    useAppStore.getState().selectCountry(iso as any);
  }
}

export const externalAPI = ExternalAPI.init();
