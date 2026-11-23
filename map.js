async function loadMap() {
  const container = document.getElementById("map-block");
  if (!container) return;

  // Адрес твоего магазина (поменяй на свой)
  const address = "Санкт-Петербург, Невский проспект, 114, ТЦ Невский Центр";

  // 1. Индикатор загрузки
  container.innerHTML =
    '<p class="map-loading"><span class="spinner"></span>Загрузка карты...</p>';

  try {
    // 2. Запрос через fetch к внешнему API
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url, {
      headers: { "Accept-Language": "ru" },
    });

    // 3. Проверка ответа
    if (!response.ok) {
      throw new Error(`Сервер вернул ошибку ${response.status}`);
    }

    const data = await response.json();

    // 4. Проверяем, что что-то нашли
    if (!data || data.length === 0) {
      throw new Error("Адрес не найден");
    }

    const lat = data[0].lat;
    const lon = data[0].lon;
    const displayName = data[0].display_name;

    // 5. Показываем карту OpenStreetMap через iframe с полученными координатами
    container.innerHTML = `
      <div class="map-wrapper">
        <iframe
          width="100%"
          height="350"
          frameborder="0"
          scrolling="no"
          marginheight="0"
          marginwidth="0"
          src="https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lon) - 0.01}%2C${parseFloat(lat) - 0.005}%2C${parseFloat(lon) + 0.01}%2C${parseFloat(lat) + 0.005}&layer=mapnik&marker=${lat}%2C${lon}"
          title="Карта: ${displayName}"
        ></iframe>
        <p class="map-address">${displayName}</p>
      </div>
    `;
  } catch (error) {
    // 6. Обработка ошибки сети
    container.innerHTML = `
      <div class="map-error">
        <p>Не удалось загрузить карту</p>
        <p class="map-hint">Проверьте подключение к интернету или попробуйте позже</p>
      </div>
    `;
    console.error("Ошибка загрузки карты:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadMap);
