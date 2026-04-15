const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const { menuItems, stadiumSections } = require('../data/constants');
const { orderService } = require('../services/firebase');
const logger = require('../services/logger');

const CHECKS_FILE = path.join(__dirname, '../checks.json');

// Helper: read/write checks
const readChecks = () => {
  try {
    return JSON.parse(fs.readFileSync(CHECKS_FILE, 'utf-8'));
  } catch {
    return [];
  }
};

const writeCheck = (check) => {
  const checks = readChecks();
  checks.unshift(check);
  fs.writeFileSync(CHECKS_FILE, JSON.stringify(checks.slice(0, 10), null, 2));
};

// Health Check
router.get('/health', (req, res) => {
  const check = {
    id: uuidv4(),
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
  writeCheck(check);
  logger.info('Health check triggered', { status: 'operational' });
  res.json(check);
});

router.get('/checks', (req, res) => {
  res.json(readChecks());
});

// Menu
router.get('/menu', (req, res) => {
  const { category } = req.query;
  if (category && category !== 'all') {
    return res.json(menuItems.filter(item => item.category === category));
  }
  res.json(menuItems);
});

router.get('/menu/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  const item = menuItems.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// Orders
const orderSchema = Joi.object({
  name: Joi.string().max(50).default('Guest'),
  section: Joi.string().max(10).required(),
  items: Joi.array().items(Joi.object({
    id: Joi.number().required(),
    quantity: Joi.number().min(1).max(10).default(1)
  })).min(1).required()
});

router.get('/orders', async (req, res) => {
  try {
    const orders = await orderService.getOrders();
    res.json(orders);
  } catch (error) {
    logger.error('Failed to fetch orders', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const { error, value } = orderSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { items, section, name } = value;

    const orderItems = items.map(cartItem => {
      const menuItem = menuItems.find(m => m.id === cartItem.id);
      if (!menuItem) throw new Error(`Invalid item ID: ${cartItem.id}`);
      return {
        ...menuItem,
        quantity: cartItem.quantity,
      };
    });

    const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
      orderNumber: `EXO-${Date.now().toString(36).toUpperCase()}`,
      items: orderItems,
      total: total.toFixed(2),
      section: section || 'N/A',
      customerName: name || 'Guest',
      status: 'preparing',
      createdAt: new Date().toISOString(),
      estimatedReady: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };

    const order = await orderService.createOrder(orderData);
    logger.info('New order created', { orderId: order.id, total: order.total });
    res.status(201).json(order);
  } catch (error) {
    logger.error('Order creation failed', error);
    res.status(400).json({ error: error.message });
  }
});

router.patch('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    
    const order = await orderService.updateOrderStatus(req.params.id, status);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    logger.info('Order status updated', { orderId: req.params.id, status });
    res.json(order);
  } catch (error) {
    logger.error('Order update failed', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stadium
router.get('/stadium', (req, res) => {
  res.json(stadiumSections);
});

router.get('/stadium/heatmap', (req, res) => {
  const heatmapData = stadiumSections.sections.map(section => ({
    ...section,
    occupancy: Math.min(1, Math.max(0, section.occupancy + (Math.random() - 0.5) * 0.1)),
    lastUpdated: new Date().toISOString(),
  }));
  res.json(heatmapData);
});

router.get('/restrooms', (req, res) => {
  const restrooms = stadiumSections.restrooms.map(r => ({
    ...r,
    waitTime: Math.max(1, r.waitTime + Math.floor((Math.random() - 0.5) * 4)),
    occupancy: Math.min(1, Math.max(0, r.occupancy + (Math.random() - 0.5) * 0.15)),
    lastUpdated: new Date().toISOString(),
  }));
  res.json(restrooms);
});

// AI Insights (Gemini-powered simulation)
router.get('/ai-insights', (req, res) => {
  const insights = [
    { type: 'crowd', message: "AI predicts peak crowd at Gate B in 15 minutes. Suggest Gate A for faster entry.", priority: 'high' },
    { type: 'food', message: "Chicken Tenders are trending in Section A3. Use mobile order to skip the 12-minute queue.", priority: 'medium' },
    { type: 'restroom', message: "North Restroom wait time is currently 2 mins. Predicted to increase after halftime.", priority: 'low' }
  ];
  res.json({ system: 'Gemini Pro', insights, timestamp: new Date().toISOString() });
});

// Admin Login
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

router.post('/admin/login', (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password } = value;
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'exo2026';

  if (username === ADMIN_USER && password === ADMIN_PASS) {
      logger.info('Admin login successful', { user: username });
      return res.json({ success: true, token: uuidv4() });
  }
  logger.warn('Failed admin login attempt', { user: username });
  res.status(401).json({ error: 'Invalid credentials' });
});

module.exports = router;
