require('dotenv').config();
const jwt = require('jsonwebtoken');
const { UnauthenticatedError } = require('../errors');

const adminAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const token = req.headers.authorization;

  try {
    const payload = jwt.verify(token, process.env.ADMINUSERSECRET);
    // attach the user to req
    req.user = { userId: payload.adminId };
    next();
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid');
  }
};

module.exports = adminAuth;
