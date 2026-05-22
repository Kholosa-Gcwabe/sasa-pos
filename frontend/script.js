const API_BASE = '/api';

const State = {
  currentUser: null,
  currentOrder: [],
  orders: [],
  menuItems: [],
  activeView: 'dashboard'
};

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  login: (creds) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(creds) }),
  getMe: () => api.request('/auth/me'),
  createOrder: (items, customerPhone) => api.request('/orders', { method: 'POST', body: JSON.stringify({ items, customerPhone }) }),
  getActiveOrders: () => api.request('/orders/active'),
  getAllOrders: () => api.request('/orders'),
  updateOrderStatus: (id, status) => api.request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getTodayStats: () => api.request('/orders/stats/today'),
  getUsers: () => api.request('/users'),
  createUser: (data) => api.request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => api.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => api.request(`/users/${id}`, { method: 'DELETE' }),
  getMenu: () => api.request('/menu'),
  createMenuItem: (data) => api.request('/menu', { method: 'POST', body: JSON.stringify(data) }),
  deleteMenuItem: (id) => api.request(`/menu/${id}`, { method: 'DELETE' })
};

const menuCategories = [
  { name: 'Staples & Sides', icon: '🍲', items: [
    { name: 'Pap', price: 20 }, { name: 'Chakalaka', price: 25 },
    { name: 'Dombolo', price: 30 }, { name: 'Morogo', price: 25 },
    { name: 'Pap & Chakalaka', price: 40 }
  ]},
  { name: 'Proteins', icon: '🍖', items: [
    { name: 'Grilled Meats', price: 60 }, { name: 'Peri-Peri Chicken', price: 55 },
    { name: 'Oxtail Stew', price: 80 }, { name: 'Tripe (Mogodu)', price: 70 },
    { name: 'Boerewors', price: 65 }
  ]},
  { name: 'Vegetarian', icon: '🥬', items: [
    { name: 'Bean Stew', price: 40 }, { name: 'Pumpkin Curry', price: 35 },
    { name: 'Lentil Bobotie', price: 45 }, { name: 'Chakalaka & Pap', price: 40 }
  ]},
  { name: 'Street Food', icon: '🍟', items: [
    { name: 'Vetkoek', price: 25 }, { name: 'Samosa', price: 20 },
    { name: 'Bunny Chow', price: 45 }, { name: 'Kota (Gatsby)', price: 50 }
  ]},
  { name: 'Desserts', icon: '🍰', items: [
    { name: 'Malva Pudding', price: 30 }, { name: 'Koeksisters', price: 25 },
    { name: 'Milk Tart', price: 20 }, { name: 'Peppermint Crisp Tart', price: 35 }
  ]},
  { name: 'Drinks', icon: '🥤', items: [
    { name: 'Mageu', price: 15 }, { name: 'Rooibos Iced Tea', price: 20 },
    { name: 'Ginger Beer', price: 25 }, { name: 'Amasi', price: 18 }
  ]}
];

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  
  try {
    const data = await api.login({ username, password });
    
    if (data.user.role !== role) {
      alert(`You selected ${role} but you are a ${data.user.role}. Logging in as ${data.user.role}.`);
    }
    
    localStorage.setItem('token', data.accessToken);
    State.currentUser = data.user;
    
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    
    document.getElementById('user-name').textContent = data.user.username;
    document.getElementById('user-role').textContent = data.user.role;
    
    initNavigation();
    renderMenu();
    showView('dashboard');
    
    if (data.user.role === 'Chef') {
      showView('orders');
      loadKitchenOrders();
    } else if (data.user.role === 'Manager') {
      loadAdminData();
    }
    
  } catch (err) {
    alert(err.message);
  }
}

function logout() {
  localStorage.removeItem('token');
  State.currentUser = null;
  State.currentOrder = [];
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
}

function initNavigation() {
  const nav = document.getElementById('main-nav');
  const role = State.currentUser?.role;
  
  let links = [];
  
  if (role === 'Cashier') {
    links = [{ id: 'dashboard', label: '🛒 POS' }];
  } else if (role === 'Chef') {
    links = [{ id: 'orders', label: '👨‍🍳 Kitchen' }];
  } else if (role === 'Manager') {
    links = [
      { id: 'dashboard', label: '🛒 POS' },
      { id: 'orders', label: '👨‍🍳 Kitchen' },
      { id: 'admin', label: '⚙️ Admin' }
    ];
  }
  
  nav.innerHTML = links.map(link => `
    <button class="nav-link ${State.activeView === link.id ? 'active' : ''}" 
            data-view="${link.id}" onclick="switchView('${link.id}')">
      ${link.label}
    </button>
  `).join('');
}

function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  
  const targetView = document.getElementById('view-' + viewId);
  if (targetView) targetView.classList.add('active');
  
  const navBtn = document.querySelector(`[data-view="${viewId}"]`);
  if (navBtn) navBtn.classList.add('active');
  
  State.activeView = viewId;
  
  if (viewId === 'orders') loadKitchenOrders();
  if (viewId === 'admin') loadAdminData();
}

function showView(viewId) {
  switchView(viewId);
}

function renderMenu() {
  const container = document.getElementById('menu-section');
  if (!container) return;
  
  container.innerHTML = menuCategories.map((cat, idx) => `
    <div class="category ${idx === 0 ? 'open' : ''}">
      <button class="category-header" onclick="toggleCategory(this)">
        <span class="category-icon">${cat.icon}</span>
        <span class="category-title">${cat.name}</span>
        <span class="toggle">▼</span>
      </button>
      <div class="category-items">
        ${cat.items.map(item => `
          <button class="item-card" onclick="addItem('${item.name}', ${item.price})">
            <span class="item-name">${item.name}</span>
            <span class="item-price">R${item.price}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function toggleCategory(header) {
  header.closest('.category').classList.toggle('open');
}

function addItem(name, price) {
  const existing = State.currentOrder.find(item => item.name === name);
  if (existing) {
    existing.quantity += 1;
  } else {
    State.currentOrder.push({ name, price, quantity: 1 });
  }
  renderOrder();
}

function removeItem(index) {
  State.currentOrder.splice(index, 1);
  renderOrder();
}

function updateQuantity(index, delta) {
  const item = State.currentOrder[index];
  item.quantity += delta;
  if (item.quantity <= 0) State.currentOrder.splice(index, 1);
  renderOrder();
}

function renderOrder() {
  const list = document.getElementById('receipt-items');
  const confirmBtn = document.getElementById('btn-confirm');
  
  if (State.currentOrder.length === 0) {
    list.innerHTML = '<p class="empty-state">No items added yet</p>';
    confirmBtn.disabled = true;
    updateTotals(0);
    return;
  }
  
  confirmBtn.disabled = false;
  let subtotal = 0;
  
  list.innerHTML = State.currentOrder.map((item, index) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    return `
      <div class="receipt-item">
        <div>
          <div style="font-weight: 600;">${item.name}</div>
          <div style="font-size: 0.875rem; color: #6B7280;">R${item.price} × ${item.quantity}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="btn btn-sm" onclick="updateQuantity(${index}, -1)" style="padding: 2px 8px; font-size: 0.75rem;">−</button>
          <span style="font-weight: bold; min-width: 20px; text-align: center;">${item.quantity}</span>
          <button class="btn btn-sm" onclick="updateQuantity(${index}, 1)" style="padding: 2px 8px; font-size: 0.75rem;">+</button>
          <button onclick="removeItem(${index})" style="background: none; border: none; color: #EF4444; cursor: pointer; font-size: 1.25rem;">×</button>
        </div>
      </div>
    `;
  }).join('');
  
  updateTotals(subtotal);
}

function updateTotals(subtotal) {
  const vat = subtotal * 0.15;
  const total = subtotal + vat;
  document.getElementById('summary-subtotal').textContent = `R${subtotal.toFixed(2)}`;
  document.getElementById('summary-tax').textContent = `R${vat.toFixed(2)}`;
  document.getElementById('summary-total').textContent = `R${total.toFixed(2)}`;
}

function clearOrder() {
  if (State.currentOrder.length === 0) return;
  if (confirm('Clear all items from current order?')) {
    State.currentOrder = [];
    renderOrder();
  }
}

async function confirmOrder() {
  if (State.currentOrder.length === 0) {
    alert('No items in order!');
    return;
  }
  
  const customerPhone = document.getElementById('customer-phone').value;
  
  try {
    const data = await api.createOrder(State.currentOrder, customerPhone);
    alert(`✅ Order ${data.order.orderNumber} created successfully!${customerPhone ? '\n📱 SMS will be sent to: ' + customerPhone : ''}`);
    State.currentOrder = [];
    renderOrder();
    document.getElementById('current-order-id').textContent = `Order #${data.order.orderNumber}`;
    document.getElementById('customer-phone').value = '';
  } catch (err) {
    alert(err.message);
  }
}

async function loadKitchenOrders() {
  try {
    const data = await api.getActiveOrders();
    State.orders = data.orders;
    renderKitchenOrders();
    updateKitchenStats();
  } catch (err) {
    console.error('Failed to load orders:', err);
  }
}

function renderKitchenOrders() {
  const container = document.getElementById('orders-list');
  
  if (State.orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <span class="icon">📭</span>
        <p>No active orders</p>
        <small>New orders will appear here automatically</small>
      </div>
    `;
    return;
  }
  
  container.innerHTML = State.orders.map(order => `
    <div class="order-card">
      <div class="order-card__header">
        <div class="order-card__info">
          <h4>Order ${order.orderNumber}</h4>
          <span class="order-card__meta">
            ${new Date(order.createdAt).toLocaleTimeString()} • ${order.user?.username || 'Unknown'}
          </span>
        </div>
        <span class="order-card__total">R${order.total.toFixed(2)}</span>
      </div>
      
      <div class="order-card__items">
        ${order.items.map(item => `
          <div class="order-card__item">
            <span>${item.quantity}× ${item.name}</span>
            <span>R${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      
      ${order.customerPhone ? `
        <div style="padding: 0.5rem; background: #DBEAFE; border-radius: 0.5rem; margin: 0.5rem 0; font-size: 0.875rem;">
          📱 ${order.customerPhone}
        </div>
      ` : ''}
      
      <div class="order-card__status">
        <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
      </div>
      
      <div class="order-card__actions">
        ${getKitchenActions(order)}
      </div>
    </div>
  `).join('');
}

function getKitchenActions(order) {
  if (order.status === 'PENDING') {
    return `<button class="btn btn-primary" onclick="updateOrder('${order.id}', 'PREPARING')">👨‍🍳 Start Preparing</button>`;
  } else if (order.status === 'PREPARING') {
    return `<button class="btn btn-success" onclick="updateOrder('${order.id}', 'READY')">✅ Mark Ready</button>`;
  } else if (order.status === 'READY') {
    return `<button class="btn btn-success" onclick="updateOrder('${order.id}', 'COMPLETED')">🎉 Complete Order</button>`;
  }
  return '';
}

async function updateOrder(id, status) {
  try {
    await api.updateOrderStatus(id, status);
    alert(`Order updated to ${status}!`);
    loadKitchenOrders();
  } catch (err) {
    alert(err.message);
  }
}

async function updateKitchenStats() {
  try {
    const stats = await api.getTodayStats();
    document.getElementById('stat-active').textContent = stats.active;
    document.getElementById('stat-completed').textContent = stats.completedToday;
    document.getElementById('stat-total').textContent = `R${stats.totalRevenue.toFixed(2)}`;
  } catch (err) {
    console.error('Stats error:', err);
  }
}

async function loadAdminData() {
  await Promise.all([loadAdminOrders(), loadAdminUsers(), loadAdminMenu()]);
}

async function loadAdminOrders() {
  try {
    const data = await api.getAllOrders();
    const tbody = document.querySelector('#admin-orders-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = data.orders.map(order => `
      <tr>
        <td><strong>${order.orderNumber}</strong></td>
        <td>${order.user?.username || 'Unknown'}</td>
        <td>${order.customerPhone || '—'}</td>
        <td>R${order.total.toFixed(2)}</td>
        <td><span class="badge">${order.status}</span></td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load orders:', err);
  }
}

async function loadAdminUsers() {
  try {
    const data = await api.getUsers();
    const tbody = document.querySelector('#admin-users-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = data.users.map(user => `
      <tr>
        <td><strong>${user.username}</strong></td>
        <td><span class="badge">${user.role}</span></td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td>
          <span class="badge ${user.isActive ? '' : 'badge--inactive'}">
            ${user.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm" onclick="toggleUser('${user.id}', ${!user.isActive})">
            ${user.isActive ? 'Deactivate' : 'Activate'}
          </button>
          ${user.id !== State.currentUser.id ? `
            <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

async function loadAdminMenu() {
  try {
    const data = await api.getMenu();
    const tbody = document.querySelector('#admin-menu-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = data.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>R${item.price.toFixed(2)}</td>
        <td><span class="badge">${item.category}</span></td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteMenuItem('${item.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load menu:', err);
  }
}

async function toggleUser(id, isActive) {
  try {
    await api.updateUser(id, { isActive });
    alert(`User ${isActive ? 'activated' : 'deactivated'}!`);
    loadAdminUsers();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteUser(id) {
  if (!confirm('Delete this user permanently?')) return;
  try {
    await api.deleteUser(id);
    alert('User deleted!');
    loadAdminUsers();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteMenuItem(id) {
  if (!confirm('Delete this menu item?')) return;
  try {
    await api.deleteMenuItem(id);
    alert('Menu item deleted!');
    loadAdminMenu();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('btn-clear')?.addEventListener('click', clearOrder);
  document.getElementById('btn-confirm')?.addEventListener('click', confirmOrder);
  
  document.querySelectorAll('[data-action="logout"]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  });
  
  document.getElementById('add-user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;
    
    try {
      await api.createUser({ username, password, role });
      alert('User created!');
      e.target.reset();
      loadAdminUsers();
    } catch (err) {
      alert(err.message);
    }
  });
});
