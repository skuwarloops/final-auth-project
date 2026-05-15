const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const https = require('https');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Email sending function using Brevo API only
const sendEmail = async (to, subject, html) => {
  const apiKey = process.env.BREVO_API_KEY;
  
  console.log('📧 Attempting to send email to:', to);
  console.log('📧 API Key present:', apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO');
  
  if (!apiKey) {
    console.error('❌ BREVO_API_KEY is missing from environment variables');
    console.log('📧 FALLBACK: Email would be sent to:', to);
    return Promise.resolve({ message: 'API key missing' });
  }

  const data = JSON.stringify({
    sender: { 
      email: process.env.BREVO_LOGIN, 
      name: "Angular Auth App" 
    },
    to: [{ email: to }],
    subject: subject,
    htmlContent: html
  });

  const options = {
    hostname: 'api.brevo.com',
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log('✅ Email sent successfully to:', to);
          resolve(JSON.parse(responseData));
        } else {
          console.error('❌ Email API error:', res.statusCode, responseData);
          reject(new Error(`Email API error: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Email send error:', error.message);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
};

// CORS
app.use(cors({
  origin: [
    'http://localhost:4200',
    'https://final-auth-project-frontend.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://final-auth-project-frontend.onrender.com';
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

// Init DB tables
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      title VARCHAR(20),
      role VARCHAR(20) DEFAULT 'User',
      is_verified BOOLEAN DEFAULT false,
      verification_token VARCHAR(255),
      reset_token VARCHAR(255),
      reset_token_expires TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('✅ Database tables ready');
};

initDB().catch(console.error);

// Helpers
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateToken = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running!' });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Authentication API is running!',
    endpoints: {
      register: 'POST /accounts/register',
      login: 'POST /accounts/authenticate',
      verifyEmail: 'POST /accounts/verify-email',
      forgotPassword: 'POST /accounts/forgot-password',
      resetPassword: 'POST /accounts/reset-password',
      health: 'GET /health'
    }
  });
});

// Register
app.post('/accounts/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, title } = req.body;

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateToken();

    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(countResult.rows[0].count);
    const role = userCount === 0 ? 'Admin' : 'User';

    await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, title, role, is_verified, verification_token)
       VALUES ($1, $2, $3, $4, $5, $6, false, $7)`,
      [email, hashedPassword, firstName, lastName, title, role, verificationToken]
    );

    const verifyUrl = `${FRONTEND_URL}/account/verify-email?token=${verificationToken}`;
    
    // Alternative verification URL (direct API call)
    const apiVerifyUrl = `https://final-auth-project.onrender.com/accounts/verify-email?token=${verificationToken}`;

    await sendEmail(
      email,
      'Verify your email - Angular Auth App',
      `
        <h2>Welcome ${firstName || 'User'}!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}" style="background:#2E75B6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          Verify Email
        </a>
        <p>Or copy this link: ${verifyUrl}</p>
        <hr>
        <p><strong>🔧 For testing:</strong> If email doesn't arrive, you can verify manually using this API call:</p>
        <code>curl -X POST ${apiVerifyUrl}</code>
      `
    );

    console.log(`✅ User registered: ${email} (${role})`);
    console.log(`🔗 Verification link (copy this if email fails): ${verifyUrl}`);
    
    res.status(201).json({ 
      message: 'Registration successful. Please check your email to verify your account.',
      debug_verification_link: process.env.NODE_ENV !== 'production' ? verifyUrl : undefined
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Email - Supports both POST and GET
app.post('/accounts/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    const result = await pool.query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id, email',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    console.log(`✅ Email verified for: ${result.rows[0].email}`);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Also support GET for easier testing
app.get('/accounts/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: 'Token required' });
    }
    
    const result = await pool.query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id, email',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    console.log(`✅ Email verified for: ${result.rows[0].email}`);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/accounts/authenticate', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_verified = true', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    const refreshToken = generateToken();
    await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [user.id, refreshToken]);

    const accessToken = generateAccessToken(user);

    console.log(`✅ Login: ${email} (${user.role})`);
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      title: user.title,
      role: user.role,
      isVerified: user.is_verified,
      jwtToken: accessToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh Token
app.post('/accounts/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

    const tokenResult = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]
    );
    if (tokenResult.rows.length === 0) return res.status(401).json({ message: 'Invalid refresh token' });

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [tokenResult.rows[0].user_id]);
    const user = userResult.rows[0];

    const newRefreshToken = generateToken();
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [user.id, newRefreshToken]);

    const accessToken = generateAccessToken(user);
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      title: user.title,
      role: user.role,
      isVerified: user.is_verified,
      jwtToken: accessToken
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke Token
app.post('/accounts/revoke-token', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }
    res.json({});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password
app.post('/accounts/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const resetToken = generateToken();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
        [resetToken, expires, user.id]
      );

      const resetUrl = `${FRONTEND_URL}/account/reset-password?token=${resetToken}`;

      await sendEmail(
        email,
        'Reset your password - Angular Auth App',
        `
          <h2>Password Reset</h2>
          <p>Hi ${user.first_name || 'User'},</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background:#2E75B6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
            Reset Password
          </a>
          <p>Or copy this link: ${resetUrl}</p>
          <p>This link expires in 24 hours.</p>
        `
      );
    }

    res.json({});
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Validate Reset Token
app.post('/accounts/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    const result = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
app.post('/accounts/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const result = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL, is_verified = true WHERE id = $2',
      [hashedPassword, result.rows[0].id]
    );

    res.json({});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Auth middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all accounts
app.get('/accounts', verifyToken, async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
  const result = await pool.query(
    'SELECT id, email, first_name as "firstName", last_name as "lastName", title, role, is_verified as "isVerified" FROM users'
  );
  res.json(result.rows);
});

// Get account by ID
app.get('/accounts/:id', verifyToken, async (req, res) => {
  const result = await pool.query(
    'SELECT id, email, first_name as "firstName", last_name as "lastName", title, role, is_verified as "isVerified" FROM users WHERE id = $1',
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
  res.json(result.rows[0]);
});

// Create account (Admin)
app.post('/accounts', verifyToken, async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
  const { email, firstName, lastName, title, role, password } = req.body;
  const hashedPassword = await bcrypt.hash(password || 'Password123', 10);
  const result = await pool.query(
    `INSERT INTO users (email, password, first_name, last_name, title, role, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id, email, first_name as "firstName", last_name as "lastName", title, role, is_verified as "isVerified"`,
    [email, hashedPassword, firstName, lastName, title, role || 'User']
  );
  res.status(201).json(result.rows[0]);
});

// Update account
app.put('/accounts/:id', verifyToken, async (req, res) => {
  const { firstName, lastName, title, email, role, password } = req.body;
  const id = req.params.id;

  let updateQuery = `UPDATE users SET 
    first_name = COALESCE($1, first_name),
    last_name = COALESCE($2, last_name),
    title = COALESCE($3, title),
    email = COALESCE($4, email)`;
  
  const params = [firstName, lastName, title, email];

  if (role && req.user.role === 'Admin') {
    updateQuery += `, role = $${params.length + 1}`;
    params.push(role);
  }

  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    updateQuery += `, password = $${params.length + 1}`;
    params.push(hashed);
  }

  updateQuery += ` WHERE id = $${params.length + 1} RETURNING id, email, first_name as "firstName", last_name as "lastName", title, role, is_verified as "isVerified"`;
  params.push(id);

  const result = await pool.query(updateQuery, params);
  res.json(result.rows[0]);
});

// Delete account
app.delete('/accounts/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Admin access required' });
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({});
});

// Debug endpoint to manually verify a user (remove in production)
app.post('/debug/verify-user', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  
  const result = await pool.query(
    'UPDATE users SET is_verified = true WHERE email = $1 RETURNING id, email',
    [email]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  console.log(`🔧 Debug: Manually verified ${email}`);
  res.json({ message: `User ${email} verified successfully` });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});