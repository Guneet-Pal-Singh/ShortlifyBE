import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { nanoid } from 'nanoid';
import geoip from 'geoip-lite';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import Url from './models/Url.js';
import User from './models/User.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Authentication Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error();

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Protected Routes
app.post('/api/shorten', auth, async (req, res) => {
  try {
    const { longUrl, customAlias, expiresAt } = req.body;
    
    if (!longUrl || !/^https?:\/\/.+\..+/.test(longUrl)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Check if custom alias is available
    if (customAlias) {
      const existing = await Url.findOne({ customAlias });
      if (existing) {
        return res.status(400).json({ error: 'Custom alias already taken' });
      }
    }

    const shortId = customAlias || nanoid(6);
    const newUrl = new Url({
      shortId,
      longUrl,
      customAlias,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      user: req.user._id
    });
    
    await newUrl.save();
    res.json({ shortUrl: `${process.env.BASE_URL}/${shortId}` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's URLs
app.get('/api/urls', auth, async (req, res) => {
  try {
    const urls = await Url.find({ user: req.user._id });
    res.json(urls);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get URL analytics
app.get('/api/urls/:shortId/analytics', async (req, res) => {
  try {
    const url = await Url.findOne({ shortId: req.params.shortId });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    res.json({
      clicks: url.clicks,
      analytics: url.analytics
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate QR Code
app.get('/api/urls/:shortId/qr', async (req, res) => {
  try {
    const url = await Url.findOne({ shortId: req.params.shortId });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    const qrCode = await QRCode.toDataURL(`${process.env.BASE_URL}/${url.shortId}`);
    res.json({ qrCode });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete URL
app.delete('/api/urls/:shortId', async (req, res) => {
  try {
    const url = await Url.findOneAndDelete({ shortId: req.params.shortId });
    
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Preview page
app.get('/preview/:shortId', async (req, res) => {
  try {
    const url = await Url.findOne({ shortId: req.params.shortId });
    if (!url) {
      return res.status(404).send('URL not found');
    }
    
    res.send(`
      <html>
        <head>
          <title>Preview - ${url.longUrl}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            .preview { background: #f5f5f5; padding: 20px; border-radius: 8px; }
            .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="preview">
            <h2>You are about to visit:</h2>
            <p>${url.longUrl}</p>
            <a href="${url.longUrl}" class="button">Continue to site</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(400).send('Error loading preview');
  }
});

// Redirect to long URL with analytics
app.get('/:shortId', async (req, res) => {
  try {
    const url = await Url.findOne({ shortId: req.params.shortId });
    
    if (!url || !url.isActive) {
      return res.status(404).send('URL not found or inactive');
    }
    
    if (url.expiresAt && new Date() > url.expiresAt) {
      url.isActive = false;
      await url.save();
      return res.status(410).send('URL has expired');
    }
    
    // Record analytics
    const ip = req.ip;
    const geo = geoip.lookup(ip);
    url.analytics.push({
      timestamp: new Date(),
      ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || 'Direct',
      country: geo?.country,
      city: geo?.city
    });
    url.clicks += 1;
    await url.save();
    
    res.redirect(url.longUrl);
  } catch (error) {
    res.status(400).send('Error redirecting');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
