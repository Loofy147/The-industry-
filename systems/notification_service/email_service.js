/**
 * This module adheres to the Single Responsibility Principle.
 * Its only responsibility is to handle email notifications.
 * It has only one reason to change: if the method of sending emails changes.
 */

const { CircuitBreaker } = require('../../src/circuit_breaker');

class EmailService {
  constructor(emailClient) {
    this.emailClient = emailClient;
    this.circuitBreaker = new CircuitBreaker();
  }

  async sendWelcomeEmail(email) {
    // The logic for what constitutes a "welcome email" lives here.
    return this.circuitBreaker.execute(() =>
      this.emailClient.send(
        email,
        'Welcome!',
        'Thanks for signing up.'
      )
    );
  }
}

// Stand-in for a real email client for demonstration.
const fakeEmailClient = {
  send: async (to, subject, body) => {
    console.log(`Sending email to ${to}: ${subject}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }
};

const emailService = new EmailService(fakeEmailClient);

module.exports = { EmailService, emailService };
