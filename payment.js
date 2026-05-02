// payment.js - Payment page
const API = 'http://localhost:3000';
const cart = JSON.parse(localStorage.getItem('cart') || '{}');
const customer = JSON.parse(localStorage.getItem('customer') || 'null');

function inr(n) { return '₹' + parseInt(n, 10).toLocaleString('en-IN'); }
function showNotification(msg) {
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 3000);
}

// Guard: redirect back if missing data
if (!customer || Object.keys(cart).length === 0) {
  alert('Please add items and fill customer details first.');
  window.location.href = 'order.html';
}

let total = 0;
function renderBill() {
  const billItems = document.getElementById('bill-items');
  billItems.innerHTML = '';
  total = 0;
  Object.values(cart).forEach(it => {
    const sub = parseFloat(it.price) * it.quantity;
    total += sub;
    const row = document.createElement('div');
    row.className = 'bill-item';
    row.innerHTML = `<span>${it.name} × ${it.quantity}</span><span>${inr(sub)}</span>`;
    billItems.appendChild(row);
  });
  document.getElementById('bill-subtotal').textContent = inr(total);
  document.getElementById('bill-total').textContent = inr(total);

  // UPI QR with dynamic amount
  document.getElementById('upi-qr').src =
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=dsycafe867@okaxis%26pn=DSYCafe%26am=${total}`;
}
renderBill();

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// Card form
document.getElementById('card-form').addEventListener('submit', e => {
  e.preventDefault();
  placeOrder('Card');
});
document.getElementById('upi-pay-btn').onclick = () => placeOrder('UPI');
document.getElementById('cod-pay-btn').onclick = () => placeOrder('Cash on Delivery');

async function placeOrder(method) {
  const payload = {
    customer,
    items: Object.values(cart).map(it => ({ dishId: it.id, name: it.name, quantity: it.quantity, price: it.price })),
    total,
    paymentMethod: method,
  };
  try {
    const res = await fetch(API + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');

    // Fetch ETA
    let eta = '10';
    try {
      const s = await fetch(API + '/api/stats').then(r => r.json());
      eta = s.estimatedTime;
    } catch (_) {}

    document.getElementById('success-order-id').textContent = '#' + data.orderId;
    document.getElementById('success-eta').textContent = eta;
    document.getElementById('success-modal').classList.add('show');

    // Clear cart
    localStorage.removeItem('cart');
    localStorage.removeItem('customer');
  } catch (err) {
    console.error(err);
    showNotification('Error placing order: ' + err.message);
  }
}
