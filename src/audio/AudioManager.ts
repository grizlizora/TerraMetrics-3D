export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private warmFilter: BiquadFilterNode | null = null;
  private initialized = false;
  private activeVoices = 0;
  private maxVoices = 6;
  private flyOsc: OscillatorNode | null = null;
  private flyGain: GainNode | null = null;

  // Space Ambient Drone Nodes
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneLfo: OscillatorNode | null = null;
  private droneLfoGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private droneGain: GainNode | null = null;
  private droneActive = false;

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
      this.masterGain.gain.value = 0.28; // 28% master volume

      // Master warm acoustic filter to eliminate harsh high-frequency clipping
      this.warmFilter = this.ctx.createBiquadFilter();
      this.warmFilter.type = 'lowpass';
      this.warmFilter.frequency.value = 6500;
      this.warmFilter.Q.value = 0.707; // Butterworth gentle response

      this.masterGain.connect(this.warmFilter);
      this.warmFilter.connect(this.ctx.destination);
      this.initialized = true;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('Web Audio API could not be initialized:', e);
    }
  }

  public playSpatialTone(
    type: OscillatorType,
    freqStart: number,
    freqEnd: number | null,
    duration: number,
    volStart: number,
    volEnd: number = 0.001,
    panX: number = 0,
    distance: number = 1.0
  ) {
    this._playTone(type, freqStart, freqEnd, duration, volStart, volEnd, panX, distance);
  }

  private _playTone(
    type: OscillatorType,
    freqStart: number,
    freqEnd: number | null,
    duration: number,
    volStart: number,
    volEnd: number = 0.001,
    panX: number = 0,
    distance: number = 1.0
  ) {
    if (!this.initialized || !this.ctx) this.init();
    if (!this.ctx || !this.masterGain) return;
    if (this.activeVoices >= this.maxVoices) return;

    try {
      this.activeVoices++;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const voiceFilter = this.ctx.createBiquadFilter();

      // Warm tone shaping per voice
      voiceFilter.type = 'lowpass';
      voiceFilter.frequency.setValueAtTime(Math.min(3800, Math.max(freqStart, freqEnd || freqStart) * 3.5), t);
      voiceFilter.Q.value = 1.1;

      // Spatial distance attenuation
      const distAttenuation = 1.0 / Math.max(1.0, distance);
      const effectiveVol = volStart * distAttenuation;

      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, t);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 10), t + duration);
      }

      gain.gain.setValueAtTime(effectiveVol, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(volEnd * distAttenuation, 0.0001), t + duration);

      osc.connect(voiceFilter);
      voiceFilter.connect(gain);

      // Stereo Panner integration
      let lastNode: AudioNode = gain;
      if (this.ctx.createStereoPanner && Math.abs(panX) > 0.01) {
        try {
          const panner = this.ctx.createStereoPanner();
          panner.pan.setValueAtTime(Math.max(-1.0, Math.min(1.0, panX)), t);
          gain.connect(panner);
          lastNode = panner;
        } catch {}
      }

      lastNode.connect(this.masterGain);

      osc.onended = () => {
        try {
          osc.disconnect();
          voiceFilter.disconnect();
          gain.disconnect();
          if (lastNode !== gain) lastNode.disconnect();
        } catch {}
        this.activeVoices = Math.max(0, this.activeVoices - 1);
      };

      osc.start(t);
      osc.stop(t + duration);
    } catch {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    }
  }

  // --- Procedural Space Ambient Drone ---
  public startSpaceDrone() {
    if (this.droneActive) return;
    if (!this.initialized || !this.ctx) this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const t = this.ctx.currentTime;
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.0001, t);
      this.droneGain.gain.exponentialRampToValueAtTime(0.06, t + 3.0); // Smooth 3s cinematic fade-in

      // Resonant space atmospheric filter
      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(140, t);
      this.droneFilter.Q.setValueAtTime(3.5, t);

      // LFO for organic breath
      this.droneLfo = this.ctx.createOscillator();
      this.droneLfo.type = 'sine';
      this.droneLfo.frequency.setValueAtTime(0.08, t); // 0.08 Hz slow drift

      this.droneLfoGain = this.ctx.createGain();
      this.droneLfoGain.gain.setValueAtTime(45, t); // Filter modulation range +-45Hz
      this.droneLfo.connect(this.droneLfoGain);
      this.droneLfoGain.connect(this.droneFilter.frequency);

      // Dual sub-harmonic oscillators (F1 = 43.65Hz [F1], F2 = 65.41Hz [C2])
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(43.65, t);

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(65.41, t);

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      this.droneOsc1.start(t);
      this.droneOsc2.start(t);
      this.droneLfo.start(t);
      this.droneActive = true;
    } catch (e) {
      console.warn('Failed to start space drone:', e);
    }
  }

  private droneTimeout: any = null;

  public stopSpaceDrone() {
    if (!this.droneActive || !this.ctx || !this.droneGain) return;
    if (this.droneTimeout) {
      clearTimeout(this.droneTimeout);
      this.droneTimeout = null;
    }
    const osc1 = this.droneOsc1;
    const osc2 = this.droneOsc2;
    const lfo = this.droneLfo;
    const lfoGain = this.droneLfoGain;
    const filter = this.droneFilter;
    const gain = this.droneGain;

    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneLfo = null;
    this.droneLfoGain = null;
    this.droneFilter = null;
    this.droneGain = null;
    this.droneActive = false;

    try {
      const t = this.ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); // 1.5s smooth fade out

      this.droneTimeout = setTimeout(() => {
        try {
          osc1?.stop();
          osc2?.stop();
          lfo?.stop();
          osc1?.disconnect();
          osc2?.disconnect();
          lfo?.disconnect();
          try {
            if (filter?.frequency && lfoGain) lfoGain.disconnect(filter.frequency);
          } catch {}
          lfoGain?.disconnect();
          filter?.disconnect();
          gain?.disconnect();
        } catch {}
        this.droneTimeout = null;
      }, 1600);
    } catch {
      try {
        osc1?.disconnect();
        osc2?.disconnect();
        lfo?.disconnect();
        try {
          if (filter?.frequency && lfoGain) lfoGain.disconnect(filter.frequency);
        } catch {}
        lfoGain?.disconnect();
        filter?.disconnect();
        gain?.disconnect();
      } catch {}
    }
  }

  public isSpaceDroneActive(): boolean {
    return this.droneActive;
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

  // 2. Select continent (deep resonant bass with optional spatial pan)
  public playContinentSelect(panX: number = 0, distance: number = 1.0) {
    this._playTone('sine', 160, 90, 0.4, 0.6, 0.001, panX, distance);
  }

  public playSelectContinent(panX: number = 0, distance: number = 1.0) {
    this.playContinentSelect(panX, distance);
  }

  // 3. Select country (clear melodic ping with spatial 3D panning)
  public playCountrySelect(panX: number = 0, distance: number = 1.0) {
    this._playTone('sine', 320, 180, 0.25, 0.5, 0.001, panX, distance);
  }

  public playSelectCountry(panX: number = 0, distance: number = 1.0) {
    this.playCountrySelect(panX, distance);
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

      osc.onended = () => {
        try {
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };

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
    const oscToStop = this.flyOsc;
    const gainToStop = this.flyGain;
    this.flyOsc = null;
    this.flyGain = null;

    try {
      const t = this.ctx.currentTime;
      gainToStop.gain.cancelScheduledValues(t);
      gainToStop.gain.setValueAtTime(gainToStop.gain.value, t);
      gainToStop.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      oscToStop.onended = () => {
        try {
          oscToStop.disconnect();
          gainToStop.disconnect();
        } catch {}
      };
      oscToStop.stop(t + 0.3);
    } catch {
      try {
        oscToStop.disconnect();
        gainToStop.disconnect();
      } catch {}
    }
  }

  // 13. Celestial Object Hover In
  public playHoverIn(panX: number = 0, distance: number = 1.0) {
    this._playTone('sine', 880, 1320, 0.08, 0.12, 0.001, panX, distance);
  }

  // 14. Celestial Object Hover Out
  public playHoverOut(panX: number = 0, distance: number = 1.0) {
    this._playTone('sine', 1320, 880, 0.08, 0.08, 0.001, panX, distance);
  }
}

export const audioManager = new AudioManager();
