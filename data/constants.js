/**
 * Stadium and Menu Constants
 */

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

module.exports = { menuItems, stadiumSections };
