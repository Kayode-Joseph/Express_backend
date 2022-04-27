require('dotenv').config();

const { Op } = require('sequelize');

const { NotFoundError, UnauthenticatedError } = require('../errors');

const { user, transactions, storm_wallet } = require('../DB/models');

const getTransactions = async (req, res) => {
  const users = await transactions.findAll();

  res.send(users);
  //throw new NotFoundError('your daddy')
  console.log('getAllTranscations');
};

const updateTransactionAndWalletBalance = async (req, res) => {
  const trans_id = req.params.trans_id;

  const {
    key,
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
    id,
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
  } = req.body;

  if (process.env.KEY != key) {
    throw new UnauthenticatedError('UNAUTHORIZED');
    return;
  }
  await transactions.create({
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
    id: id,
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
  });

  //updating storm wallet
const owner_of_storm_wallet = await storm_wallet.findOne({
  //attributes: ['wallet_balance'],
  where:{

    terminal_id: terminalId
  }
});

if(!owner_of_storm_wallet){

  throw new NotFoundError('user not found in storm database')
}

const new_wallet_balance= owner_of_storm_wallet.dataValues.wallet_balance

const new_wallet_balance_95_percent= new_wallet_balance+ new_wallet_balance*0.95

console.log(new_wallet_balance_95_percent)

 owner_of_storm_wallet.wallet_balance = new_wallet_balance_95_percent;

 await owner_of_storm_wallet.save({ fields: ['wallet_balance'] });





// const erro =await transactions.update({
// wallet_balance: new_wallet_balance_95_percent

// }, {where:{

//     terminal_id: terminalId
//   }})

  //transactions.save()

  
  // await storm_wallet.create({
  //   terminal_id: terminalId,
  //   wallet_balance: amount,
  // });

  console.log('transaction updated');

  res.send('transaction created');
};

const getOneTransactions = async (req, res) => {
  const trans_id = req.params.rrn;

  console.log(trans_id);

  const transaction = await transactions.findOne({
    where: {
      rrn: trans_id,
    },
  });

  if (!transaction) {
    throw new NotFoundError('transaction id not found');
  }
  res.send(transaction);
};

const getTransactionByDate = async (req, res) => {
  const { date } = req.body;

  console.log(date);
  //month first in req body

  const date_in_milliseconds = new Date(date + ' 00:00').getTime();

  console.log(date_in_milliseconds);

  const next_day_in_milliseconds = date_in_milliseconds + 86400 * 1000;

  const date_to_get = new Date(date_in_milliseconds);

  const next_day = new Date(next_day_in_milliseconds);

  console.log(next_day);

  const transaction = await transactions.findAll({
    where: {
      createdAt: {
        [Op.lt]: next_day,
        [Op.gt]: date_to_get,
      },
    },
  });
  res.send(transaction);

  console.log('get transaction by date');
};

module.exports = {
  getOneTransactions,
  getTransactions,
  updateTransactionAndWalletBalance,
  getTransactionByDate,
};
