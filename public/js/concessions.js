/**
 * EXO — Concessions Storefront
 * Menu display, cart management, checkout, and QR code generation
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile nav
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle) navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));

  const menuGrid = document.getElementById('menuGrid');
  const cartItems = document.getElementById('cartItems');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const customerName = document.getElementById('customerName');
  const customerSection = document.getElementById('customerSection');
  const orderModal = document.getElementById('orderModal');
  const modalOrderNumber = document.getElementById('modalOrderNumber');
  const qrCode = document.getElementById('qrCode');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const menuFilters = document.getElementById('menuFilters');

  let menuItems = [];
  let cart = [];

  // ─── Load Menu ───────────────────────────────────────────────
  try {
    const res = await fetch('/api/menu');
    menuItems = await res.json();
    renderMenu(menuItems);
  } catch (err) {
    menuGrid.innerHTML = '<p style="color: var(--accent-red);">Failed to load menu.</p>';
  }

  // ─── Filter Buttons ─────────────────────────────────────────
  menuFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    menuFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const cat = btn.dataset.cat;
    if (cat === 'all') {
      renderMenu(menuItems);
    } else {
      renderMenu(menuItems.filter(item => item.category === cat));
    }
  });

  // ─── Render Menu ─────────────────────────────────────────────
  function renderMenu(items) {
    menuGrid.innerHTML = '';
    items.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'menu-item';
      div.style.animationDelay = `${i * 0.05}s`;
      div.style.animation = 'fadeUp 0.4s ease-out both';
      div.innerHTML = `
        ${item.popular ? '<span class="popular-badge">Popular</span>' : ''}
        <span class="menu-item-emoji">${item.image}</span>
        <div class="menu-item-name">${item.name}</div>
        <div class="menu-item-desc">${item.description}</div>
        <div class="menu-item-footer">
          <span class="menu-item-price">$${item.price.toFixed(2)}</span>
          <button class="add-to-cart-btn" data-id="${item.id}" aria-label="Add ${item.name} to cart">+</button>
        </div>
      `;
      menuGrid.appendChild(div);
    });

    // Add-to-cart listeners
    menuGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(parseInt(btn.dataset.id));
      });
    });
  }

  // ─── Cart Logic ──────────────────────────────────────────────
  function addToCart(itemId) {
    const existing = cart.find(c => c.id === itemId);
    if (existing) {
      existing.quantity++;
    } else {
      const item = menuItems.find(m => m.id === itemId);
      cart.push({ ...item, quantity: 1 });
    }
    renderCart();
    showToast(`Added to cart!`, '✅');
  }

  function removeFromCart(itemId) {
    const idx = cart.findIndex(c => c.id === itemId);
    if (idx >= 0) {
      if (cart[idx].quantity > 1) {
        cart[idx].quantity--;
      } else {
        cart.splice(idx, 1);
      }
    }
    renderCart();
  }

  function incrementCart(itemId) {
    const item = cart.find(c => c.id === itemId);
    if (item) item.quantity++;
    renderCart();
  }

  function renderCart() {
    const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
    const totalPrice = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

    cartCount.textContent = totalItems;
    cartTotal.textContent = `$${totalPrice.toFixed(2)}`;
    checkoutBtn.disabled = cart.length === 0;

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <p>Your cart is empty.<br>Add items from the menu!</p>
        </div>
      `;
      return;
    }

    cartItems.innerHTML = '';
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="cart-item-info">
          <span class="cart-item-emoji">${item.image}</span>
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
          <span class="cart-qty">${item.quantity}</span>
          <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
        </div>
      `;
      cartItems.appendChild(div);
    });

    // Qty button listeners
    cartItems.querySelectorAll('.qty-minus').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
    });
    cartItems.querySelectorAll('.qty-plus').forEach(btn => {
      btn.addEventListener('click', () => incrementCart(parseInt(btn.dataset.id)));
    });
  }

  // ─── Checkout ────────────────────────────────────────────────
  checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) return;

    checkoutBtn.textContent = 'Processing...';
    checkoutBtn.disabled = true;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({ id: c.id, quantity: c.quantity })),
          section: customerSection.value || 'N/A',
          name: customerName.value || 'Guest',
        }),
      });

      const order = await res.json();

      // Show modal with QR code
      modalOrderNumber.textContent = order.orderNumber;
      generateQRCode(order.orderNumber);
      orderModal.classList.add('visible');

      // Clear cart
      cart = [];
      renderCart();
    } catch (err) {
      showToast('Order failed. Please try again.', '❌');
    }

    checkoutBtn.textContent = 'Place Order';
    checkoutBtn.disabled = cart.length === 0;
  });

  // ─── QR Code Generator (pure canvas) ─────────────────────────
  function generateQRCode(text) {
    qrCode.innerHTML = '';
    const canvas = document.createElement('canvas');
    const size = 168;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Simple visual QR-style pattern (not a real QR encoder — visual representation)
    const moduleSize = 6;
    const modules = Math.floor(size / moduleSize);

    // Generate deterministic pattern from text
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = ((seed << 5) - seed) + text.charCodeAt(i);
      seed = seed & seed;
    }

    function seededRandom() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#1a1a2e';

    // QR finder patterns (corners)
    drawFinderPattern(ctx, 0, 0, moduleSize);
    drawFinderPattern(ctx, (modules - 7) * moduleSize, 0, moduleSize);
    drawFinderPattern(ctx, 0, (modules - 7) * moduleSize, moduleSize);

    // Data modules
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        // Skip finder pattern areas
        if ((row < 8 && col < 8) || (row < 8 && col >= modules - 8) || (row >= modules - 8 && col < 8)) continue;

        if (seededRandom() > 0.5) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize - 1, moduleSize - 1);
        }
      }
    }

    qrCode.appendChild(canvas);
  }

  function drawFinderPattern(ctx, x, y, m) {
    // Outer ring
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x, y, 7 * m, 7 * m);

    // Inner white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + m, y + m, 5 * m, 5 * m);

    // Center dot
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x + 2 * m, y + 2 * m, 3 * m, 3 * m);
  }

  // ─── Modal Close ─────────────────────────────────────────────
  modalCloseBtn.addEventListener('click', () => {
    orderModal.classList.remove('visible');
  });

  orderModal.addEventListener('click', (e) => {
    if (e.target === orderModal) orderModal.classList.remove('visible');
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
