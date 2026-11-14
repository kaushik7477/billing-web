const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const { connectDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static files for images (manager signatures, logos)
app.use('/static', express.static(path.join(__dirname, '..')));

// Mount API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hotels', require('./routes/hotels'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/advance-bookings', require('./routes/advanceBookings'));
app.use('/api/activity', require('./routes/activity'));

// Real-time Server-Sent Events (SSE) for instant cross-tab & cross-device synchronization
const { initEvents } = require('./events');
initEvents(app);

// Root API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Hotel Multi-Property Billing & Super Admin API',
    version: '2.0.0'
  });
});

// Start Server
async function startServer() {
  await connectDB();

  const frontendRoot = path.join(__dirname, '../frontend');
  const frontendDist = path.join(frontendRoot, 'dist');

  // If in development and Vite is installed, attach Vite HMR live dev middleware
  // This enables INSTANT real-time updates on http://localhost:5000 on file save!
  let viteAttached = false;
  if (!isProduction) {
    try {
      const vitePath = path.join(frontendRoot, 'node_modules/vite/dist/node/index.js');
      if (fs.existsSync(vitePath)) {
        // Node ESM import on Windows
        const viteUrl = new URL(`file:///${vitePath.replace(/\\/g, '/')}`).href;
        const { createServer: createViteServer } = await import(viteUrl);
        const vite = await createViteServer({
          configFile: path.join(frontendRoot, 'vite.config.js'),
          server: { middlewareMode: true },
          appType: 'spa',
          root: frontendRoot
        });
        app.use(vite.middlewares);
        viteAttached = true;
        console.log(`⚡ Vite HMR Live-Reload active on http://localhost:${PORT}`);
        console.log(`⚡ Any changes in frontend/src/ will update instantly on save!`);
      }
    } catch (err) {
      console.warn(`[Vite Dev Middleware] Could not attach Vite dev server:`, err.message);
    }
  }

  // Fallback to static dist if Vite middleware wasn't attached
  if (!viteAttached && fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏨 Hotel Multi-Property Billing API running on port ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🔑 Super Admin: admin / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log(`=======================================================`);
  });
}

startServer();
