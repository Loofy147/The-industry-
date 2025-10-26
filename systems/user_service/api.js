const express = require('express');
const { UserLogic } = require('./user_logic');
const { UserRepository } = require('../../src/user_repository');
const { messageBus } = require('../../src/message_bus');
const { eventStore } = require('../../src/event_store');

const router = express.Router();
const userRepository = new UserRepository(eventStore);
const userLogic = new UserLogic(userRepository, messageBus);

router.post('/', async (req, res, next) => {
  const { email, password, role } = req.body;
  try {
    const userId = await userLogic.registerUser(email, password, role);
    res.status(201).json({ userId });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    await userLogic.deactivateUser(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
