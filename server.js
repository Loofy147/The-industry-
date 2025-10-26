const http = require('http');
const fs = require('fs');
const path = require('path');
const { config } = require('./src/config_loader');

// --- Production Backend Setup ---
// In a real production environment, we would initialize our services here,
// potentially connecting to a real message broker based on the config.
const { EventStore } = require('./src/event_store');
const { WebSocketGateway } = require('./src/websocket_gateway');
// For now, we'll continue to use the in-memory bus for simplicity.
const { messageBus } = require('./src/message_bus');
const { circuitBreakerRegistry } = require('./src/circuit_breaker_registry');
const { configService } = require('./src/config_service');
const { serviceRegistry } = require('./src/service_registry');
const { ProjectorManager } = require('./src/projector_manager');
const { UserReadModelProjector } = require('./src/user_read_model_projector');
const { eventStore } = require('./src/event_store');
const { metricsService } = require('./src/metrics_service');

// Register HTTP metrics
metricsService.registerCounter('http_requests_total', 'Total number of HTTP requests.');

const projectorManager = new ProjectorManager(eventStore);
const userReadModelProjector = new UserReadModelProjector(eventStore, projectorManager);
eventStore.subscribeToAllEvents();
const wsGateway = new WebSocketGateway(messageBus, config.websocketPort);

// The start function will be called by the application's entry point.
const { start: startApiGateway } = require('./src/api_gateway');

const start = () => {
  wsGateway.start();
  startApiGateway();
  server.listen(config.port, () => {
    console.log(`Frontend server running at http://localhost:${config.port}`);
  });
};
// --- End Backend Setup ---

const server = http.createServer(async (req, res) => {
  // Instrument every request
  metricsService.incrementCounter('http_requests_total', { method: req.method, path: req.url });

  // --- Control API ---
  if (req.url.startsWith('/control')) {
    // GET /control/config
    if (req.url === '/control/config' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(configService.get()));
    }

    // PATCH /control/config
    if (req.url === '/control/config' && req.method === 'PATCH') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      return req.on('end', () => {
        try {
          const updates = JSON.parse(body);
          configService.update(updates);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', updated: updates }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        }
      });
    }

    // GET /control/circuit-breakers
    if (req.url === '/control/circuit-breakers' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(circuitBreakerRegistry.getAllStatus()));
    }

    // GET /control/message-bus/dlq
    if (req.url === '/control/message-bus/dlq' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(messageBus.deadLetterQueue));
    }

    // GET /control/services
    if (req.url === '/control/services' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      // Convert Map to an array of objects for JSON serialization
      const services = Array.from(serviceRegistry.getAll().values());
      return res.end(JSON.stringify(services));
    }

    // POST /control/projectors/:name/replay
    const replayMatch = req.url.match(/^\/control\/projectors\/(.+)\/replay$/);
    if (replayMatch && req.method === 'POST') {
      const projectorName = replayMatch[1];
      try {
        await projectorManager.replay(projectorName);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok', message: `Replay started for ${projectorName}` }));
      } catch (error) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: error.message }));
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Control endpoint not found' }));
  }

  // --- Metrics Endpoint ---
  if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(metricsService.render());
  }

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

module.exports = { server, start, userReadModelProjector };
