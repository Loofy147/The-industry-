const http = require('http');
const { config } = require('./config_loader');
const { metricsService } = require('./metrics_service');

const { verifyToken } = require('./auth');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized' }));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Unauthorized' }));
  }

  req.user = decoded;
  next();
};

const authorize = (req, res, next) => {
  // This is a placeholder for a more complex authorization logic.
  // For example, you could check if the user has the required role.
  if (req.user) {
    next();
  } else {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Forbidden' }));
  }
};

const routes = {
  '/users': require('../systems/user_service/api'),
  '/notifications': require('../systems/notification_service/api'),
  // Add other service routes here
};

const server = http.createServer((req, res) => {
  metricsService.incrementCounter('http_requests_total', { method: req.method, path: req.url, source: 'api_gateway' });

  const [urlPath] = req.url.split('?');
  if (urlPath === '/healthz') {
    handleRequest(req, res);
    return;
  }

  const middleware = [authenticate, authorize];

  const runMiddleware = (index) => {
    if (index >= middleware.length) {
      handleRequest(req, res);
      return;
    }
    middleware[index](req, res, () => runMiddleware(index + 1));
  };

  runMiddleware(0);
});

function handleRequest(req, res) {
  const [urlPath] = req.url.split('?');

  if (urlPath === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  const route = Object.keys(routes).find(r => urlPath.startsWith(r));
  const serviceApi = routes[route];

  if (serviceApi) {
    serviceApi(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
}

const start = () => {
  return server.listen(config.apiGatewayPort, () => {
    console.log(`API Gateway running at http://localhost:${config.apiGatewayPort}`);
  });
};

module.exports = { start };
