const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your-secret-key'; // In a real app, use a more secure key and manage it properly

const generateToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
