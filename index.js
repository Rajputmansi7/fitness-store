// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const { nanoid } = require('nanoid');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('./utils');

const PORT = process.env.PORT || 4000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fitnessmvp.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

const app = express();
app.use(cors());
app.use(express.json());

// lowdb
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function initDB(){
  await db.read();
  db.data = db.data || { users: [], products: [], activities: [] };
  await db.write();
}
initDB();

// Helpers
function calcBMI(weightKg, heightCm) {
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  return Math.round(bmi * 10) / 10;
}
function fitnessAge(bmi, age) {
  if (bmi < 18.5) return age + 1;
  if (bmi < 25) return age;
  if (bmi < 30) return age + 5;
  return age + 10;
}
async function logActivity(type, email, details = {}) {
  await db.read();
  db.data.activities.push({
    id: nanoid(),
    time: new Date().toISOString(),
    type,
    email,
    details
  });
  await db.write();
}
function generateToken(payload){
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}
function verifyToken(token){
  try{
    return jwt.verify(token, JWT_SECRET);
  }catch(e){
    return null;
  }
}

// Routes

// Signup
app.post('/api/signup',
  body('name').isLength({min:2}),
  body('email').isEmail(),
  body('password').isLength({min:6}),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password } = req.body;
    await db.read();
    const exists = db.data.users.find(u => u.email === email);
    if (exists) return res.status(400).json({error:'Email already exists'});
    const hashed = await hashPassword(password);
    const user = { id: nanoid(), name, email, password: hashed, profile: null, createdAt: new Date().toISOString() };
    db.data.users.push(user);
    await db.write();
    await logActivity('signup', email, { name });
    const token = generateToken({ id: user.id, email: user.email, name: user.name, admin: false });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email }, token });
  }
);

// Login
app.post('/api/login',
  body('email').isEmail(),
  body('password').isLength({min:1}),
  async (req, res) => {
    const { email, password } = req.body;
    // admin shortcut
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD){
      const token = generateToken({ email, admin: true });
      await logActivity('admin_login', email);
      return res.json({ success: true, admin: true, email, token });
    }
    await db.read();
    const user = db.data.users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    await logActivity('login', email);
    const token = generateToken({ id: user.id, email: user.email, name: user.name, admin: false });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email }, token });
  }
);

// middleware to protect routes
async function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  const payload = verifyToken(token);
  if(!payload) return res.status(401).json({ error: 'Invalid token' });
  req.user = payload;
  next();
}

// Save profile + BMI calculation (protected)
// Updated: persist user.name and user.email; return new token if email changed
app.post('/api/profile',
  authMiddleware,
  body('name').isLength({min:2}),
  body('gender').isIn(['male','female','other']),
  body('age').isInt({min:10,max:120}),
  body('heightCm').isFloat({min:50,max:260}),
  body('weightKg').isFloat({min:20,max:500}),
  async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, gender, age, heightCm, weightKg, email: newEmail } = req.body;
    await db.read();

    const user = db.data.users.find(u => u.email === req.user.email || u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If requested email change, ensure it's not used
    let returnedToken = null;
    if (newEmail && newEmail !== user.email) {
      const already = db.data.users.find(u => u.email === newEmail);
      if (already) return res.status(400).json({ error: 'Email already in use' });
      user.email = newEmail;
      // generate a new token with updated email
      returnedToken = generateToken({ id: user.id, email: user.email, name: user.name, admin: false });
    }

    // update name
    user.name = name;

    const bmi = calcBMI(Number(weightKg), Number(heightCm));
    const fitness_age = fitnessAge(bmi, Number(age));
    user.profile = { name, gender, age: Number(age), heightCm: Number(heightCm), weightKg: Number(weightKg), bmi, fitness_age, updatedAt: new Date().toISOString() };

    await db.write();
    await logActivity('profile_update', user.email, { bmi, fitness_age });

    const response = { success: true, profile: user.profile };
    if (returnedToken) response.token = returnedToken;
    res.json(response);
  }
);

// Get products (public)
app.get('/api/products', async (req, res) => {
  await db.read();
  res.json(db.data.products || []);
});

// Bill calculation (protected)
app.post('/api/cart/bill',
  authMiddleware,
  body('items').isArray({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    await db.read();
    const products = db.data.products;
    const { items } = req.body;
    let subtotal = 0;
    const details = items.map(it => {
      const p = products.find(x => x.id === it.id);
      const qty = Number(it.qty) || 1;
      const line = { id: p.id, name: p.name, company: p.company, price: p.price, qty, lineTotal: Math.round(p.price * qty * 100)/100 };
      subtotal += line.lineTotal;
      return line;
    });
    const shipping = subtotal > 100 ? 0 : 5;
    const tax = Math.round(subtotal * 0.12 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;
    await logActivity('checkout', req.user.email, { subtotal, shipping, tax, total, itemsCount: items.length });
    res.json({ subtotal, shipping, tax, total, details });
  }
);

// Admin endpoints (protected & admin only) — enhanced
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  if (!req.user.admin) return res.status(403).json({ error: 'forbidden' });
  await db.read();
  const q = (req.query.q || '').toLowerCase();
  let users = db.data.users.map(u => ({ id: u.id, name: u.name, email: u.email, profile: u.profile }));
  if(q) users = users.filter(u => (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
  res.json(users);
});

// update user (admin)
app.put('/api/admin/user/:id', authMiddleware, body('name').optional().isLength({min:2}), body('email').optional().isEmail(), async (req, res) => {
  if (!req.user.admin) return res.status(403).json({ error: 'forbidden' });
  const { id } = req.params;
  const { name, email } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.id === id);
  if(!user) return res.status(404).json({ error: 'user not found' });
  if(email && email !== user.email){
    const already = db.data.users.find(u => u.email === email);
    if(already) return res.status(400).json({ error: 'Email already used' });
    user.email = email;
  }
  if(name) user.name = name;
  await db.write();
  await logActivity('admin_update_user', req.user.email, { id, name, email });
  res.json({ success:true, user: { id: user.id, name: user.name, email: user.email }});
});

// delete user (admin)
app.delete('/api/admin/user/:id', authMiddleware, async (req, res) => {
  if (!req.user.admin) return res.status(403).json({ error: 'forbidden' });
  const { id } = req.params;
  await db.read();
  const idx = db.data.users.findIndex(u => u.id === id);
  if(idx === -1) return res.status(404).json({ error: 'not found' });
  const removed = db.data.users.splice(idx,1);
  await db.write();
  await logActivity('admin_delete_user', req.user.email, { id });
  res.json({ success:true, removed: removed[0] });
});

// admin activities (with filter & export)
app.get('/api/admin/activities', authMiddleware, async (req, res) => {
  if (!req.user.admin) return res.status(403).json({ error: 'forbidden' });
  await db.read();
  const q = (req.query.q || '').toLowerCase();
  let acts = db.data.activities.slice().reverse();
  if(q) acts = acts.filter(a => (a.type||'').toLowerCase().includes(q) || (a.email||'').toLowerCase().includes(q) || JSON.stringify(a.details).toLowerCase().includes(q));
  res.json(acts);
});

// export activities as JSON (admin)
app.get('/api/admin/activities/export', authMiddleware, async (req, res) => {
  if (!req.user.admin) return res.status(403).json({ error: 'forbidden' });
  await db.read();
  res.setHeader('Content-Disposition', 'attachment; filename="activities.json"');
  res.json(db.data.activities);
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
