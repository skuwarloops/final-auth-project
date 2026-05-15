const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory database
let users = [];
let refreshTokens = [];

// CORS configuration - allow your frontend
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://final-auth-project-frontend.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());

// ============ HELPER FUNCTIONS ============
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://final-auth-project-frontend.onrender.com';

// ============ AUTH ENDPOINTS ============

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// Register
app.post('/accounts/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, title } = req.body;
    console.log('Register request:', { email, firstName, lastName, title });

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.random().toString(36).substring(2);

    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      title,
      role: users.length === 0 ? 'Admin' : 'User',
      isVerified: false,
      verificationToken,
      refreshTokens: []
    };

    users.push(newUser);

    console.log(`✅ User registered: ${email}`);
    console.log(`🔗 Verification link: ${FRONTEND_URL}/account/verify-email?token=${verificationToken}`);

    res.status(201).json({ message: 'Registration successful. Please verify your email.' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Email
app.post('/accounts/verify-email', (req, res) => {
  try {
    const { token } = req.body;
    const user = users.find(u => u.verificationToken === token);

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    user.isVerified = true;
    delete user.verificationToken;

    console.log(`✅ Email verified: ${user.email}`);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/accounts/authenticate', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    const user = users.find(u => u.email === email && u.isVerified === true);

    if (!user) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    const refreshToken = generateRefreshToken();
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);

    const accessToken = generateAccessToken(user);

    console.log(`✅ Login successful: ${email} (${user.role})`);

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      title: user.title,
      role: user.role,
      isVerified: user.isVerified,
      jwtToken: accessToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh Token
app.post('/accounts/refresh-token', (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token' });
  }

  const user = users.find(u => u.refreshTokens && u.refreshTokens.includes(refreshToken));
  if (!user) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const newRefreshToken = generateRefreshToken();
  user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
  user.refreshTokens.push(newRefreshToken);

  const accessToken = generateAccessToken(user);

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    title: user.title,
    role: user.role,
    isVerified: user.isVerified,
    jwtToken: accessToken
  });
});

// Revoke Token (Logout)
app.post('/accounts/revoke-token', (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (refreshToken) {
    users.forEach(u => {
      if (u.refreshTokens) {
        u.refreshTokens = u.refreshTokens.filter(t => t !== refreshToken);
      }
    });
  }

  res.json({});
});

// Forgot Password
app.post('/accounts/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);

  if (user) {
    const resetToken = Math.random().toString(36).substring(2);
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    console.log(`🔗 Reset link: ${FRONTEND_URL}/account/reset-password?token=${resetToken}`);
  }

  res.json({});
});

// Validate Reset Token
app.post('/accounts/validate-reset-token', (req, res) => {
  const { token } = req.body;
  const user = users.find(u => u.resetToken === token && new Date() < new Date(u.resetTokenExpires));

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  res.json({});
});

// Reset Password
app.post('/accounts/reset-password', async (req, res) => {
  const { token, password } = req.body;
  const user = users.find(u => u.resetToken === token && new Date() < new Date(u.resetTokenExpires));

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  user.password = await bcrypt.hash(password, 10);
  user.isVerified = true;
  delete user.resetToken;
  delete user.resetTokenExpires;

  res.json({});
});

// ============ ADMIN ENDPOINTS ============

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all accounts
app.get('/accounts', verifyToken, (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  const usersList = users.map(u => ({
    id: u.id, email: u.email, firstName: u.firstName,
    lastName: u.lastName, title: u.title, role: u.role, isVerified: u.isVerified
  }));
  res.json(usersList);
});

// Get account by ID
app.get('/accounts/:id', verifyToken, (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password, refreshTokens, resetToken, resetTokenExpires, verificationToken, ...safeUser } = user;
  res.json(safeUser);
});

// Create account (Admin)
app.post('/accounts', verifyToken, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  const { email, firstName, lastName, title, role, password } = req.body;
  const hashedPassword = await bcrypt.hash(password || 'Password123', 10);
  const newUser = {
    id: users.length + 1, email, password: hashedPassword,
    firstName, lastName, title, role: role || 'User',
    isVerified: true, refreshTokens: []
  };
  users.push(newUser);
  const { password: p, refreshTokens: rt, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// Update account
app.put('/accounts/:id', verifyToken, async (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { firstName, lastName, title, email, role, password } = req.body;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (title) user.title = title;
  if (email) user.email = email;
  if (role && req.user.role === 'Admin') user.role = role;
  if (password) user.password = await bcrypt.hash(password, 10);

  const { password: p, refreshTokens: rt, ...safeUser } = user;
  res.json(safeUser);
});

// Delete account
app.delete('/accounts/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  users = users.filter(u => u.id !== parseInt(req.params.id));
  res.json({});
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});