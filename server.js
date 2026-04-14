/**
 * EXO — Intelligent Stadium Experience Platform
 * Express Server with REST API
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { Logging } = require('@google-cloud/logging');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet({ contentSecurityPolicy: false })); // Basic security headers, CSP disabled for inline scripts
app.use(cors()); // Cross-Origin Resource Sharing
app.use(compression()); // Gzip compression
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 })); // Rate limiting

// Initialize Google Cloud Logging
const logging = new Logging();
// Just a placeholder to show it's initialized
console.log('Google Cloud Logging initialized');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' })); // Basic caching


// ─── In-Memory Data Store ────────────────────────────────────────────

// Menu items for the concessions storefront
const menuItems = [
  { id: 1,  name: 'Classic Hot Dog',        price: 6.50,  category: 'mains',    image: '🌭', description: 'All-beef frank with mustard & relish', popular: true },
  { id: 2,  name: 'Loaded Nachos',          price: 9.00,  category: 'mains',    image: '🧀', description: 'Tortilla chips with jalapeño cheese & salsa', popular: true },
  { id: 3,  name: 'BBQ Pulled Pork',        price: 12.00, category: 'mains',    image: '🍖', description: 'Slow-smoked pork on a brioche bun', popular: false },
  { id: 4,  name: 'Margherita Pizza',       price: 10.50, category: 'mains',    image: '🍕', description: 'Wood-fired with fresh mozzarella & basil', popular: true },
  { id: 5,  name: 'Chicken Tenders',        price: 8.50,  category: 'mains',    image: '🍗', description: 'Crispy tenders with honey mustard', popular: false },
  { id: 6,  name: 'Pretzel Bites',          price: 7.00,  category: 'snacks',   image: '🥨', description: 'Warm salted pretzel bites with cheese dip', popular: true },
  { id: 7,  name: 'Popcorn Bucket',         price: 5.50,  category: 'snacks',   image: '🍿', description: 'Freshly popped, lightly buttered', popular: false },
  { id: 8,  name: 'Cotton Candy',           price: 4.00,  category: 'snacks',   image: '🍬', description: 'Classic stadium cotton candy', popular: false },
  { id: 9,  name: 'French Fries',           price: 5.00,  category: 'snacks',   image: '🍟', description: 'Seasoned crinkle-cut fries', popular: true },
  { id: 10, name: 'Ice Cream Sundae',       price: 6.00,  category: 'snacks',   image: '🍨', description: 'Vanilla with hot fudge & sprinkles', popular: false },
  { id: 11, name: 'Craft Beer',             price: 11.00, category: 'drinks',   image: '🍺', description: 'Local IPA, 16oz draft', popular: true },
  { id: 12, name: 'Lemonade',               price: 4.50,  category: 'drinks',   image: '🍋', description: 'Fresh-squeezed with mint', popular: false },
  { id: 13, name: 'Coca-Cola',              price: 3.50,  category: 'drinks',   image: '🥤', description: 'Ice-cold 20oz fountain drink', popular: true },
  { id: 14, name: 'Water Bottle',           price: 3.00,  category: 'drinks',   image: '💧', description: 'Purified spring water, 16oz', popular: false },
  { id: 15, name: 'Frozen Margarita',       price: 13.00, category: 'drinks',   image: '🍹', description: 'Tequila, lime, and triple sec on ice', popular: false },
];

// Stadium sections layout
const stadiumSections = {
  sections: [
    { id: 'A1', name: 'Section A1', type: 'lower', x: 200, y: 80,  capacity: 500, occupancy: 0.72 },
    { id: 'A2', name: 'Section A2', type: 'lower', x: 320, y: 60,  capacity: 500, occupancy: 0.85 },
    { id: 'A3', name: 'Section A3', type: 'lower', x: 440, y: 60,  capacity: 500, occupancy: 0.65 },
    { id: 'A4', name: 'Section A4', type: 'lower', x: 560, y: 80,  capacity: 500, occupancy: 0.90 },
    { id: 'B1', name: 'Section B1', type: 'lower', x: 140, y: 160, capacity: 600, occupancy: 0.45 },
    { id: 'B2', name: 'Section B2', type: 'lower', x: 620, y: 160, capacity: 600, occupancy: 0.78 },
    { id: 'C1', name: 'Section C1', type: 'lower', x: 120, y: 260, capacity: 600, occupancy: 0.55 },
    { id: 'C2', name: 'Section C2', type: 'lower', x: 640, y: 260, capacity: 600, occupancy: 0.60 },
    { id: 'D1', name: 'Section D1', type: 'upper', x: 160, y: 360, capacity: 400, occupancy: 0.30 },
    { id: 'D2', name: 'Section D2', type: 'upper', x: 600, y: 360, capacity: 400, occupancy: 0.42 },
    { id: 'E1', name: 'Section E1', type: 'upper', x: 220, y: 430, capacity: 400, occupancy: 0.50 },
    { id: 'E2', name: 'Section E2', type: 'upper', x: 340, y: 460, capacity: 400, occupancy: 0.68 },
    { id: 'E3', name: 'Section E3', type: 'upper', x: 420, y: 460, capacity: 400, occupancy: 0.35 },
    { id: 'E4', name: 'Section E4', type: 'upper', x: 540, y: 430, capacity: 400, occupancy: 0.55 },
  ],
  concessions: [
    { id: 'F1', name: 'Main Concourse Grill', x: 380, y: 180, type: 'food' },
    { id: 'F2', name: 'West Wing Snacks',     x: 150, y: 220, type: 'food' },
    { id: 'F3', name: 'East Wing Drinks',     x: 610, y: 220, type: 'drinks' },
  ],
  restrooms: [
    { id: 'R1', name: 'North Restroom',  x: 380, y: 30,  waitTime: 3,  occupancy: 0.40 },
    { id: 'R2', name: 'West Restroom',   x: 80,  y: 260, waitTime: 8,  occupancy: 0.75 },
    { id: 'R3', name: 'East Restroom',   x: 690, y: 260, waitTime: 2,  occupancy: 0.25 },
    { id: 'R4', name: 'South Restroom',  x: 380, y: 490, waitTime: 12, occupancy: 0.90 },
  ],
  gates: [
    { id: 'G1', name: 'Gate A — North', x: 380, y: 10  },
    { id: 'G2', name: 'Gate B — West',  x: 60,  y: 260 },
    { id: 'G3', name: 'Gate C — East',  x: 710, y: 260 },
    { id: 'G4', name: 'Gate D — South', x: 380, y: 510 },
  ],
};

// In-memory orders
let orders = [];

// Admin credentials (demo)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'exo2026';

// ─── Checks Storage ──────────────────────────────────────────────────

const CHECKS_FILE = path.join(__dirname, 'checks.json');

function readChecks() {
  try {
    const data = fs.readFileSync(CHECKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeCheck(check) {
  const checks = readChecks();
  checks.unshift(check);
  // Keep only last 10
  const trimmed = checks.slice(0, 10);
  fs.writeFileSync(CHECKS_FILE, JSON.stringify(trimmed, null, 2));
  return trimmed;
}

// ─── API Routes ──────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  const check = {
    id: uuidv4(),
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
  const checks = writeCheck(check);
  res.json({ ...check, recentChecks: checks.length });
});

// Get checks history
app.get('/api/checks', (req, res) => {
  res.json(readChecks());
});

// ─── Menu API ────────────────────────────────────────────────────────

app.get('/api/menu', (req, res) => {
  const { category } = req.query;
  if (category && category !== 'all') {
    return res.json(menuItems.filter(item => item.category === category));
  }
  res.json(menuItems);
});

app.get('/api/menu/:id', (req, res) => {
  const item = menuItems.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// ─── Orders API ──────────────────────────────────────────────────────

app.post('/api/orders', (req, res) => {
  const { items, section, name } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items in order' });
  }

  const orderItems = items.map(cartItem => {
    const menuItem = menuItems.find(m => m.id === cartItem.id);
    return {
      ...menuItem,
      quantity: cartItem.quantity || 1,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const order = {
    id: uuidv4(),
    orderNumber: `EXO-${Date.now().toString(36).toUpperCase()}`,
    items: orderItems,
    total: total.toFixed(2),
    section: section || 'N/A',
    customerName: name || 'Guest',
    status: 'preparing',
    createdAt: new Date().toISOString(),
    estimatedReady: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };

  orders.push(order);
  res.status(201).json(order);
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.patch('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (req.body.status) order.status = req.body.status;
  res.json(order);
});

// ─── Stadium API ─────────────────────────────────────────────────────

app.get('/api/stadium', (req, res) => {
  res.json(stadiumSections);
});

app.get('/api/stadium/heatmap', (req, res) => {
  // Simulate live crowd density with slight fluctuations
  const heatmapData = stadiumSections.sections.map(section => ({
    ...section,
    occupancy: Math.min(1, Math.max(0, section.occupancy + (Math.random() - 0.5) * 0.1)),
    lastUpdated: new Date().toISOString(),
  }));
  res.json(heatmapData);
});

app.get('/api/restrooms', (req, res) => {
  const restrooms = stadiumSections.restrooms.map(r => ({
    ...r,
    waitTime: Math.max(1, r.waitTime + Math.floor((Math.random() - 0.5) * 4)),
    occupancy: Math.min(1, Math.max(0, r.occupancy + (Math.random() - 0.5) * 0.15)),
    lastUpdated: new Date().toISOString(),
  }));
  res.json(restrooms);
});

// ─── Admin API ───────────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ success: true, token: uuidv4() });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/signage', (req, res) => {
  const { message, priority } = req.body;
  // In production, this would push to digital signage
  console.log(`[SIGNAGE OVERRIDE] Priority: ${priority} — ${message}`);
  res.json({ success: true, message: 'Signage updated', broadcastAt: new Date().toISOString() });
});

app.post('/api/admin/emergency', (req, res) => {
  const { type, message, affectedSections } = req.body;
  console.log(`[EMERGENCY] Type: ${type} — ${message} — Sections: ${affectedSections}`);
  res.json({
    success: true,
    alert: { type, message, affectedSections, activatedAt: new Date().toISOString() }
  });
});

// ─── Serve Pages ─────────────────────────────────────────────────────

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/stadium', (req, res) => res.sendFile(path.join(__dirname, 'public', 'stadium.html')));
app.get('/concessions', (req, res) => res.sendFile(path.join(__dirname, 'public', 'concessions.html')));
app.get('/restrooms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'restrooms.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// ─── Start Server ────────────────────────────────────────────────────

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  ╔══════════════════════════════════════╗`);
    console.log(`  ║   EXO Stadium Platform — Live 🏟️     ║`);
    console.log(`  ║   http://localhost:${PORT}              ║`);
    console.log(`  ╚══════════════════════════════════════╝\n`);
  });
}

module.exports = app;
