const express = require('express');
const { config } = require('./config_loader');
const { metricsService } = require('./metrics_service');
const { verifyToken } = require('./auth');

const app = express();

// Middleware
app.use(express.json()); // for parsing application/json
app.use((req, res, next) => {
  metricsService.incrementCounter('http_requests_total', { method: req.method, path: req.url, source: 'api_gateway' });
  next();
});

// Routes
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = decoded;
  next();
};

// Authorization middleware (placeholder)
const authorize = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden' });
  }
};

// Protected routes
app.use('/users', authenticate, authorize, require('../systems/user_service/api'));
app.use('/notifications', authenticate, authorize, require('../systems/notification_service/api'));

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});


const start = () => {
  return app.listen(config.apiGatewayPort, () => {
    console.log(`API Gateway running at http://localhost:${config.apiGatewayPort}`);
  });
};

module.exports = { app, start };
