export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Загальна гучність 30%
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;

      // Розблокування аудіоконтексту для iOS/Chrome
      if (this.ctx.state === 'suspended') {
        const resumeAudio = () => {
          this.ctx.resume();
          document.removeEventListener('click', resumeAudio);
        };
        document.addEventListener('click', resumeAudio);
      }
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser", e);
    }
  }

  _playTone(type, freqStart, freqEnd, duration, volStart, volEnd) {
    if (!this.initialized || !this.ctx) this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
    }

    gain.gain.setValueAtTime(volStart, t);
    gain.gain.exponentialRampToValueAtTime(volEnd || 0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // 1. Кнопки космосу зліва (глухий високотехнологічний пінг)
  playSpaceMode() {
    this._playTone('sine', 800, 400, 0.2, 0.5, 0.001);
  }

  // 2. 3 категорії та 3 підрежими (м'який клік)
  playCategorySelect() {
    this._playTone('triangle', 1200, 1200, 0.1, 0.3, 0.001);
  }

  // 3. Вибір континенту (глибокий бас)
  playContinentSelect() {
    this._playTone('sine', 150, 80, 0.5, 0.7, 0.001);
  }

  // 3.5 Вибір країни (трохи вищий, дзвінкіший бас)
  playCountrySelect() {
    this._playTone('sine', 250, 150, 0.3, 0.6, 0.001);
  }

  // Наведення на країну (дуже короткий, м'який клік, щоб не дратував при швидкому русі)
  playCountryHover() {
    this._playTone('sine', 800, 1000, 0.03, 0.05, 0.001);
  }

  // 4. Перехід в 3D (свист вгору)
  playTo3D() {
    this._playTone('sine', 300, 1200, 0.3, 0.4, 0.001);
  }

  // 5. Перехід в 2D (свист вниз)
  playTo2D() {
    this._playTone('sine', 1200, 300, 0.3, 0.4, 0.001);
  }

  // 6. Світла тема (дзвінкий акорд)
  playThemeLight() {
    this._playTone('square', 440, 880, 0.15, 0.2, 0.001);
    setTimeout(() => this._playTone('square', 660, 1320, 0.2, 0.2, 0.001), 50);
  }

  // 7. Темна тема (приглушений акорд вниз)
  playThemeDark() {
    this._playTone('square', 880, 440, 0.15, 0.2, 0.001);
    setTimeout(() => this._playTone('square', 660, 330, 0.2, 0.2, 0.001), 50);
  }

  // 8. Зміна мови (швидкий подвійний дзвіночок)
  playLanguageChange() {
    this._playTone('sine', 1000, 1000, 0.08, 0.3, 0.001);
    setTimeout(() => this._playTone('sine', 1500, 1500, 0.1, 0.3, 0.001), 80);
  }

  // 9. Закриття панелі (хрестик) - швидкий "свайп" вниз
  playClosePanel() {
    if (!this.initialized || !this.ctx) this.init();
    if (!this.ctx) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    
    // Lowpass filter to make it sound like a soft "whoosh/close"
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // 10. Наведення на космічний об'єкт (дуже м'який високий звук)
  playHoverIn() {
    this._playTone('sine', 1500, 1800, 0.05, 0.1, 0.001);
  }

  // 11. Відведення від космічного об'єкту (дуже м'який низький звук)
  playHoverOut() {
    this._playTone('sine', 1800, 1500, 0.05, 0.1, 0.001);
  }

  // 12. Перемикання вкладок пошуку
  playSearchTab() {
    this._playTone('square', 800, 800, 0.05, 0.15, 0.001);
  }

  // 13. Звук вводу тексту (друкування)
  playTyping() {
    this._playTone('triangle', 2000, 2000, 0.02, 0.05, 0.001);
  }

  // 14. Звук польоту (зуму) камери
  startFlySound() {
    if (!this.initialized || !this.ctx) this.init();
    if (!this.ctx) return;
    
    this.stopFlySound();
    
    const t = this.ctx.currentTime;
    this.flyOsc = this.ctx.createOscillator();
    this.flyGain = this.ctx.createGain();
    
    // Використовуємо дуже м'який синус (або трикутник) для "свисту" польоту
    this.flyOsc.type = 'sine';
    
    // Дуже плавна і низька зміна частоти
    this.flyOsc.frequency.setValueAtTime(50, t);
    this.flyOsc.frequency.exponentialRampToValueAtTime(150, t + 1.5);
    
    // Дуже низька гучність (ледве чутно)
    this.flyGain.gain.setValueAtTime(0.001, t);
    this.flyGain.gain.exponentialRampToValueAtTime(0.04, t + 0.5); // Максимальна гучність лише 4%
    
    this.flyOsc.connect(this.flyGain);
    this.flyGain.connect(this.masterGain);
    
    this.flyOsc.start(t);
  }

  stopFlySound() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    if (this.flyGain && this.flyOsc) {
      this.flyGain.gain.cancelScheduledValues(t);
      this.flyGain.gain.setValueAtTime(this.flyGain.gain.value, t);
      // Дуже плавне згасання
      this.flyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      this.flyOsc.stop(t + 0.5);
      this.flyOsc = null;
      this.flyGain = null;
    }
  }
}
