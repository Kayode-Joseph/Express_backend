require('dotenv').config();
const jwt = require('jsonwebtoken');
const { UnauthenticatedError } = require('../errors');

const aggregatorAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const token = req.headers.authorization;

  try {
    const payload = jwt.verify(token, process.env.AGGREGATORSECRET);
    // attach the user to req

    console.log(payload)
    req.user = { userId: payload.aggregatorId };
    next();
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid');
  }
};

module.exports = aggregatorAuth;
