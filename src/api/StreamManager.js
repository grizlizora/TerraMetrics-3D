export class StreamManager {
  constructor() {
    this.currentStream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  /**
   * Починає пряму трансляцію всього вікна (WebGL + UI)
   * @param {Object} options - Налаштування (fps, width, height)
   * @returns {Promise<MediaStream>} Об'єкт відеопотоку
   */
  async startLiveStream(options = {}) {
    const fps = options.fps || 60;
    
    // Налаштування для захоплення
    const constraints = {
      video: {
        displaySurface: "browser",
        frameRate: { ideal: fps, max: fps }
      },
      audio: false,
      preferCurrentTab: true // Підказка браузеру вибрати поточну вкладку
    };

    if (options.width) constraints.video.width = { ideal: options.width };
    if (options.height) constraints.video.height = { ideal: options.height };

    try {
      this.currentStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      console.log(`[StreamManager] Stream started (Target FPS: ${fps})`);
      
      // Автоматичне очищення при зупинці потоку користувачем
      this.currentStream.getVideoTracks()[0].onended = () => {
        this.stopLiveStream();
      };
      
      return this.currentStream;
    } catch (error) {
      console.error('[StreamManager] Error starting stream:', error);
      throw error;
    }
  }

  /**
   * Зупиняє активну трансляцію
   */
  stopLiveStream() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
      console.log('[StreamManager] Stream stopped');
    }
  }

  /**
   * Починає трансляцію і відразу записує її у відеофайл
   * @param {Object} options - Налаштування (fps, width, height, bitrate)
   */
  async recordStream(options = {}) {
    try {
      const stream = await this.startLiveStream(options);
      const bitrate = options.bitrate || 8000000; // 8 Mbps за замовчуванням для високої якості

      // Вибір найкращого підтримуваного кодеку
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
        mimeType = 'video/webm; codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4'; // Safari fallback
      }

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: bitrate
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.saveRecording();
      };

      this.mediaRecorder.start(1000); // Записувати чанками по 1 секунді для стабільності
      console.log(`[StreamManager] Recording started (${bitrate / 1000000} Mbps)`);
      return true;
    } catch (error) {
      console.error('[StreamManager] Recording failed to start:', error);
      return false;
    }
  }

  /**
   * Зупиняє запис і завантажує файл
   */
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.stopLiveStream();
  }

  /**
   * Внутрішній метод для збереження зібраних чанків у файл
   */
  saveRecording() {
    if (this.recordedChunks.length === 0) return;
    
    const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType });
    const url = URL.createObjectURL(blob);
    
    // Створення невидимого посилання для скачування
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    
    const ext = this.mediaRecorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
    a.download = `TerraMetrics_Recording_${new Date().getTime()}.${ext}`;
    a.click();
    
    // Очищення
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    this.recordedChunks = [];
  }
}
