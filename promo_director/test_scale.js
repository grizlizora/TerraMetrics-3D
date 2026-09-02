const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🎥 Починаємо тестову зйомку для перевірки масштабу (1080p)...');
  
  const browser = await chromium.launch({
    headless: false, // Відкриваємо фізичне вікно, щоб відпрацював WebGL на повну потужність
    args: [
      '--enable-gpu-rasterization',
      '--ignore-gpu-blocklist',
      '--enable-zero-copy'
    ]
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
  
  console.log('🌍 Завантаження додатку http://localhost:5173 ...');
  // Переконайтеся, що ваш локальний сервер (npm run dev) запущено!
  await page.goto('http://localhost:5173');

  // Даємо час на повне завантаження глобусу, зірок і UI
  await page.waitForTimeout(6000);
  
  console.log('✅ Знято 6 секунд відео. Завершення...');

  // Закриття контексту зберігає відеофайл
  await context.close();
  await browser.close();

  console.log('✅ Тестове відео успішно збережено у папці promo_director/output!');
})();
