const http = require('http');
const fs = require('fs');
const path = require('path');
const { UserLogic } = require('./systems/user_service/user_logic');
const { UserRepository } = require('./src/user_repository');
const { EventStore } = require('./src/event_store');
const { MessageBus } = require('./src/message_bus');

const PORT = 3000;

// --- Backend Setup for Test Endpoint ---
const messageBus = new MessageBus();
const eventStore = new EventStore(messageBus);
const userRepository = new UserRepository(eventStore);
const userLogic = new UserLogic(userRepository, messageBus);
eventStore.subscribeToAllEvents();
// We also need to start the WebSocket gateway to push events to the frontend.
const { WebSocketGateway } = require('./src/websocket_gateway');
const wsGateway = new WebSocketGateway(messageBus, 8080);
wsGateway.start();
// --- End Backend Setup ---

const server = http.createServer((req, res) => {
  // --- Test Endpoint ---
  if (req.url === '/test-dispatch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const { email, password } = JSON.parse(body);
      userLogic.registerUser(email, password);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Command dispatched' }));
    });
    return;
  }
  // --- End Test Endpoint ---

  // Determine the file path, defaulting to index.html
  let filePath = path.join(__dirname, 'frontend', req.url === '/' ? 'index.html' : req.url);

  // Get the file extension
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
        // Page not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start the server only if this file is run directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}`);
  });
}

module.exports = server; // Export for testing purposes
