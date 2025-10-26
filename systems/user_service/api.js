const { UserLogic } = require('./user_logic');
const { UserRepository } = require('../../src/user_repository');
const { messageBus } = require('../../src/message_bus');
const { eventStore } = require('../../src/event_store');

const userRepository = new UserRepository(eventStore);
const userLogic = new UserLogic(userRepository, messageBus);

module.exports = (req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      const { email, password, role } = JSON.parse(body);
      try {
        const userId = await userLogic.registerUser(email, password, role);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ userId }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === 'DELETE') {
    const userId = req.url.split('/')[2];
    (async () => {
      try {
        await userLogic.deactivateUser(userId);
        res.writeHead(204);
        res.end();
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    })();
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
};
