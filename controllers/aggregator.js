const {
  NotFoundError,
  UnauthenticatedError,
  BadRequestError,
} = require('../errors');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const axios = require('axios').default;

require('dotenv').config();

const {
  aggregators,
  aggregator_wallet,
  transactions,
  transaction_fees,
  banks,
} = require('../DB/models');

const { transactionGetter } = require('./admin');

const { paymentValidator } = require('../controllers/wallet');
const { aggregatorWalletTransactions } = require('../DB/models');

const { eTranzactCaller } = require('../controllers/wallet');

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
    const aggregatorId = user_that_want_to_login.dataValues.id;

    try {
      const token = jwt.sign(
        { aggregatorId: aggregatorId },
        process.env.AGGREGATORSECRET,
        {
          expiresIn: '1d',
        }
      );

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
    aggregatorId: userId,
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

const debitAggregatorWallet = async (req, res, next) => {
  const { userId } = req.user;

  const { aggregatorId } = req.params;

  const {
    accountNumber,

    senderName,

    recieverName,

    bankCode,

    id,

    amount,
    pin,
  } = req.body;

  if (
    !id ||
    !accountNumber ||
    !recieverName ||
    !senderName ||
    !amount ||
    !bankCode ||
    !pin
  ) {
    throw new BadRequestError('missing field');
  }

  if (isNaN(amount)) {
    throw new BadRequestError('invalid datatype for amount');
  }

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  if (userId != aggregatorId || id != userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const bank = await banks.findOne({
    attributes: ['bank_code'],

    where: {
      bank_code: bankCode,
    },
  });

  if (!bank) {
    throw new BadRequestError('invalid bank code');
  }

  const {
    stormWallet,
    transactionFee,
    check_if_available_balance_is_sufficient_for_transaction,
    user_from_database,
    userType,
  } = await paymentValidator(
    amount,
    aggregators,
    aggregator_wallet,
    aggregatorId,
    transaction_fees,
    BadRequestError,
    NotFoundError,
    pin,
    true,
    {
      aggregator_id: aggregatorId,
    }
  );

  if (check_if_available_balance_is_sufficient_for_transaction == -1) {
    res.status(200).json({
      code: 502,
      message: 'insufficient balance please fund aggregator wallet',
    });

    return;
  }

  const referenceRandom = `FTSTORM${Math.floor(
    Math.random() * 1000000000000000
  )}`;

  const description = `from ${senderName.substring(
    0,
    8
  )} to ${recieverName.substring(0, 8)} via NetPos`;

  const debitTransaction = await transactions.create({
    bank_code: bankCode,
    amount: -amount,
    reference: referenceRandom,
    description: description,
    destination: accountNumber,
    senderName: senderName,
    endPoint: 'A',

    aggregator_id: aggregatorId,
    transaction_status: 'declined',
    user_type: userType,
    transaction_fee: -transactionFee.dataValues.transfer_out_fee,
    transaction_type: 'debit',
  });

  //res.send(eTranzactResponse.data);

  const eTranzactResponse = await eTranzactCaller(
    bankCode,
    senderName,
    recieverName,
    accountNumber,
    amount,
    description,
    referenceRandom,
    debitTransaction,
    next
  );

  if (!eTranzactResponse) {
    throw new Error('something went wrong');
  }

  if (eTranzactResponse.data.error === '0') {
    stormWallet.ledger_balance =
      stormWallet.dataValues.ledger_balance -
      amount -
      transactionFee.dataValues.transfer_out_fee;

    stormWallet.wallet_balance =
      stormWallet.dataValues.wallet_balance -
      amount -
      transactionFee.dataValues.transfer_out_fee;

    await stormWallet.save({
      fields: ['ledger_balance', 'wallet_balance'],
    });

    debitTransaction.reference_from_etranzact =
      eTranzactResponse.data.reference;

    debitTransaction.response_code = eTranzactResponse.data.error;

    debitTransaction.response_message = eTranzactResponse.data.message;

    debitTransaction.transaction_status = 'approved';

    await debitTransaction.save({
      fields: [
        'reference_from_etranzact',
        'response_code',
        'response_message',
        'transaction_status',
      ],
    });

    res.status(200).json({
      code: '0',

      message: 'Account Credited Successfully',

      data: {
        ledger_balance: stormWallet.dataValues.ledger_balance,

        wallet_balance: stormWallet.dataValues.wallet_balance,
      },
    });

    return;
  }

  debitTransaction.reference_from_etranzact = eTranzactResponse.data.reference;

  debitTransaction.response_code = eTranzactResponse.data.error;

  debitTransaction.response_message = eTranzactResponse.data.message;

  await debitTransaction.save({
    fields: ['reference_from_etranzact', 'response_code', 'response_message'],
  });

  res.json({
    code: eTranzactResponse.data.error,
    message: eTranzactResponse.data.message,
  });
};

const verifyNameAggregator = async (req, res) => {
  const { userId } = req.user;

  const { id, bankCode, accountNumber } = req.body;

  if (!id || !bankCode || !accountNumber) {
    throw new BadRequestError('missing field');
  }

  if (id != userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const referenceRandom = Math.floor(Math.random() * 1000000000000000);

  const eTranzactResponse = await axios.post(
    'https://www.etranzact.net/rest/switchIT/api/v1/account-query',
    {
      action: 'AQ',
      terminalId: process.env.TID,
      transaction: {
        pin: process.env.AES,
        bankCode: bankCode,
        amount: '0.0',
        description: 'Account Query',
        destination: accountNumber,
        reference: `AQSTORM${referenceRandom}`,
        endPoint: 'A',
      },
    },
    { timeout: 15000 }
  );

  if (eTranzactResponse.data.error === '0') {
    res.status(200).json({
      code: eTranzactResponse.data.error,
      message: eTranzactResponse.data.message,
    });
    return;
  } else if (eTranzactResponse.data.error == 24) {
    res.status(200).json({ code: 24, message: eTranzactResponse.data.message });

    return;
  }

  res.status(200).json({
    code: eTranzactResponse.data.error,
    message: eTranzactResponse.data.message,
  });
};

const getWalletBalance = async (req, res) => {
  const { userId } = req.user;

  const { id } = req.params;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }
 


  if (userId != id) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

 

  const aggregatorWallet = await aggregator_wallet.findOne({
    attributes: ['wallet_balance', 'ledger_balance'],
    where: {
      aggregator_id: userId,
    },
  });

  res.json({
    wallet_balance: aggregatorWallet.dataValues.wallet_balance,
    ledger_balance: aggregatorWallet.dataValues.ledger_balance,
  });
};

module.exports = {
  register,
  login,
  getAggregatorTransactions,
  debitAggregatorWallet,
  verifyNameAggregator,
  getWalletBalance
};
