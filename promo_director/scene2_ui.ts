const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

(async () => {
  console.log('🎥 Режисер: Запускаю Сцену 2 (Демонстрація всього UI та глобальна аналітика)...');
  
  const browser = await chromium.launch({
    headless: false, // Можемо зробити true, але краще бачити процес
    args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'light'
  });

  const page = await context.newPage();
  
  // Функція для імітації "кінематографічного" кліку
  async function slowClick(selector, delayMs = 1500) {
    await page.waitForTimeout(delayMs);
    console.log(`🖱️ Клік: ${selector}`);
    await page.click(selector);
  }
  
  const videoPath = path.join(__dirname, 'output', `promo_hq_${Date.now()}.mp4`);
  console.log(`🔴 Вмикаю пряме захоплення Вкладки Браузера (1080p, High Quality) -> ${videoPath}`);
  
  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-c:v', 'mjpeg',
    '-r', '60', // 60 FPS для плавності
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18', // Найвища якість без втрат
    '-pix_fmt', 'yuv420p',
    videoPath
  ]);

  let lastFrame = null;
  const client = await page.context().newCDPSession(page);
  client.on('Page.screencastFrame', async (payload) => {
    lastFrame = Buffer.from(payload.data, 'base64');
    await client.send('Page.screencastFrameAck', { sessionId: payload.sessionId }).catch(()=>{});
  });

  // Записуємо останній отриманий кадр 60 разів на секунду
  const frameInterval = setInterval(() => {
    if (lastFrame && !ffmpeg.stdin.destroyed) {
      try {
        ffmpeg.stdin.write(lastFrame);
      } catch (e) {}
    }
  }, 1000 / 60);

  // Запуск високоякісного потоку (тільки вкладка, без ОС меню)
  await client.send('Page.startScreencast', { format: 'jpeg', quality: 100, everyNthFrame: 1 });
  
  // Запуск
  await page.goto('http://localhost:5173');
  console.log('🌍 Очікую завантаження світу...');
  
  await page.waitForTimeout(4000); // Чекаємо повного старту і появи 3D
  
  // Функція для плавного скролу в панелі статистики
  async function scrollStatsPanel() {
    await page.evaluate(async () => {
      const panel = document.getElementById('stats-panel');
      if (!panel) return;
      
      let totalHeight = 0;
      const distance = 2; // швидкість скролу
      const timer = setInterval(() => {
        panel.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= panel.scrollHeight - panel.clientHeight) {
          clearInterval(timer);
        }
      }, 10);
    });
    await page.waitForTimeout(1000);
  }

  // 1. Перехід з 3D в 2D і назад
  console.log('🎬 Крок 1: 3D -> 2D -> 3D');
  await slowClick('#btn-2d', 1000);
  await slowClick('#btn-3d', 3000);

  // 2. Зміна на чорну тему
  console.log('🎬 Крок 2: Зміна теми');
  await slowClick('#btn-theme', 2000);

  // 3. Зміна мови (клік один раз, як просив користувач)
  console.log('🎬 Крок 3: Зміна мови');
  await slowClick('#lang-toggle', 2000);

  // 4. Перехід в режим Зірок
  console.log('🎬 Крок 4: Режим Зірок');
  await slowClick('#btn-space-basic', 2000);

  // 5. Перехід в Систему
  console.log('🎬 Крок 5: Режим Система (Сонце і Місяць)');
  await slowClick('#btn-space-advanced', 2000);

  // 6. Вимкнути/Увімкнути позначки
  console.log('🎬 Крок 6: Вмикання/вимикання позначок');
  await slowClick('#btn-space-labels', 2000); // вимкнути
  await slowClick('#btn-space-labels', 2000); // увімкнути

  // 7. Далекий космос
  console.log('🎬 Крок 7: Далекий космос');
  await slowClick('#btn-deep-space', 2000);
  await page.waitForTimeout(4000); // Дати час на розворот галактик та сузір'їв

  // 8. Наведення на Сонце і Місяць (Сцена 1 - інтеграція)
  console.log('🎬 Крок 8: Проліт до Місяця та Сонця');
  await page.evaluate(() => {
    const api = window.TerraMetricsAPI;
    const map = api.mapEngine.map;
    
    // Ідеальна траєкторія зі Сцени 1
    const startPos = { lng: -63.938, lat: 5.404, zoom: 1.5, pitch: 10 };
    const midPos = { lng: 172.436, lat: -2.809, zoom: 1.5, pitch: 10 }; 
    const endPos = { lng: 86.900, lat: 31.567, zoom: 1.27, pitch: 10 };
    
    map.jumpTo({ center: [startPos.lng, startPos.lat], zoom: startPos.zoom, pitch: startPos.pitch, bearing: 0 });
    
    setTimeout(() => {
      map.easeTo({
        center: [midPos.lng, midPos.lat], zoom: midPos.zoom, pitch: midPos.pitch, bearing: 0,
        duration: 6800, easing: t => t * t
      });
    }, 1000);

    setTimeout(() => {
      map.easeTo({
        center: [endPos.lng, endPos.lat], zoom: endPos.zoom, pitch: endPos.pitch, bearing: 0,
        duration: 6700, easing: t => t * (2 - t)
      });
    }, 7800);
  });
  
  await page.waitForTimeout(18000); // Чекаємо завершення космічного прольоту

  // 9. Пошук країни та проклікування режимів
  console.log('🎬 Крок 9: Аналітика (Україна)');
  await page.type('#search-input', 'Ukraine', { delay: 200 }); // Реалістичний ввід тексту
  await page.waitForTimeout(1000);
  // Клік по першому результату
  await page.click('.search-item');
  console.log('🚀 Летимо до України...');
  await page.waitForTimeout(4500); // Чекаємо політ і відкриття панелі

  // -------------------- СУСПІЛЬСТВО --------------------
  await slowClick('#cat-society', 500);
  await slowClick('#mode-religion', 1500);
  await scrollStatsPanel();
  await slowClick('#mode-population', 1500);
  await scrollStatsPanel();
  await slowClick('#mode-demographics', 1500); 
  await scrollStatsPanel();

  // -------------------- ДЕРЖАВА --------------------
  await slowClick('#cat-state', 1000);
  await slowClick('#mode-economy', 1500);
  await scrollStatsPanel();
  await slowClick('#mode-politics', 1500);
  await scrollStatsPanel();
  await slowClick('#mode-military', 1500);
  await scrollStatsPanel();

  // -------------------- ПРИРОДА --------------------
  await slowClick('#cat-nature', 1000);
  await slowClick('#mode-climate', 1500);
  await scrollStatsPanel();
  
  // Відкриваємо деталі погоди
  console.log('🌤️ Відкриваємо модальне вікно погоди...');
  await slowClick('#btn-climate-details', 1500);
  await page.waitForTimeout(4000); // Дати глядачу час почитати погоду і річні температури
  await slowClick('#close-climate-modal', 500);

  await slowClick('#mode-geography', 1500);
  await scrollStatsPanel();
  await slowClick('#mode-resources', 1500);
  await scrollStatsPanel();

  // 10. Пошук по континентам
  console.log('🎬 Крок 10: Аналітика (Європа)');
  await slowClick('#tab-continents', 1000);
  await page.type('#search-input', 'Europe', { delay: 200 }); // Реалістичний ввід тексту
  await page.waitForTimeout(1000);
  await page.click('.search-item');
  console.log('🚀 Летимо до Європи...');
  await page.waitForTimeout(4500);

  // Цикл по континенту (Суспільство)
  await slowClick('#cat-society', 500);
  await slowClick('#mode-religion', 1500);
  await scrollStatsPanel();
  await slowClick('#mode-population', 1500);
  await scrollStatsPanel();
  await slowClick('#mode-demographics', 1500);
  await scrollStatsPanel();

  // Держава
  await slowClick('#cat-state', 1000);
  await slowClick('#mode-economy', 1500);
  await scrollStatsPanel();
  await slowClick('#mode-politics', 1500);
  await scrollStatsPanel();
  await slowClick('#mode-military', 1500);
  await scrollStatsPanel();

  // Природа
  await slowClick('#cat-nature', 1000);
  await slowClick('#mode-climate', 1500);
  await scrollStatsPanel();
  await slowClick('#mode-geography', 1500);
  await scrollStatsPanel();
  await slowClick('#mode-resources', 1500);
  await scrollStatsPanel();

  console.log('🎬 Сцену 2 успішно знято! Зупиняю запис вкладки...');
  
  clearInterval(frameInterval);
  await client.send('Page.stopScreencast').catch(()=>{});
  ffmpeg.stdin.end();
  
  await page.waitForTimeout(4000); // Даємо ffmpeg час докодувати відео

  await context.close();
  await browser.close();
  console.log('✅ Готово! Ваше ідеальне MP4 відео збережено.');
})();
