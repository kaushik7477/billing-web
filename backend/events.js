// backend/events.js
// Real-time Event Broadcaster via Server-Sent Events (SSE)
// Notifies all connected clients (SuperAdmin & Manager portals) instantly when any room, bill, booking, or tariff changes.

const clients = new Set();

function initEvents(app) {
  // GET /api/events (SSE Stream)
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on Nginx / Render proxies
    if (res.flushHeaders) res.flushHeaders();

    // Send initial handshake
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
    });
  });

  // Keep-alive heartbeat every 20 seconds to prevent connection timeouts on cloud hosts (Render, Heroku, etc.)
  setInterval(() => {
    const ping = `data: ${JSON.stringify({ type: 'PING', timestamp: Date.now() })}\n\n`;
    for (const client of clients) {
      try {
        client.write(ping);
      } catch (err) {
        clients.delete(client);
      }
    }
  }, 20000);
}

function broadcastChange(type = 'DATA_UPDATED', details = {}) {
  const message = `data: ${JSON.stringify({ type, ...details, timestamp: Date.now() })}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch (err) {
      clients.delete(client);
    }
  }
}

module.exports = {
  initEvents,
  broadcastChange
};
