/**
 * EXO — Admin Dashboard
 * Login, heatmap visualization, signage override, emergency controls
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle) navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

  const loginForm = document.getElementById('loginForm');
  const adminLogin = document.getElementById('adminLogin');
  const adminDashboard = document.getElementById('adminDashboard');
  const loginError = document.getElementById('loginError');
  const signageSendBtn = document.getElementById('signageSendBtn');
  const emergencyBtn = document.getElementById('emergencyBtn');

  let authToken = null;
  let heatmapInterval = null;
  let ordersInterval = null;

  // ─── Login ───────────────────────────────────────────────────
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPass').value;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        authToken = data.token;
        showDashboard();
      } else {
        loginError.classList.add('visible');
        setTimeout(() => loginError.classList.remove('visible'), 3000);
      }
    } catch {
      loginError.textContent = 'Connection error. Is the server running?';
      loginError.classList.add('visible');
    }
  });

  function showDashboard() {
    adminLogin.style.display = 'none';
    adminDashboard.classList.add('visible');

    // Start polling
    loadHeatmap();
    loadOrders();
    heatmapInterval = setInterval(loadHeatmap, 5000);
    ordersInterval = setInterval(loadOrders, 10000);
  }

  // ─── Heatmap ─────────────────────────────────────────────────
  async function loadHeatmap() {
    try {
      const res = await fetch('/api/stadium/heatmap');
      const sections = await res.json();
      drawHeatmap(sections);
      updateStats(sections);
    } catch (err) {
      console.error('Heatmap load failed:', err);
    }
  }

  function drawHeatmap(sections) {
    const canvas = document.getElementById('heatmapCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 48;
    canvas.height = canvas.width * 0.625;

    const w = canvas.width;
    const h = canvas.height;
    const scaleX = w / 760;
    const scaleY = h / 530;

    // Background
    ctx.fillStyle = '#0d0d14';
    ctx.fillRect(0, 0, w, h);

    // Draw field
    const cx = 380 * scaleX;
    const cy = 265 * scaleY;
    ctx.strokeStyle = 'rgba(0, 184, 148, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(cx - 100 * scaleX, cy - 75 * scaleY, 200 * scaleX, 150 * scaleY);
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(0, 184, 148, 0.1)';
    ctx.font = `${12 * Math.min(scaleX, scaleY)}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FIELD', cx, cy);

    // Draw sections with heat colors
    sections.forEach(section => {
      const x = section.x * scaleX;
      const y = section.y * scaleY;
      const r = 20 * Math.min(scaleX, scaleY);

      // Heat color: green -> yellow -> orange -> red
      const occ = section.occupancy;
      let color;
      if (occ < 0.3) {
        color = `rgba(0, 184, 148, ${0.4 + occ})`;
      } else if (occ < 0.6) {
        color = `rgba(253, 203, 110, ${0.4 + occ * 0.5})`;
      } else if (occ < 0.8) {
        color = `rgba(225, 112, 85, ${0.5 + occ * 0.4})`;
      } else {
        color = `rgba(214, 48, 49, ${0.6 + occ * 0.3})`;
      }

      // Glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);

      // Section circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${10 * Math.min(scaleX, scaleY)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(section.id, x, y - 4 * scaleY);

      ctx.font = `${8 * Math.min(scaleX, scaleY)}px Inter, sans-serif`;
      ctx.fillText(`${Math.round(occ * 100)}%`, x, y + 6 * scaleY);
    });

    // Legend
    const legendY = h - 20;
    const legendColors = [
      { label: '< 30%', color: 'rgba(0, 184, 148, 0.7)' },
      { label: '30-60%', color: 'rgba(253, 203, 110, 0.7)' },
      { label: '60-80%', color: 'rgba(225, 112, 85, 0.7)' },
      { label: '> 80%', color: 'rgba(214, 48, 49, 0.7)' },
    ];

    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    let lx = 10;
    legendColors.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, legendY - 5, 12, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(item.label, lx + 16, legendY);
      lx += ctx.measureText(item.label).width + 30;
    });
  }

  function updateStats(sections) {
    const avgOcc = sections.reduce((sum, s) => sum + s.occupancy, 0) / sections.length;
    const statAvg = document.getElementById('statAvgOccupancy');
    if (statAvg) statAvg.textContent = `${Math.round(avgOcc * 100)}%`;
  }

  // ─── Orders ──────────────────────────────────────────────────
  async function loadOrders() {
    try {
      const res = await fetch('/api/orders');
      const orders = await res.json();
      renderOrders(orders);

      const activeOrders = orders.filter(o => o.status === 'preparing');
      const statActive = document.getElementById('statActiveOrders');
      if (statActive) statActive.textContent = activeOrders.length;
    } catch (err) {
      console.error('Orders load failed:', err);
    }
  }

  function renderOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No orders yet</td></tr>';
      return;
    }

    tbody.innerHTML = orders.slice(0, 20).map(order => `
      <tr>
        <td style="font-weight: 600; color: var(--accent-cyan);">${order.orderNumber}</td>
        <td>${order.customerName}</td>
        <td>${order.section}</td>
        <td>${order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</td>
        <td>$${order.total}</td>
        <td><span class="order-status ${order.status}">${order.status}</span></td>
      </tr>
    `).join('');
  }

  // ─── Signage Override ────────────────────────────────────────
  signageSendBtn.addEventListener('click', async () => {
    const message = document.getElementById('signageMessage').value;
    const priority = document.getElementById('signagePriority').value;

    if (!message.trim()) {
      showToast('Please enter a message.', '⚠️');
      return;
    }

    try {
      const res = await fetch('/api/admin/signage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, priority }),
      });

      if (res.ok) {
        showToast('Message broadcast successfully!', '📺');
        document.getElementById('signageMessage').value = '';
      }
    } catch {
      showToast('Failed to broadcast message.', '❌');
    }
  });

  // ─── Emergency Protocol ──────────────────────────────────────
  emergencyBtn.addEventListener('click', async () => {
    const confirmed = confirm('⚠️ ACTIVATE EMERGENCY PROTOCOL?\n\nThis will:\n- Flash emergency message on all signage\n- Alert all security personnel\n- Guide crowd to nearest exits\n\nContinue?');

    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'evacuation',
          message: 'EMERGENCY: Please proceed calmly to the nearest exit.',
          affectedSections: 'ALL',
        }),
      });

      if (res.ok) {
        showToast('🚨 Emergency protocol ACTIVATED', '🚨');
        emergencyBtn.textContent = '🚨 EMERGENCY ACTIVE';
        emergencyBtn.style.background = 'var(--accent-red)';
        emergencyBtn.style.color = 'white';

        const statAlerts = document.getElementById('statAlerts');
        if (statAlerts) statAlerts.textContent = '1';
      }
    } catch {
      showToast('Failed to activate emergency protocol.', '❌');
    }
  });

  // ─── Toast ───────────────────────────────────────────────────
  function showToast(message, icon = 'ℹ️') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
});
