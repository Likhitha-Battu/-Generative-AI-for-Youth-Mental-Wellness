// Simple Node.js + Express backend using MongoDB (Mongoose)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_long_secret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gai_youth_mh';

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => { console.error('MongoDB error', err); process.exit(1); });

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  password: String,
  createdAt: { type: Date, default: Date.now }
});

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  reply: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email: email.toLowerCase().trim(), password: hashed });
    await user.save();
    const payload = { id: user._id, name: user.name, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: payload, token });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Email already registered' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    const payload = { id: user._id, name: user.name, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: payload, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Chat - simple empathetic generator (no external AI)
function generateReply(message) {
  const m = (message || '').toLowerCase();
  const empathy = [
    "I'm sorry you're feeling this way. ",
    "That sounds really tough — thank you for sharing. ",
    "I hear you. It can be overwhelming. "
  ];
  let reply = empathy[Math.floor(Math.random()*empathy.length)];

  if (m.includes('anx') || m.includes('nerv') || m.includes('worri')) {
    reply += "It sounds like anxiety is coming up. Try grounding: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. Small steps can help.";
  } else if (m.includes('depress') || m.includes('sad') || m.includes('hopeless')) {
    reply += "I'm sorry you're feeling low. Have you tried connecting with someone you trust about this? If things feel very heavy, reaching out to a professional or a crisis hotline can really help.";
  } else if (m.includes('sleep') || m.includes('insomnia')) {
    reply += "Sleep issues are common during stress. A short wind-down routine (no screens, light reading, calm breathing) can help reset your sleep cycle.";
  } else if (m.includes('stres') || m.includes('overwhelm')) {
    reply += "When stress piles up, try breaking tasks into tiny steps and prioritizing. Even tiny progress is progress.";
  } else {
    reply += "Can you tell me a bit more about what's happening? If you're in immediate danger or feel you might harm yourself, please contact your local emergency services or a crisis helpline right away.";
  }
  reply += " If you'd like, I can suggest grounding exercises, short journaling prompts, or NGOs/university counselling resources.";
  return reply;
}

app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message' });
    const reply = generateReply(message);
    const session = new Session({ userId: req.user.id, message, reply });
    await session.save();
    res.json({ reply, id: session._id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);
    res.json({ sessions });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve frontend build if present
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
