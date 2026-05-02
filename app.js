let dishes = [];
let currentOrder = JSON.parse(localStorage.getItem('cart') || '{}');

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(currentOrder));
}

let currentCategory = 'all';

// Initialize
async function init() {
  try {
    const response = await fetch('http://localhost:3000/api/dishes');
    dishes = await response.json();
    renderDishes();
    setupCategoryButtons();
    updateOrderSummary();

    fetchStats();
    setInterval(fetchStats, 30000);
  } catch (error) {
    console.error('Error fetching dishes:', error);
    document.getElementById('dishes-container').innerHTML =
      '<p class="no-dishes">Failed to load dishes.</p>';
  }
}

// Category buttons
function setupCategoryButtons() {
  const buttons = document.querySelectorAll('.category-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-category');
      renderDishes();
    });
  });
}

// Render dishes
function renderDishes() {
  const container = document.getElementById('dishes-container');
  container.innerHTML = '';

  const filtered = currentCategory === 'all'
    ? dishes
    : dishes.filter(d => d.category === currentCategory);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="no-dishes">No dishes available.</p>';
    return;
  }

  filtered.forEach(dish => {
    const card = document.createElement('div');
    card.className = 'dish-card';
    card.innerHTML = `
      <img src="${dish.image_url}" alt="${dish.name}">
      <div class="dish-info">
        <h3>${dish.name}</h3>
        <p>${dish.description}</p>
        <p>₹${parseInt(dish.price).toLocaleString('en-IN')}</p>
        <button onclick="addToOrder(${dish.id})">Add to Cart</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Add item
function addToOrder(id) {
  const dish = dishes.find(d => d.id === id);
  if (!dish) return;

  if (!currentOrder[id]) {
    currentOrder[id] = { ...dish, quantity: 1 };
  } else {
    currentOrder[id].quantity++;
  }

  saveCart();
  updateOrderSummary();
}

// Remove item
function removeFromOrder(id) {
  if (!currentOrder[id]) return;

  if (currentOrder[id].quantity > 1) {
    currentOrder[id].quantity--;
  } else {
    delete currentOrder[id];
  }

  saveCart();
  updateOrderSummary();
}

// Update cart UI
function updateOrderSummary() {
  const list = document.getElementById('order-items');
  const totalEl = document.getElementById('order-total');

  if (!list || !totalEl) return;

  list.innerHTML = '';

  let total = 0;

  for (const id in currentOrder) {
    const item = currentOrder[id];
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const div = document.createElement('div');
    div.className = 'order-item';
    div.innerHTML = `
      ${item.name}
      <button onclick="removeFromOrder(${item.id})">➖</button>
      ${item.quantity}
      <button onclick="addToOrder(${item.id})">➕</button>
      - ₹${parseInt(itemTotal).toLocaleString('en-IN')}
    `;
    list.appendChild(div);
  }

  totalEl.textContent = 'Total: ₹' + parseInt(total).toLocaleString('en-IN');

  if (Object.keys(currentOrder).length === 0) {
    list.innerHTML = '<p>No items yet</p>';
  }
}

// Notification
function showNotification(msg) {
  const notif = document.getElementById('notification');
  if (!notif) return;

  notif.textContent = msg;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), 3000);
}

// 👉 Go to Order Page Button (SAFE)
const goBtn = document.getElementById('go-to-order-btn');

if (goBtn) {
  goBtn.addEventListener('click', () => {
    if (Object.keys(currentOrder).length === 0) {
      showNotification('Your cart is empty!');
      return;
    }

    localStorage.setItem('cart', JSON.stringify(currentOrder));
    window.location.href = 'order.html';
  });
}

// Delivery stats
async function fetchStats() {
  try {
    const res = await fetch("http://localhost:3000/api/stats");
    const data = await res.json();

    const timeEl = document.getElementById("delivery-time");
    const ordersEl = document.getElementById("active-orders");

    if (timeEl) timeEl.textContent = data.estimatedTime;
    if (ordersEl) ordersEl.textContent = data.activeOrders;

  } catch (error) {
    console.error("Error fetching stats:", error);
  }
}

// Global functions
window.addToOrder = addToOrder;
window.removeFromOrder = removeFromOrder;

// Start app
init();