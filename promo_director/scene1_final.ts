const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const rawPath = JSON.parse(fs.readFileSync(path.join(__dirname, 'camera_path.json'), 'utf8'));

  const browser = await chromium.launch({
    headless: false,
    args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--start-maximized']
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
  
  await page.waitForTimeout(3000);

  // Виставляємо камеру на стартову позицію ЩЕ ДО увімкнення Космосу, щоб не було ривка
  await page.evaluate((firstFrame) => {
    window.TerraMetricsAPI.mapEngine.map.jumpTo({
      center: [firstFrame.center.lng, firstFrame.center.lat],
      zoom: firstFrame.zoom,
      pitch: firstFrame.pitch,
      bearing: 0
    });
  }, rawPath[0]);

  await page.waitForTimeout(1000);

  // Вмикаємо Космос
  await page.evaluate(() => {
    window.TerraMetricsAPI.clickControl('space-advanced');
  });

  await page.waitForTimeout(2000);

  // Відтворюємо точні рухи користувача, які він записав, без жодних змін
  await page.evaluate(async (pathData) => {
    const map = window.TerraMetricsAPI.mapEngine.map;
    
    // Переконуємось, що ми стоїмо на першому кадрі перед запуском анімації
    map.jumpTo({
      center: [pathData[0].center.lng, pathData[0].center.lat],
      zoom: pathData[0].zoom,
      pitch: pathData[0].pitch,
      bearing: 0
    });

    return new Promise(resolve => {
      let startTime = null;
      const duration = pathData[pathData.length - 1].time;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        let currentFrame = pathData[pathData.length - 1];
        
        // Знаходимо точний записаний кадр для поточного часу
        for (let i = 0; i < pathData.length - 1; i++) {
          if (elapsed >= pathData[i].time && elapsed <= pathData[i+1].time) {
            const f1 = pathData[i];
            const f2 = pathData[i+1];
            const t = (elapsed - f1.time) / (f2.time - f1.time);
            
            currentFrame = {
              center: {
                lng: f1.center.lng + (f2.center.lng - f1.center.lng) * t,
                lat: f1.center.lat + (f2.center.lat - f1.center.lat) * t
              },
              zoom: f1.zoom + (f2.zoom - f1.zoom) * t,
              pitch: f1.pitch + (f2.pitch - f1.pitch) * t
            };
            break;
          }
        }

        map.jumpTo({
          center: [currentFrame.center.lng, currentFrame.center.lat],
          zoom: currentFrame.zoom,
          pitch: currentFrame.pitch,
          bearing: 0
        });

        if (elapsed < duration) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }, rawPath);

  await page.waitForTimeout(2000);
  
  await context.close();
  await browser.close();
})();
