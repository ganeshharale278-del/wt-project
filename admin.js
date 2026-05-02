// admin.js - Handles login, session, and dashboard
const API = 'http://localhost:3000';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123'; // ⚠ Demo only — change this!

const path = window.location.pathname.split('/').pop();

function inr(n) { return '₹' + parseInt(n, 10).toLocaleString('en-IN'); }
function isLoggedIn() { return sessionStorage.getItem('admin_logged_in') === 'yes'; }
function showNotification(msg) {
  const n = document.getElementById('notification');
  if (!n) return alert(msg);
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 3000);
}

// ===== LOGIN PAGE =====
if (path === 'admin-login.html' || path === '') {
  const form = document.getElementById('login-form');
  if (form) {
    if (isLoggedIn()) window.location.href = 'admin-dashboard.html';
    form.addEventListener('submit', e => {
      e.preventDefault();
      const u = document.getElementById('username').value.trim();
      const p = document.getElementById('password').value;
      if (u === ADMIN_USER && p === ADMIN_PASS) {
        sessionStorage.setItem('admin_logged_in', 'yes');
        window.location.href = 'admin-dashboard.html';
      } else {
        document.getElementById('login-error').textContent = '❌ Invalid username or password';
      }
    });
  }
}

// ===== DASHBOARD =====
if (path === 'admin-dashboard.html') {
  if (!isLoggedIn()) {
    window.location.href = 'admin-login.html';
  } else {
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.onclick = e => {
      e.preventDefault();
      sessionStorage.removeItem('admin_logged_in');
      window.location.href = 'admin-login.html';
    };

    let allOrders = [];

    async function loadOrders() {
      try {
        const res = await fetch(API + '/api/orders');
        allOrders = await res.json();
        renderStats();
        renderTable();
      } catch (err) {
        document.getElementById('orders-tbody').innerHTML =
          `<tr><td colspan="9" style="text-align:center;color:#d63031;padding:2rem;">Failed to load orders. Is the server running?</td></tr>`;
      }
    }

    function renderStats() {
      document.getElementById('stat-total').textContent = allOrders.length;
      document.getElementById('stat-pending').textContent =
        allOrders.filter(o => o.status === 'Pending').length;
      const rev = allOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
      document.getElementById('stat-revenue').textContent = inr(rev);
    }

    function renderTable() {
      const q = document.getElementById('search-input').value.toLowerCase();
      const status = document.getElementById('status-filter').value;
      const tbody = document.getElementById('orders-tbody');

      const filtered = allOrders.filter(o => {
        const matchQ = !q || (o.customer_name || '').toLowerCase().includes(q)
          || (o.email || '').toLowerCase().includes(q)
          || (o.phone || '').toLowerCase().includes(q);
        const matchS = status === 'all' || o.status === status;
        return matchQ && matchS;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;">No orders found.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(o => {
        let items = [];
        try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch (_) {}
        const itemsStr = items.map(i => `${i.name || 'Dish #' + i.dishId} ×${i.quantity}`).join(', ');
        const date = o.created_at ? new Date(o.created_at).toLocaleString() : '-';
        return `
          <tr>
            <td>#${o.id}</td>
            <td><b>${o.customer_name || '-'}</b><br><small>${o.address || ''}</small></td>
            <td>${o.phone || '-'}<br><small>${o.email || ''}</small></td>
            <td class="items-list">${itemsStr || '-'}</td>
            <td><b>${inr(o.total || 0)}</b></td>
            <td>${o.payment_method || '-'}</td>
            <td><span class="status-badge status-${o.status}">${o.status}</span></td>
            <td><small>${date}</small></td>
            <td>
              <select onchange="updateStatus(${o.id}, this.value)" class="action-btn status">
                <option ${o.status==='Pending'?'selected':''}>Pending</option>
                <option ${o.status==='Preparing'?'selected':''}>Preparing</option>
                <option ${o.status==='Delivered'?'selected':''}>Delivered</option>
                <option ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
              </select>
              <button class="invoice-btn" onclick="downloadInvoice(${o.id})">🧾 Invoice</button>
              <button class="action-btn delete" onclick="deleteOrder(${o.id})">🗑</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    window.updateStatus = async (id, status) => {
      try {
        await fetch(`${API}/api/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        showNotification(`Order #${id} → ${status}`);
        loadOrders();
      } catch { showNotification('Update failed'); }
    };

    window.deleteOrder = async id => {
      if (!confirm(`Delete order #${id}?`)) return;
      try {
        await fetch(`${API}/api/orders/${id}`, { method: 'DELETE' });
        showNotification(`Order #${id} deleted`);
        loadOrders();
      } catch { showNotification('Delete failed'); }
    };

    document.getElementById('search-input').addEventListener('input', renderTable);
    document.getElementById('status-filter').addEventListener('change', renderTable);
    document.getElementById('refresh-btn').addEventListener('click', loadOrders);

    loadOrders();
    setInterval(loadOrders, 30000); // auto-refresh every 30s

    // FEATURE 5: Download invoice via Java Servlet
    window.downloadInvoice = async (id) => {
      try {
        const res = await fetch(`${API}/api/orders/${id}`);
        const order = await res.json();
        let items = [];
        try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(_){}
        const payload = {
          orderId: order.id,
          customer: {
            name: order.customer_name, email: order.email,
            phone: order.phone, address: order.address, notes: order.notes
          },
          items,
          total: order.total,
          paymentMethod: order.payment_method,
          status: order.status
        };
        const encoded = encodeURIComponent(JSON.stringify(payload));
        // Opens the Java Servlet endpoint (Tomcat on port 8080)
        window.open(`http://localhost:8080/invoice/api/invoice?data=${encoded}`, '_blank');
      } catch(err) {
        showNotification('Could not generate invoice — is the Java server running?');
      }
    };
  }
}
