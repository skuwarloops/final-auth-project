const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory database (temporary - replace with real DB later)
let users = [];
let refreshTokens = [];

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4200',
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

// ============ AUTH ENDPOINTS ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// Register
app.post('/api/accounts/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, title } = req.body;
    
    console.log('Register request:', { email, firstName, lastName, title });
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.random().toString(36).substring(2);
    
    // Create new user (first user becomes Admin)
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      title,
      role: users.length === 0 ? 'Admin' : 'User',
      isVerified: false,
      verificationToken
    };
    
    users.push(newUser);
    
    console.log(`✅ User registered: ${email}`);
    console.log(`🔗 Verification link: http://localhost:4200/account/verify-email?token=${verificationToken}`);
    
    res.status(201).json({ message: 'Registration successful. Please verify your email.' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Email
app.post('/api/accounts/verify-email', (req, res) => {
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

// Login (Authenticate)
app.post('/api/accounts/authenticate', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email);
    
    const user = users.find(u => u.email === email && u.isVerified === true);
    
    if (!user) {
      console.log('❌ User not found or not verified:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const refreshToken = generateRefreshToken();
    refreshTokens.push(refreshToken);
    
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
      jwtToken: accessToken,
      refreshToken: refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh Token
app.post('/api/accounts/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
  
  // Find user by refresh token (simplified)
  const user = users.find(u => u.id);
  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }
  
  const newAccessToken = generateAccessToken(user);
  res.json({ jwtToken: newAccessToken });
});

// Revoke Token (Logout)
app.post('/api/accounts/revoke-token', (req, res) => {
  const { refreshToken } = req.body;
  
  if (refreshToken) {
    const index = refreshTokens.indexOf(refreshToken);
    if (index !== -1) {
      refreshTokens.splice(index, 1);
    }
  }
  
  res.json({});
});

// Forgot Password
app.post('/api/accounts/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  
  if (user) {
    const resetToken = Math.random().toString(36).substring(2);
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    console.log(`🔗 Reset link: http://localhost:4200/account/reset-password?token=${resetToken}`);
  }
  
  res.json({});
});

// Validate Reset Token
app.post('/api/accounts/validate-reset-token', (req, res) => {
  const { token } = req.body;
  const user = users.find(u => u.resetToken === token && new Date() < new Date(u.resetTokenExpires));
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
  
  res.json({});
});

// Reset Password
app.post('/api/accounts/reset-password', async (req, res) => {
  const { token, password } = req.body;
  const user = users.find(u => u.resetToken === token && new Date() < new Date(u.resetTokenExpires));
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  delete user.resetToken;
  delete user.resetTokenExpires;
  
  res.json({});
});

// ============ ADMIN ENDPOINTS ============

// Get all users (Admin only)
app.get('/api/accounts', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    if (decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const usersList = users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      title: u.title,
      role: u.role,
      isVerified: u.isVerified
    }));
    
    res.json(usersList);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Create user (Admin only)
app.post('/api/accounts', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    if (decoded.role !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { email, firstName, lastName, title, role } = req.body;
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      title,
      role: role || 'User',
      isVerified: true
    };
    
    users.push(newUser);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});