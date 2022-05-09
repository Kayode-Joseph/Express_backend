const {
  NotFoundError,
  UnauthenticatedError,
  BadRequestError,
} = require('../errors');

const {
  storm_wallet,
  debit_wallet_transactions,
  transaction_fees,
} = require('../DB/models');

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

const debitWallet = async (req, res) => {

 
  const { userId } = req.user;

  const { stormId: stormIdParams} = req.params;

  const {
    bankCode,
    amount,
    reference,
    description,
    destination,
    senderName,
    endPoint,
    terminalId,
    stormId,
    status,
    userType,
  } = req.body;

  if (!stormId || !status || !amount || !terminalId || !userType) {
    throw new BadRequestError('missing field');
  }

  if (userId != stormId|| userId!= stormIdParams) {
    throw new UnauthenticatedError('unauthorized');
  }

  const transactionFee = await transaction_fees.findOne({
    attributes: ['transfer_out_fee'],

    where: {
      agent_type: userType,
    },
  });

  if (!transactionFee) {
    throw new BadRequestError('invalid user type');
  }

  const debitTransaction = await debit_wallet_transactions.create({
    bank_code: bankCode,
    amount: -amount,
    reference: reference,
    description: description,
    destination: destination,
    senderName: senderName,
    endPoint: endPoint,
    terminal_id: terminalId,
    storm_id: stormId,
    status: status,
    user_type: userType,
  });

  if (!debitTransaction) {
    throw new Error('something went wrong');
  }

  if (status == 'declined') {
    res.status(200).send('transaction logged');

    return;
  }

  const stormWallet = await storm_wallet.findOne({
    where: {
      storm_id: stormId,
    },
  });

  if (!stormWallet) {
    throw new Error('something went wrong');
  }

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

  res.status(200).json({
    ledger_balance: stormWallet.dataValues.ledger_balance,

    wallet_balance: stormWallet.dataValues.wallet_balance,
  });
};

module.exports = { getBalance, createWallet, debitWallet };
