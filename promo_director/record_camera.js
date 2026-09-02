const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🎥 Режисер: Запускаю студію для ручного запису рухів камери...');
  
  const browser = await chromium.launch({
    headless: false, // Відкриваємо браузер для користувача
    args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null // На весь екран
  });

  const page = await context.newPage();
  
  // Функція, яка дозволяє браузеру зберегти файл на комп'ютер (через Node.js)
  await page.exposeFunction('saveCameraPath', (pathData) => {
    fs.writeFileSync(path.join(__dirname, 'camera_path.json'), JSON.stringify(pathData, null, 2));
    console.log('✅ Режисер: Ваш рух камери успішно збережено у camera_path.json!');
    console.log('Тепер ви можете закрити браузер.');
  });

  await page.goto('http://localhost:5173');
  
  // Вмикаємо Систему автоматично
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    if (window.TerraMetricsAPI) window.TerraMetricsAPI.clickControl('space-advanced');
  });

  // Інжектимо UI для запису
  await page.evaluate(() => {
    const api = window.TerraMetricsAPI;
    const map = api.mapEngine.map;

    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.bottom = '50px';
    panel.style.left = '50%';
    panel.style.transform = 'translateX(-50%)';
    panel.style.zIndex = '999999';
    panel.style.padding = '20px';
    panel.style.background = 'rgba(0,0,0,0.8)';
    panel.style.border = '2px solid red';
    panel.style.borderRadius = '15px';
    panel.style.color = 'white';
    panel.style.textAlign = 'center';
    panel.style.fontFamily = 'sans-serif';

    const title = document.createElement('h3');
    title.innerText = '🔴 Запис руху камери';
    panel.appendChild(title);

    const desc = document.createElement('p');
    desc.innerText = 'Наведіть камеру на Місяць. Натисніть ПОЧАТИ, плавно рухайте глобус до Сонця, потім натисніть ЗУПИНИТИ.';
    panel.appendChild(desc);

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '10px';
    btnContainer.style.justifyContent = 'center';
    btnContainer.style.marginTop = '10px';

    const btnRecord = document.createElement('button');
    btnRecord.innerText = '🔴 ПОЧАТИ ЗАПИС';
    btnRecord.style.padding = '15px 30px';
    btnRecord.style.fontSize = '20px';
    btnRecord.style.background = 'red';
    btnRecord.style.color = 'white';
    btnRecord.style.border = 'none';
    btnRecord.style.borderRadius = '10px';
    btnRecord.style.cursor = 'pointer';
    
    const btnSave = document.createElement('button');
    btnSave.innerText = '✅ ЗБЕРЕГТИ ДУБЛЬ';
    btnSave.style.padding = '15px 30px';
    btnSave.style.fontSize = '20px';
    btnSave.style.background = 'green';
    btnSave.style.color = 'white';
    btnSave.style.border = 'none';
    btnSave.style.borderRadius = '10px';
    btnSave.style.cursor = 'pointer';
    btnSave.style.display = 'none';

    const btnDiscard = document.createElement('button');
    btnDiscard.innerText = '❌ ВИДАЛИТИ ДУБЛЬ';
    btnDiscard.style.padding = '15px 30px';
    btnDiscard.style.fontSize = '20px';
    btnDiscard.style.background = '#555';
    btnDiscard.style.color = 'white';
    btnDiscard.style.border = 'none';
    btnDiscard.style.borderRadius = '10px';
    btnDiscard.style.cursor = 'pointer';
    btnDiscard.style.display = 'none';

    let isRecording = false;
    let cameraPath = [];
    let recordInterval;
    let startTime;

    btnRecord.onclick = () => {
      if (!isRecording) {
        // Старт
        isRecording = true;
        btnRecord.innerText = '⏹ ЗУПИНИТИ';
        btnRecord.style.background = 'white';
        btnRecord.style.color = 'red';
        btnSave.style.display = 'none';
        btnDiscard.style.display = 'none';
        
        cameraPath = [];
        startTime = Date.now();
        
        recordInterval = setInterval(() => {
          cameraPath.push({
            time: Date.now() - startTime,
            center: map.getCenter(),
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            bearing: map.getBearing()
          });
        }, 50); // Записуємо кожні 50мс (20 кадрів в секунду)
        
      } else {
        // Стоп
        isRecording = false;
        clearInterval(recordInterval);
        btnRecord.innerText = '🔴 ПЕРЕЗАПИСАТИ';
        btnRecord.style.background = 'red';
        btnRecord.style.color = 'white';
        btnSave.style.display = 'block';
        btnDiscard.style.display = 'block';
      }
    };
    
    btnSave.onclick = () => {
        btnSave.innerText = '✅ ЗБЕРЕЖЕНО!';
        btnSave.disabled = true;
        btnRecord.style.display = 'none';
        btnDiscard.style.display = 'none';
        window.saveCameraPath(cameraPath); // Викликає Node.js функцію
    };

    btnDiscard.onclick = () => {
        cameraPath = [];
        btnRecord.innerText = '🔴 ПОЧАТИ ЗАПИС';
        btnSave.style.display = 'none';
        btnDiscard.style.display = 'none';
    };

    btnContainer.appendChild(btnRecord);
    btnContainer.appendChild(btnSave);
    btnContainer.appendChild(btnDiscard);
    panel.appendChild(btnContainer);
    document.body.appendChild(panel);
  });

  console.log('🔴 Студія відкрита! Перейдіть у відкритий браузер і запишіть свій рух!');
})();
