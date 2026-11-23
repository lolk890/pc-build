// PC Build — главная страница: подборка популярных товаров

const popularIds = [1, 2, 3, 4, 5, 6, 9, 12];

function renderPopularProducts() {
  const popularGrid = document.getElementById("popular-products");
  if (!popularGrid) return;

  popularGrid.innerHTML = "";

  if (typeof products === "undefined") {
    popularGrid.innerHTML =
      '<li class="lead">Ошибка: файл products.js не загружен</li>';
    return;
  }

  popularIds.forEach((id) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const li = document.createElement("li");
    li.className = "card fade-in";
    li.innerHTML = `
      <a href="product.html?id=${product.id}">
        <img src="${product.image}" alt="${product.name}" />
        <h3 class="card-title">${product.name}</h3>
        <p>${product.shortDesc || product.category}</p>
      </a>
    `;
    popularGrid.appendChild(li);
  });
}

renderPopularProducts();
