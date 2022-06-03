const {
  NotFoundError,
  UnauthenticatedError,
  BadRequestError,
} = require('../errors');

const axios = require('axios').default;


const bcrypt = require('bcrypt');

const {
  storm_wallet,
  transactions,
  transaction_fees,
  user,
  banks,
} = require('../DB/models');

require('dotenv').config();

//not a route

const paymentValidator = async (
  amount,
  user,
  storm_wallet,
  stormId,
  transaction_fees,
  BadRequestError,
  NotFoundError,
  pin
) => {
  const stormWallet = await storm_wallet.findOne({
    where: {
      storm_id: stormId,
    },
  });

  if (!stormWallet) {
    throw new NotFoundError('something went wrong');
  }

  const database_pin = stormWallet.dataValues.pin;

  const is_pin_the_same = await bcrypt.compare(pin, database_pin);

  if (is_pin_the_same != true) {
    throw new UnauthenticatedError('wrong pin!');
  }

  const user_from_database = await user.findOne({
    attributes: ['type', 'terminal_id', 'is_transfer_enabled'],

    where: {
      storm_id: stormId,
    },
  });

  if (!user_from_database) {
    throw new NotFoundError('something went wrong');
  }

  const userType = user_from_database.dataValues.type;

  const transactionFee = await transaction_fees.findOne({
    attributes: ['transfer_out_fee'],

    where: {
      agent_type: userType,
    },
  });

  if (!transactionFee) {
    throw new BadRequestError('invalid user type');
  }

  const check_if_available_balance_is_sufficient_for_transaction = Math.sign(
    stormWallet.dataValues.wallet_balance -
      amount -
      transactionFee.dataValues.transfer_out_fee
  );

  if (
    check_if_available_balance_is_sufficient_for_transaction != 0 &&
    check_if_available_balance_is_sufficient_for_transaction != 1 &&
    check_if_available_balance_is_sufficient_for_transaction != -1
  ) {
    throw new BadRequestError('something went wrong');
  }

  return {
    stormWallet,
    transactionFee,
    check_if_available_balance_is_sufficient_for_transaction,
    user_from_database,
    userType,
  };
};

const getBalance = async (req, res) => {
  const { userId } = req.user;

  const { stormId } = req.params;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }
  if (userId != stormId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const balance = await storm_wallet.findOne({
    attributes: ['wallet_balance', 'ledger_balance'],
    where: {
      storm_id: stormId,
    },
  });

  if (!balance) {
    throw new NotFoundError(' user not found');
  }

  res.status(200).json({ data: balance });
};

const createWallet = async (req, res) => {
  const { stormId } = req.body;

  const check_return = await storm_wallet.create({
    storm_id: stormId,
    wallet_balance: 0,
    ledger_balance: 0,
  });

  if (!check_return) {
    throw new BadRequestError('unable to create wallet');
  }

  // res.send('wallet created')
};

const debitWallet = async (req, res, next) => {
  const { userId } = req.user;

  const { stormId: stormIdParams } = req.params;

  const {
    accountNumber,

    senderName,

    recieverName,

    bankCode,

    stormId,

    amount,
    pin
  } = req.body;

  if (
    !stormId ||
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

  if (userId != stormId || userId != stormIdParams) {
    throw new UnauthenticatedError('unauthorized');
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
    userType
  } = await paymentValidator(
    amount,
    user,
    storm_wallet,
    stormId,
    transaction_fees,
    BadRequestError,
    NotFoundError, 
    pin
  );

  if (user_from_database.dataValues.is_transfer_enabled != 'true') {
    res.status(200).json({ code: 501, message: 'transfer disabled' });
    return;
  }

  if (check_if_available_balance_is_sufficient_for_transaction == -1) {
    res.status(200).json({
      code: 502,
      message: 'insufficient balance please fund storm wallet',
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
    terminal_id: user_from_database.dataValues.terminal_id,
    storm_id: stormId,
    transaction_status: 'declined',
    user_type: userType,
    transaction_fee: -transactionFee.dataValues.transfer_out_fee,
    transaction_type: 'debit',
  });

  let eTranzactResponse = null;
  try {
    eTranzactResponse = await axios.post(
      process.env.FTURL,
      {
        action: 'FT',
        terminalId: process.env.TID,
        transaction: {
          pin: process.env.AES,
          bankCode: bankCode,
          senderName: `${senderName.substring(0, 8)}||${recieverName.substring(
            0,
            8
          )}|${accountNumber} `,
          amount: amount,
          description: description,
          destination: accountNumber,
          reference: referenceRandom,
          endPoint: 'A',
        },
      },
      { timeout: 32000 }
    );
  } catch (error) {

    console.log(error)
    debitTransaction.response_code = 500;

    debitTransaction.response_message = error.message;

    await debitTransaction.save({
      fields: ['response_code', 'response_message'],
    });

    next(error);

    return;
  }
  //res.send(eTranzactResponse.data);

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

    debitTransaction.status = 'approved';

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
    fields: [
      'reference_from_etranzact',
      'response_code',
      'response_message'
    ],
  });

  res.json({
    code: eTranzactResponse.data.error,
    message: eTranzactResponse.data.message,
  });
};

const verifyName = async (req, res, next) => {
  const { userId } = req.user;

  const { stormId, bankCode, accountNumber } = req.body;

  if (!stormId || !bankCode || !accountNumber) {
    throw new BadRequestError('missing field');
  }

  if (stormId != userId) {
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

  console.log(eTranzactResponse.data);
  res.status(200).json({
    code: eTranzactResponse.data.error,
    message: eTranzactResponse.data.message,
  });
};
module.exports = {
  getBalance,
  createWallet,
  debitWallet,
  verifyName,
  paymentValidator,
};
