const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🎥 Режисер: Запускаю Сцену 1 (Пошук Місяця та Сонця через обертання Землі)...');
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'dark',
    recordVideo: {
      dir: path.join(__dirname, 'output'),
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();
  await page.goto('http://localhost:5173');
  console.log('🌍 Режисер: Очікую завантаження світу...');
  await page.waitForTimeout(4000);

  console.log('🎬 Режисер: Вмикаю космічну систему...');
  await page.evaluate(() => {
    window.TerraMetricsAPI.clickControl('space-advanced');
  });
  await page.waitForTimeout(4000);

  console.log('🎥 Режисер: Місяць зафіксовано зліва. Починаю кінематографічний дугоподібний проліт (за вашими координатами)...');

  await page.evaluate(async () => {
    const api = window.TerraMetricsAPI;
    const map = api.mapEngine.map;
    
    // Точні ключові кадри з вашого ручного запису (camera_path.json)
    // Ви ідеально зловили Місяць на [20, 20] і Сонце на [-169.6, 27.8]
    const startPos = { lng: -63.938, lat: 5.404, zoom: 1.5, pitch: 10 };
    const midPos = { lng: 172.436, lat: -2.809, zoom: 1.5, pitch: 10 }; 
    const endPos = { lng: 86.900, lat: 31.567, zoom: 1.27, pitch: 10 };
    
    // Спочатку ставимо камеру на вашу стартову точку
    map.jumpTo({
      center: [startPos.lng, startPos.lat],
      zoom: startPos.zoom,
      pitch: startPos.pitch,
      bearing: 0
    });

    return new Promise(resolve => {
      // Даємо карті секунду "видихнути" після jumpTo, щоб не було мікро-фрізів
      setTimeout(() => {
        // Перша половина дуги 
        map.easeTo({
          center: [midPos.lng, midPos.lat],
          pitch: midPos.pitch,
          zoom: midPos.zoom,
          bearing: 0,
          duration: 6800, 
          easing: (t) => t * t // Плавний розгін
        });
        
        setTimeout(() => {
          // Друга половина дуги
          map.easeTo({
            center: [endPos.lng, endPos.lat],
            pitch: endPos.pitch,
            zoom: endPos.zoom,
            bearing: 0,
            duration: 6700,
            easing: (t) => t * (2 - t) // Плавне гальмування
          });
          
          setTimeout(resolve, 7000);
        }, 6800);
      }, 1000);
    });
  });

  console.log('✅ Режисер: Зйомку Сцени 1 завершено!');
  
  await context.close();
  await browser.close();
})();
