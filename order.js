// order.js - Order summary page

const API = 'http://localhost:3000';
let cart = JSON.parse(localStorage.getItem('cart') || '{}');

function showNotification(msg) {
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 3000);
}

function inr(n) { return '₹' + parseInt(n, 10).toLocaleString('en-IN'); }

function renderOrder() {
  const list = document.getElementById('order-items');
  const totalEl = document.getElementById('order-total');
  list.innerHTML = '';
  let total = 0;
  const ids = Object.keys(cart);
  if (ids.length === 0) {
    list.innerHTML = '<p>No items yet. <a href="index.html#menu">Browse menu →</a></p>';
    totalEl.textContent = 'Total: ₹0';
    return;
  }
  ids.forEach(id => {
    const it = cart[id];
    const sub = parseFloat(it.price) * it.quantity;
    total += sub;
    const div = document.createElement('div');
    div.className = 'order-item';
    div.innerHTML = `
      <span>${it.name}</span>
      <button onclick="dec(${id})">➖</button>
      <span> ${it.quantity} </span>
      <button onclick="inc(${id})">➕</button>
      <span> — ${inr(sub)}</span>
      <button onclick="del(${id})" style="margin-left:8px;color:#d63031;">✕</button>
    `;
    list.appendChild(div);
  });
  totalEl.textContent = 'Total: ' + inr(total);
}

function inc(id) { cart[id].quantity++; save(); }
function dec(id) { if (cart[id].quantity > 1) cart[id].quantity--; else delete cart[id]; save(); }
function del(id) { delete cart[id]; save(); }
function save() { localStorage.setItem('cart', JSON.stringify(cart)); renderOrder(); }

window.inc = inc; window.dec = dec; window.del = del;

document.getElementById('order-form').addEventListener('submit', e => {
  e.preventDefault();
  if (Object.keys(cart).length === 0) {
    showNotification('Your cart is empty!');
    return;
  }
  const customer = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
    notes: document.getElementById('notes').value,
  };
  localStorage.setItem('customer', JSON.stringify(customer));
  window.location.href = 'payment.html';
});

renderOrder();
