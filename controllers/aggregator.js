const {
  NotFoundError,
  UnauthenticatedError,
  BadRequestError,
} = require('../errors');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

require('dotenv').config();

const { aggregators, aggregator_wallet } = require('../DB/models');

const {transactionGetter} = require('./admin')

const register = async (req, res) => {
  const { email, password, name, phoneNumber, walletPin } = req.body;

  if (!email || !password || !name || !walletPin) {
    throw new BadRequestError('misssing field');
  }

  if (password.length < 3 || walletPin.length < 3) {
    throw new BadRequestError('invalid password');
  }

  const salt = await bcrypt.genSalt(10);

  const wallet_pin = await bcrypt.hash(walletPin, salt);

  const hashed_password = await bcrypt.hash(password, salt);

  const aggregator = await aggregators.create({
    ...req.body,
    password: hashed_password,
  });

  if (!aggregator) {
    throw new Error('something went wrong');
  }

  const aggregator_id = aggregator.dataValues.id;

  const aggregatorWallet = await aggregator_wallet.create({
    aggregator_id: aggregator_id,
    wallet_balance: 0,
    ledger_balance: 0,
    pin: wallet_pin,
  });

  if (!aggregatorWallet) {
    throw new Error('unable to create wallet');
  }

  delete aggregator.dataValues.password;

  let token = null;
  try {
    token = jwt.sign(
      { aggregatorId: aggregator_id },
      process.env.AGGREGATORSECRET,
      {
        expiresIn: '1d',
      }
    );
  } catch (e) {
    console.log(e);
    throw new Error('something went wrong');
  }

  res.status(201).json({ user: aggregator, token: token });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('missing fields');
  }

  const user_that_want_to_login = await aggregators.findOne({
    attributes: [
      'id',
      'email',
      'password',
      'name',
      'phoneNumber',
      'createdAt',
      'updatedAt',
    ],

    where: {
      email: email,
    },
    include: aggregator_wallet,
  });

  if (!user_that_want_to_login) {
    throw new UnauthenticatedError('Incorrect login credentials');
  }

  const is_password_the_same = await bcrypt.compare(
    password,
    user_that_want_to_login.dataValues.password
  );


  if (is_password_the_same === true) {
    const aggregatorId= user_that_want_to_login.dataValues.id;

 
    try {
      const token = jwt.sign({ aggregatorId: aggregatorId }, process.env.AGGREGATORSECRET, {
        expiresIn: '1d',
      });

      delete user_that_want_to_login.dataValues.password;
      delete user_that_want_to_login.dataValues.aggregator_wallet.dataValues
        .pin;

      res.status(200).json({ token: token, user: user_that_want_to_login });
    } catch (e) {
      console.log(e);
      throw new BadRequestError('something went wrong');
    }
  } else {
    throw new UnauthenticatedError('Incorrect login credentials');
  }
};

const getAggregatorTransactions = async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }
   const page = req.query.page;

   const stormId = req.query.stormId;

   const rrn = req.query.rrn;

   const tid = req.query.tid;

   const reference = req.query.reference;

   const dateLowerBound = req.query.dateLowerBound;

   const dateUpperBound = req.query.dateUpperBound;


   const transactionList = await transactionGetter({
     page,
     stormId,
     rrn,
     tid,
     reference,
     dateLowerBound,
     dateUpperBound,
     aggregatorId: userId
   });


  Array.isArray(transactionList)
    ? res.json({
        page: page,
        length: transactionList.length,
        result: transactionList,
      })
    : res.json({
        page: page,
        length: 1,
        result: [transactionList],
      });







};
module.exports = { register, login, getAggregatorTransactions};
