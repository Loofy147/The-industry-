const WebSocket = require('ws');

/**
 * The WebSocketGateway provides a real-time bridge between the backend
 * message bus and connected frontend clients.
 */
class WebSocketGateway {
  constructor(messageBus, port = 8080) {
    this.messageBus = messageBus;
    this.port = port;
    this.wss = null;
  }

  /**
   * Starts the WebSocket server and subscribes to the message bus.
   */
  start() {
    this.wss = new WebSocket.Server({ port: this.port });

    this.wss.on('connection', ws => {
      console.log('WebSocketGateway: A new client connected.');
      ws.on('close', () => {
        console.log('WebSocketGateway: Client disconnected.');
      });
    });

    // Subscribe to all relevant events from the message bus.
    this.messageBus.subscribe('UserRegistered', this._broadcast.bind(this));
    this.messageBus.subscribe('UserDeactivated', this._broadcast.bind(this));


    console.log(`WebSocketGateway started on ws://localhost:${this.port}`);
  }

  /**
   * Stops the WebSocket server.
   */
  stop() {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          console.log('WebSocketGateway stopped.');
          this.wss = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Broadcasts an event to all connected clients.
   * @param {object} event The event to broadcast.
   */
  _broadcast(event) {
    if (!this.wss) return;

    console.log('WebSocketGateway: Broadcasting event to clients:', event.type);
    const message = JSON.stringify(event);
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

module.exports = { WebSocketGateway };
