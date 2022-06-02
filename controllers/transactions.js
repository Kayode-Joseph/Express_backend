const { Op } = require('sequelize');

const axios = require('axios').default;

const {
  NotFoundError,
  UnauthenticatedError,
  BadRequestError,
} = require('../errors');

const {
  user,
  transactions,
  storm_wallet,
  merchant_transaction_cache,
  transaction_fees,

} = require('../DB/models');

//not a route, function to get debit wallet transactions
const debit_transaction_getter = async (
  stormId,
  page,
  terminalId,
  reference
) => {
  const transactionList = reference
    ? await transactions.findOne({
        attributes: [
          'reference',
          'amount',
          'transaction_fee',
          'description',
          'destination',
          'storm_id',
          'terminal_id',
          'reference_from_etranzact',
          'transaction_status',
          'terminal_id',
          'reference_from_etranzact',
          'response_code',
          'response_message',
          'updatedAt',
        ],

        where: {
          reference: reference,
          transaction_type: 'debit',
        },
      })
    : stormId
    ? await transactions.findAll({
        attributes: [
          'reference',
          'amount',
          'transaction_fee',
          'description',
          'destination',
          'storm_id',
          'terminal_id',
          'reference_from_etranzact',
          'transaction_status',
          'terminal_id',
          'reference_from_etranzact',
          'response_code',
          'response_message',
          'updatedAt',
        ],

        where: {
          storm_id: stormId,
          transaction_type: 'debit',
        },

        offset: page * 20,

        limit: 20,

        order: [['updatedAt', 'DESC']],
      })
    : terminalId
    ? await transactions.findAll({
        attributes: [
          'reference',
          'amount',
          'transaction_fee',
          'description',
          'destination',
          'storm_id',
          'terminal_id',
          'reference_from_etranzact',
          'transaction_status',
          'terminal_id',
          'reference_from_etranzact',
          'response_code',
          'response_message',
          'updatedAt',
        ],

        where: {
          terminal_id: terminalId,
          transaction_type: 'debit',
        },

        order: [['updatedAt', 'DESC']],

        offset: page * 20,

        limit: 20,
      })
    : await transactions.findAll({
        attributes: [
          'reference',
          'amount',
          'transaction_fee',
          'description',
          'destination',
          'storm_id',
          'terminal_id',
          'reference_from_etranzact',
          'transaction_status',
          'terminal_id',
          'reference_from_etranzact',
          'response_code',
          'response_message',
          'updatedAt',
        ],
        offset: page * 20,

        where: {
             transaction_type: 'debit',
        },

        limit: 20,

        order: [['updatedAt', 'DESC']],
      });

  const transactionListArray = Array.isArray(transactionList)
    ? transactionList
    : [transactionList];

  return transactionListArray;
};

const updateTransactionAndWalletBalance = async (req, res) => {
  const { userId } = req.user;

  const storm_id_param = req.params.stormId;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const {
    stormId,
    AID,
    RRN,
    STAN,
    TSI,
    TVR,
    accountType,
    acquiringInstCode,
    additionalAmount_54,
    amount,
    appCryptogram,
    authCode,
    cardExpiry,
    cardHolder,
    cardLabel,
    localDate_13,
    localTime_12,
    maskedPan,
    merchantId,
    originalForwardingInstCode,
    otherAmount,
    otherId,
    responseCode,
    responseDE55,
    terminalId,
    transactionTimeInMillis,
    transactionType,
    transmissionDateTime,
    userType,
    transactionStatus,
    routingChannel,
  } = req.body;

  if (stormId != userId || storm_id_param != userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  if (!userType) {
    throw new BadRequestError('user type not sepecified');
  }

  if (!transactionStatus) {
    throw new BadRequestError('transaction status not sepecified');
  }

  try {
    const netposWebHook = await axios.post(
      process.env.WEBHOOKURL,
      {
        transactionResponse: {
          ...req.body,
          rrn: RRN,
          responseMessage: transactionStatus,
        },
      },
      {
        timeout: 30000,
        headers: {
          'content-type': 'application/json',
        },
      }
    );


  } catch (e) {
    console.log(JSON.stringify(e));
  }

  const user_type = await user.findOne({
    attributes: ['type'],
    where: {
      storm_id: userId,
    },
  });

  if (user_type.dataValues.type != userType) {
    throw new BadRequestError('userType mismatch');
  }

  //logging the transaction
  const created_transaction = await transactions.create({
    storm_id: stormId,
    aid: AID,
    rrn: RRN,
    stan: STAN,
    tsi: TSI,
    tvr: TVR,
    account_type: accountType,
    acquiring_inst_code: acquiringInstCode,
    additional_amount_54: additionalAmount_54,
    amount: amount,
    app_cryptogram: appCryptogram,
    auth_code: authCode,
    card_expiry: cardExpiry,
    card_holder: cardHolder,
    card_label: cardLabel,

    local_date_13: localDate_13,
    local_date_12: localTime_12,
    masked_pan: maskedPan,
    merchant_id: merchantId,
    original_forwarding_inst_code: originalForwardingInstCode,
    transaction_type: transactionType,
    other_amount: otherAmount,
    other_id: otherId,
    response_code: responseCode,
    response_de55: responseDE55,
    terminal_id: terminalId,
    transaction_time_in_mills: transactionTimeInMillis,
    transmission_date_time: transmissionDateTime,
    settlement_status: 'pending',
    user_type: userType,
    transaction_status: transactionStatus,
    routing_channel: routingChannel,
    transaction_type: "credit"
  });

  if (transactionStatus === 'declined') {
    res.status(200).json({ msg: 'transaction logged' });
    created_transaction.settlement_status = 'completed';
    await created_transaction.save({ fields: ['settlement_status'] });

    return;
  }

  const transactionFee = await transaction_fees.findOne({
    where: {
      agent_type: userType,
    },
  });

  if (!transactionFee) {
    throw new BadRequestError('wrong user type');
  }

  //updating storm wallet

  const owner_of_storm_wallet = await storm_wallet.findOne({
    //attributes: ['wallet_balance'],
    where: {
      storm_id: stormId,
    },
  });

  if (!owner_of_storm_wallet) {
    throw new NotFoundError('user not found in storm database');
  }

  if (userType.includes('agent')) {
    let amount_to_credit = null;

    if (amount >= transactionFee.dataValues.max_debit_amount) {
      amount_to_credit = amount - transactionFee.dataValues.cap;
    } else if (
      amount < transactionFee.dataValues.max_debit_amount &&
      userType === 'agent_1'
    ) {
      amount_to_credit =
        amount * transactionFee.dataValues.transaction_percentage;
    } else if (
      amount < transactionFee.dataValues.max_debit_amount &&
      userType === 'agent_2'
    ) {
      amount_to_credit =
        amount * transactionFee.dataValues.transaction_percentage;
    } else {
      throw new BadRequestError('invalid user type');
    }

    const new_wallet_balance = owner_of_storm_wallet.dataValues.wallet_balance;

    console.log('amount' + amount_to_credit);

    owner_of_storm_wallet.ledger_balance =
      new_wallet_balance + amount_to_credit;

    owner_of_storm_wallet.wallet_balance =
      new_wallet_balance + amount_to_credit;

    await owner_of_storm_wallet.save({
      fields: ['ledger_balance', 'wallet_balance'],
    });

    created_transaction.settlement_status = 'completed';

    await created_transaction.save({ fields: ['settlement_status'] });

    res.send('transaction created and wallet updated');
  } else if (userType === 'merchant') {
    const ledger_balance = owner_of_storm_wallet.dataValues.ledger_balance;

    let amount_to_credit =
      amount * transactionFee.dataValues.transaction_percentage;

    //when 0.9935
    if (amount > transactionFee.dataValues.max_debit_amount) {
      amount_to_credit = amount - transactionFee.dataValues.cap;
    }

    const new_wallet_balance = ledger_balance + amount_to_credit;

    console.log(new_wallet_balance);

    owner_of_storm_wallet.ledger_balance = new_wallet_balance;

    await owner_of_storm_wallet.save({
      fields: ['ledger_balance'],
    });

    const trans_cache = await merchant_transaction_cache.create({
      rrn: RRN,
      amount: amount,
      storm_id: stormId,
    });

    if (!trans_cache) {
      throw new Error('something went wrong');
    }

    res.send('transaction created');
  } else {
    throw new BadRequestError('invalid user type');
  }
};

const getTransactions = async (req, res) => {
  const stormId = req.params.stormId;

  const rrn = req.query.rrn;

  const page = req.query.page;

  const { userId } = req.user;

  if (isNaN(page)) {
    throw new BadRequestError('page must be a number');
  }

  if (!rrn && !page) {
    throw new BadRequestError('missing key query param');
  }

  if (!stormId) {
    throw UnauthenticatedError('unautheticated');
  }

  if (!userId) {
    throw new UnauthenticatedError('unauthenticated');
  }

  if (userId != stormId) {
    throw new UnauthenticatedError('unautheticated');
  }

  const transaction = rrn
    ? await transactions.findOne({
        where: {
          rrn: rrn,
          storm_id: stormId,
        },
        attributes: [
          'storm_id',
          'amount',
          'rrn',
          'createdAt',
          'updatedAt',
          'reference',
          'amount',
          'transaction_fee',
          'description',
          'destination',
          'storm_id',
          'transaction_status',
          'settlement_status',
          'trasnaction_type'
        ],
      })
    : await transactions.findAll({
        where: {
          storm_id: stormId,
        },

        attributes: [
          'storm_id',
          'amount',
          'rrn',
          'createdAt',
          'updatedAt',
          'transaction_status',
          'settlement_status',
          'reference',
          'amount',
          'transaction_fee',
          'description',
          'destination',
          'storm_id',
          'transaction_type'
        ],

        offset: page * 20,

        limit: 20,

        order: [['updatedAt', 'DESC']],
      });

  if (!transaction) {
    throw new NotFoundError('transaction with rrn not found');
  }

  res.status(200).json({ transaction });
};

const getTransactionByDate = async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const { dateLowerBound, dateUpperBound, storm_id } = req.body;

  if (userId != storm_id) {
    throw new UnauthenticatedError('NOT AUTHORIZED');
  }

  console.log(dateUpperBound);
  //month first in req body

  const dateLowerBound_in_milliseconds = new Date(
    dateLowerBound + ' 00:00'
  ).getTime();

  const dateUpperBound_in_milliseconds = new Date(
    dateUpperBound + ' 00:00'
  ).getTime();

  console.log(dateUpperBound_in_milliseconds);

  console.log('date lupper millis' + dateUpperBound_in_milliseconds);

  const dateToGetLower = new Date(dateLowerBound_in_milliseconds);

  const dateToGetUpper = new Date(
    dateUpperBound_in_milliseconds + 86400 * 1000
  );

  console.log('date' + dateToGetLower);

  console.log(dateToGetUpper);

  const transaction = await transactions.findAll({
    where: {
      updatedAt: {
        [Op.lt]: dateToGetUpper,
        [Op.gt]: dateToGetLower,
      },
      storm_id: userId,

      order: [['updatedAt', 'DESC']],
    },
  });
  res.send(transaction);

  console.log('get transaction by date');
};

const getDebitTransactions = async (req, res) => {
  const { userId } = req.user;

  const stormId = req.query.stormId;

  if (userId != stormId) {
    throw new UnauthenticatedError('Unathenticated');
  }

  const page = req.query.page;

  const reference = req.query.reference;

  const terminalId = req.query.terminalId;

  if (isNaN(page)) {
    throw new BadRequestError('page must be a number');
  }

  if (!reference && !page) {
    throw new BadRequestError('missing key query param');
  }

  const transaction_list = await debit_transaction_getter(
    stormId,
    page,
    terminalId,
    reference
  );

  if (!transaction_list) {
    throw new Error('Something went wrong');
  }

  if (transaction_list[0] == null) {
    res.send([]);
  }

  res.send(transaction_list);
};

module.exports = {
  getTransactions,
  getDebitTransactions,

  updateTransactionAndWalletBalance,
  getTransactionByDate,
  debit_transaction_getter,
};
