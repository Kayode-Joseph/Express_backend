require('dotenv').config();
const jwt = require('jsonwebtoken');
const { UnauthenticatedError } = require('../errors');

const authorize = (req, res, next) => {
  if (!req.headers.authorization) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const token= req.headers.authorization

  try {
    const payload = jwt.verify(token, process.env.SECRET);
    // attach the user to the job routes
    req.user = { userId: payload.stormId };
    next();
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid');
  }

 
};

module.exports = authorize;
