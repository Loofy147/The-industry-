const http = require('http');
const fs = require('fs');
const path = require('path');
const { config } = require('./src/config_loader');

// --- Production Backend Setup ---
// In a real production environment, we would initialize our services here,
// potentially connecting to a real message broker based on the config.
const { MessageBus } = require('./src/message_bus');
const { EventStore } = require('./src/event_store');
const { WebSocketGateway } = require('./src/websocket_gateway');
// For now, we'll continue to use the in-memory bus for simplicity.
const messageBus = new MessageBus();
const eventStore = new EventStore(messageBus);
eventStore.subscribeToAllEvents();
const wsGateway = new WebSocketGateway(messageBus, config.websocketPort);

// The start function will be called by the application's entry point.
const start = () => {
  wsGateway.start();
  server.listen(config.port, () => {
    console.log(`Frontend server running at http://localhost:${config.port}`);
  });
};
// --- End Backend Setup ---

const server = http.createServer((req, res) => {
  // --- Health Check Endpoint ---
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  // --- End Health Check Endpoint ---

  // Static file serving logic
  let filePath = path.join(__dirname, 'frontend', req.url === '/' ? 'index.html' : req.url);
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
  };
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

module.exports = { server, start };
