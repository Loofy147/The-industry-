const express = require('express');
const { emailService } = require('./email_service');

const router = express.Router();

router.post('/', async (req, res, next) => {
  const { email } = req.body;
  try {
    await emailService.sendWelcomeEmail(email);
    res.status(200).json({ message: 'Welcome email sent.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
