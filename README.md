# Hotel Gavkari — New Pages (Order, Payment, Admin)

Drop these files **next to your existing `index.html`, `style.css`, `app.js`**.

## Files added
| File | Purpose |
|------|---------|
| `order.html` + `order.js` | Dedicated order summary page (review cart + customer details) |
| `payment.html` + `payment.js` | Payment page with Card / UPI / COD tabs |
| `admin-login.html` | Admin login (hardcoded credentials) |
| `admin-dashboard.html` + `admin.js` | View / filter / update / delete orders |
| `extra.css` | Styles for the new pages (uses your existing color tokens) |

## Admin credentials (demo only — change in `admin.js`)
- **Username:** `admin`
- **Password:** `admin123`

⚠️ This is hardcoded in plain JavaScript — anyone who views source can read it.
For real use, move auth to your Node server (e.g. JWT + bcrypt in `server.js`).

## Required change to your existing `app.js`
Your current `app.js` keeps the cart in a local variable `currentOrder`. To make
the cart survive across pages, you need to **save it to `localStorage`** and
**redirect to `order.html`** when the user clicks "Place Order".

Replace your current `addToOrder` and the form-submit handler with:

```js
// At the top of app.js, after `let currentOrder = {};`
currentOrder = JSON.parse(localStorage.getItem('cart') || '{}');

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(currentOrder));
}

function addToOrder(id) {
  const dish = dishes.find(d => d.id === id);
  if (!dish) return;
  if (!currentOrder[id]) currentOrder[id] = { ...dish, quantity: 1 };
  else currentOrder[id].quantity++;
  saveCart();
  updateOrderSummary();
}

function removeFromOrder(id) {
  if (!currentOrder[id]) return;
  if (currentOrder[id].quantity > 1) currentOrder[id].quantity--;
  else delete currentOrder[id];
  saveCart();
  updateOrderSummary();
}

// Replace the form submit handler:
document.getElementById('order-form').addEventListener('submit', e => {
  e.preventDefault();
  if (Object.keys(currentOrder).length === 0) {
    showNotification('Your order is empty!');
    return;
  }
  // Save customer details + redirect
  const customer = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
    notes: document.getElementById('notes').value,
  };
  localStorage.setItem('customer', JSON.stringify(customer));
  window.location.href = 'order.html'; // or 'payment.html' to skip review
});
```

You can now **delete** the `<div id="payment-modal">` block from `index.html`
(lines 107–131) and the modal-related JS in `app.js` (lines 142–174) since the
payment flow now lives on its own page.

## Add an Admin link to your nav
In `index.html` header `<nav>`, add:
```html
<li><a href="admin-login.html">Admin</a></li>
```

## Server requirements
No changes needed — these pages use your existing endpoints:
- `GET  /api/dishes`
- `POST /api/orders`
- `GET  /api/orders`
- `PUT  /api/orders/:id/status`
- `DELETE /api/orders/:id`
- `GET  /api/stats`

Just make sure `server.js` is running on `http://localhost:3000`.

## Flow
1. User adds items on **index.html** → cart stored in `localStorage`
2. Clicks "Place Order" → **order.html** (review + customer form)
3. Submits form → **payment.html** (Card / UPI / COD)
4. On success → order POSTed to your Node server → success modal
5. Admin opens **admin-login.html** → **admin-dashboard.html** to manage orders
