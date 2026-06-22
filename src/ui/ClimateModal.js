/**
 * ClimateModal — окремий модуль для спливаючого вікна клімату.
 * Ініціалізується одразу при імпорті, не залежить від mapEngine.init().
 * window.showClimateModal буде доступний СИНХРОННО після імпорту.
 */

const monthsUK = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function initClimateModal() {
  const modal = document.getElementById('climate-modal');
  const closeBtn = document.getElementById('close-climate-modal');

  if (!modal) {
    console.warn('[ClimateModal] Modal element not found in DOM');
    return;
  }

  // Close handlers
  closeBtn.onclick = () => { modal.style.display = 'none'; };
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // Expose global function — synchronously available right after initClimateModal()
  window.showClimateModal = async (isoA3, countryName, lat, lng) => {
    const title   = document.getElementById('climate-modal-title');
    const loading = document.getElementById('climate-loading');
    const content = document.getElementById('climate-content');
    const lang    = localStorage.getItem('religion_map_lang') || 'uk';
    const isUk    = lang === 'uk';

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
        `&timezone=auto`;

      const res  = await fetch(url);
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();

      if (!data || !data.current) throw new Error('No data from Open-Meteo');

      const { temperature_2m: temp, wind_speed_10m: wind, relative_humidity_2m: hum } = data.current;

      document.getElementById('climate-current-temp').textContent     = `${temp > 0 ? '+' : ''}${temp}°C`;
      document.getElementById('climate-current-wind').textContent     = `${wind} ${isUk ? 'км/год' : 'km/h'}`;
      document.getElementById('climate-current-humidity').textContent = `${hum}%`;

      // Monthly averages (procedural by latitude)
      const isNorth   = lat >= 0;
      const isEquator = Math.abs(lat) < 15;
      const avgTemp   = 30 - Math.abs(lat) * 0.7;
      const amplitude = isEquator ? 2 : Math.abs(lat) * 0.5;
      const months    = isUk ? monthsUK : monthsEN;

      const container = document.getElementById('climate-annual-months');
      container.innerHTML = '';

      for (let m = 0; m < 12; m++) {
        const offset = isNorth
          ? amplitude * Math.cos((m - 6) * Math.PI / 6)
          : amplitude * Math.cos(m * Math.PI / 6);
        const mTemp = Math.round(avgTemp + offset);

        let col = '#3498db';
        if (mTemp > 25)     col = '#e74c3c';
        else if (mTemp > 15) col = '#f39c12';
        else if (mTemp > 5)  col = '#f1c40f';
        else if (mTemp < 0)  col = '#2980b9';

        container.innerHTML += `
          <div style="background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);
               padding:0.625rem 2px;border-radius:0.75rem;text-align:center;">
            <div style="font-size:0.75rem;color:var(--text-secondary);">${months[m]}</div>
            <div style="font-size:1rem;font-weight:700;color:${col};margin-top:0.25rem;">${mTemp > 0 ? '+'+mTemp : mTemp}°</div>
          </div>`;
      }

      // Season badge
      const currentMonth = new Date().getMonth();
      let season = isUk ? 'Цілорічне літо' : 'Year-round summer';
      if (!isEquator) {
        if (currentMonth >= 2 && currentMonth <= 4)  season = isNorth ? (isUk ? 'Весна'  : 'Spring') : (isUk ? 'Осінь' : 'Autumn');
        else if (currentMonth >= 5 && currentMonth <= 7)  season = isNorth ? (isUk ? 'Літо'   : 'Summer') : (isUk ? 'Зима'  : 'Winter');
        else if (currentMonth >= 8 && currentMonth <= 10) season = isNorth ? (isUk ? 'Осінь'  : 'Autumn') : (isUk ? 'Весна' : 'Spring');
        else                                              season = isNorth ? (isUk ? 'Зима'   : 'Winter') : (isUk ? 'Літо'  : 'Summer');
      }

      const badge = document.getElementById('climate-season-badge');
      if (badge) {
        badge.textContent = `${isUk ? 'Зараз' : 'Now'}: ${season}`;
        const seasonColors = { Зима: '#3498db', Winter: '#3498db', Літо: '#e74c3c', Summer: '#e74c3c', Весна: '#27ae60', Spring: '#27ae60', Осінь: '#d35400', Autumn: '#d35400' };
        badge.style.background = seasonColors[season] || 'var(--accent-color)';
      }

      // Показуємо модальне вікно ТІЛЬКИ після успішного парсингу даних (щоб уникнути мігтіння)
      title.textContent = `🌤️ ${isUk ? 'Погода' : 'Weather'}: ${countryName}`;
      modal.style.display = 'flex';
      loading.style.display = 'none';
      content.style.display = 'block';
    } catch (err) {
      console.error('[ClimateModal] API error:', err);
      title.textContent = `🌤️ ${isUk ? 'Погода' : 'Weather'}: ${countryName}`;
      modal.style.display = 'flex';
      loading.innerHTML = `<div style="color:#e74c3c;text-align:center;padding:1.25rem;">
        ${isUk ? 'Помилка завантаження даних' : 'Failed to load data'}</div>`;
    }
  };

  console.log('[ClimateModal] ✅ window.showClimateModal initialized');
}
