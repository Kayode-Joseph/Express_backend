require('dotenv').config();
const jwt = require('jsonwebtoken');
const { UnauthenticatedError } = require('../errors');

const authorize = (req, res, next) => {
  if (!req.headers.authorization) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const token = req.headers.authorization;

 



  if (token.substring(0, 5) === 'ADMIN') {
  
    if (token.substring(6) === process.env.ADMINPASSWORD) {
      req.user = { userId: req.body.stormId };

      next();

      return;
    } else {
      throw new UnauthenticatedError('Authentication invalid');
    }
  }

  try {
    const payload = jwt.verify(token, process.env.SECRET);
    // attach the user to req
    req.user = { userId: payload.stormId };
    next();
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid');
  }
};

module.exports = authorize;
