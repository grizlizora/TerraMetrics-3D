export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;
  private activeVoices = 0;
  private maxVoices = 4;
  private flyOsc: OscillatorNode | null = null;
  private flyGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.init();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('click', unlock);
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
      window.addEventListener('click', unlock, { once: true });

      // Handle visibility changes on mobile
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.ctx && this.ctx.state === 'running') {
          this.ctx.suspend().catch(() => {});
        } else if (!document.hidden && this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      });
    }
  }

  public init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.25; // 25% master volume
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('Web Audio API could not be initialized:', e);
    }
  }

  private _playTone(
    type: OscillatorType,
    freqStart: number,
    freqEnd: number | null,
    duration: number,
    volStart: number,
    volEnd: number = 0.001
  ) {
    if (!this.initialized || !this.ctx) this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.activeVoices >= this.maxVoices) return;

    try {
      this.activeVoices++;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, t);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 10), t + duration);
      }

      gain.gain.setValueAtTime(volStart, t);
      gain.gain.exponentialRampToValueAtTime(volEnd || 0.001, t + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
        this.activeVoices = Math.max(0, this.activeVoices - 1);
      };

      osc.start(t);
      osc.stop(t + duration);
    } catch {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    }
  }

  // 1. Select category/tab (soft crisp click)
  public playCategorySelect() {
    this._playTone('triangle', 1200, 1200, 0.08, 0.25);
  }

  public playClick() {
    this.playCategorySelect();
  }

  public playSwitchCategory() {
    this.playCategorySelect();
  }

  public playSwitchSubMode() {
    this.playCategorySelect();
  }

  public playOpenPanel() {
    this.playCategorySelect();
  }

  // 2. Select continent (deep resonant bass)
  public playContinentSelect() {
    this._playTone('sine', 160, 90, 0.4, 0.6);
  }

  public playSelectContinent() {
    this.playContinentSelect();
  }

  // 3. Select country (clear melodic ping)
  public playCountrySelect() {
    this._playTone('sine', 320, 180, 0.25, 0.5);
  }

  public playSelectCountry() {
    this.playCountrySelect();
  }

  // 4. Switch to 3D Globe
  public playTo3D() {
    this._playTone('sine', 300, 1100, 0.25, 0.35);
  }

  // 5. Switch to 2D Map
  public playTo2D() {
    this._playTone('sine', 1100, 300, 0.25, 0.35);
  }

  // 6. Light Theme
  public playThemeLight() {
    this._playTone('square', 520, 1040, 0.12, 0.15);
  }

  // 7. Dark Theme
  public playThemeDark() {
    this._playTone('square', 1040, 520, 0.12, 0.15);
  }

  // 8. Language toggle
  public playLanguageChange() {
    this._playTone('sine', 950, 950, 0.06, 0.25);
    setTimeout(() => this._playTone('sine', 1400, 1400, 0.08, 0.25), 70);
  }

  // 9. Close panel whoosh
  public playClosePanel() {
    if (!this.initialized || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.12);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  // 10. Search Tab
  public playSearchTab() {
    this._playTone('square', 750, 750, 0.04, 0.12);
  }

  // 11. Typing
  public playTyping() {
    this._playTone('triangle', 1800, 1800, 0.015, 0.04);
  }

  // 12. Camera Fly Sound
  public startFlySound() {
    if (!this.initialized || !this.ctx || !this.masterGain) return;
    this.stopFlySound();

    try {
      const t = this.ctx.currentTime;
      this.flyOsc = this.ctx.createOscillator();
      this.flyGain = this.ctx.createGain();

      this.flyOsc.type = 'sine';
      this.flyOsc.frequency.setValueAtTime(60, t);
      this.flyOsc.frequency.exponentialRampToValueAtTime(140, t + 1.2);

      this.flyGain.gain.setValueAtTime(0.001, t);
      this.flyGain.gain.exponentialRampToValueAtTime(0.03, t + 0.4);

      this.flyOsc.connect(this.flyGain);
      this.flyGain.connect(this.masterGain);

      this.flyOsc.start(t);
    } catch {}
  }

  public stopFlySound() {
    if (!this.ctx || !this.flyGain || !this.flyOsc) return;
    try {
      const t = this.ctx.currentTime;
      this.flyGain.gain.cancelScheduledValues(t);
      this.flyGain.gain.setValueAtTime(this.flyGain.gain.value, t);
      this.flyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      this.flyOsc.stop(t + 0.3);
      this.flyOsc = null;
      this.flyGain = null;
    } catch {}
  }

  // 13. Celestial Object Hover In
  public playHoverIn() {
    this._playTone('sine', 880, 1320, 0.08, 0.12);
  }

  // 14. Celestial Object Hover Out
  public playHoverOut() {
    this._playTone('sine', 1320, 880, 0.08, 0.08);
  }
}

export const audioManager = new AudioManager();
