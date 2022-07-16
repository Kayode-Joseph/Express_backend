require('dotenv').config();

const axios = require('axios').default;



const bcrypt = require('bcrypt');

const {
  NotFoundError,
  UnauthenticatedError,
  BadRequestError,
} = require('../errors');

const {
  user,

  storm_wallet,

  transaction_fees,
  bill_payment,

  bills_rate,

  transactions,
} = require('../DB/models');

const billQuery = async (req, res, next) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('Unauthorized');
  }

  const { stormId, billId, customerId } = req.body;

  if (!stormId || !billId || !customerId) {
    throw new BadRequestError('missing field');
  }

  if (userId != stormId) {
    throw new UnauthenticatedError('Unauthorized');
  }

  const referenceRandom = Math.floor(Math.random() * 1000000000000000);

  const eTranzactResponse = await axios.post(
    process.env.BILLQUERYURL,
    {
      clientRef: `BQ${referenceRandom}`,
      billId: billId,
      customerId: customerId,
    },
    {
      timeout: 30000,
      headers: {
        terminalId: process.env.TID,
        PIN: process.env.AES,
      },
    }
  );

  res.send(eTranzactResponse.data);
  return;
};

const billPayment = async (req, res, next) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('Unauthorized');
  }

  const {
    stormId,

    billId,
    customerId,
    amount,
    billQueryRef,
    productId,
    productName,
    mobile,
    pin,
  } = req.body;

  if (!billId || !customerId || !amount || !stormId||!pin) {
    throw new BadRequestError('missing field');
  }

  if (isNaN(amount)) {
    throw new BadRequestError('invalid datatype for amount');
  }

  if (userId != stormId) {
    throw new UnauthenticatedError('Unauthorized');
  }

  const billRate = await bills_rate.findOne({
    where: {
      bill_id: billId,
    },
  });

  if (!billRate) {
    throw new BadRequestError('incorrect bill id');
  }

  console.log(billRate)

  const rate = billRate.dataValues.rate;

  const cap = billRate.dataValues.cap;

  let commission = rate ? amount - rate * amount : cap;

  if (cap) {
    if (commission > cap) {
      commission = cap;
    }
  }

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

  const userType= user_from_database.dataValues.type

   if (user_from_database.dataValues.is_transfer_enabled != 'true') {
     res.status(200).json({ code: 501, message: 'transfer disabled' });
     return;
   }

  const check_if_available_balance_is_sufficient_for_transaction = Math.sign(
    stormWallet.dataValues.wallet_balance - amount + commission
  );

  if (
    check_if_available_balance_is_sufficient_for_transaction != 0 &&
    check_if_available_balance_is_sufficient_for_transaction != 1 &&
    check_if_available_balance_is_sufficient_for_transaction != -1
  ) {
    throw new BadRequestError('something went wrong');
  }

  if (check_if_available_balance_is_sufficient_for_transaction === -1) {
    res.status(200).json({
      code: 502,
      message: 'insufficient balance please fund storm wallet',
    });

    return;
  }

  const referenceRandom = `BP${Math.floor(Math.random() * 1000000000000000)}`;

  let etranzactPayload = null;

  try {
    etranzactPayload = etranzactPayloadGenerator(
      referenceRandom,
      billId,
      customerId,
      amount,
      billQueryRef,
      productId,
      productName,
      mobile
    );
  } catch (e) {
    next(e);
    return;
  }

  if (!etranzactPayload) {
    throw new Error('something went wrong');
  }

  const bill = await transactions.create({
    storm_id: stormId,

    reference: referenceRandom,

    transaction_status: 'declined',
    response_message: null,
    amount: amount,
    product_id: productId ? productId : null,
    bill_id: billId,

    destination: customerId,
    bill_name: null,
    reference_from_etranzact: billQueryRef ? billQueryRef : null,
    transaction_fee: commission,
    user_type: userType,
    transaction_type: 'bill',
  });

  let eTranzactResponse = null;

  try {
    eTranzactResponse = await axios.post(
      process.env.BILLPAYMENTURL,

      etranzactPayload,
      {
        timeout: 30000,
        headers: {
          terminalId: process.env.TID,
          PIN: process.env.AES,
        },
      }
    );
  } catch (e) {
    bill.response_message = e.message;

    await bill.save({
      fields: ['message'],
    });

    next(error);

    return;
  }

  if (!eTranzactResponse) {
    throw new Error('something went wrong');
  }

  console.log(eTranzactResponse.data)
  if (eTranzactResponse.data.status ===true) {
    stormWallet.ledger_balance =
      stormWallet.dataValues.ledger_balance -
      amount + commission;

    stormWallet.wallet_balance =
      stormWallet.dataValues.wallet_balance -
      amount +commission;

    await stormWallet.save({
      fields: ['ledger_balance', 'wallet_balance'],
    });

    bill.transaction_status = 'approved';

    bill.response_message = eTranzactResponse.data.message;

    await bill.save({
      fields: ['transaction_status', 'response_message'],
    });

    res.status(200).json({
      code: '0',

      message: 'bill paid succesfully',

      data: {
        ledger_balance: stormWallet.dataValues.ledger_balance,

        wallet_balance: stormWallet.dataValues.wallet_balance,
      },
    });

    return;
  }

  bill.transaction_status = eTranzactResponse.data.status;

  bill.response_message = eTranzactResponse.data.message;

  bill.bill_name = eTranzactResponse.data.billName;

  await bill.save({
    fields: ['transaction_status', 'response_message'],
  });

  res.json({
    code: -1,
    message: eTranzactResponse.data.message,
  });
};

module.exports = { billQuery, billPayment };

const etranzactPayloadGenerator = (
  referenceRandom,
  billId,
  customerId,
  amount,
  billQueryRef,
  productId,
  productName,
  mobile
) => {
  const billClass1 = [30, 31, 32, 33];

  const billClass2 = [8, 9, 10, 11, 14, 15, 16, 17, 18, 22, 23, 24, 25, 26, 27];

  const billClass3 = [5, 4];

  const billClass4 = [2, 6, 28, 29];

  const billClass5 = [3];

  const billClass6 = [34, 35, 35, 37];

  //VTU payload
  if (billClass1.includes(billId)) {
    return {
      clientRef: referenceRandom,
      billId: billId,
      customerId: customerId,
      amount: amount,
    };
  }
  //electricity, toll services and startimes paylaod
  else if (billClass2.includes(billId)) {
    if (!billQueryRef) {
      throw new BadRequestError('missing  bill query reference field');
    }
    if (!mobile) {
      throw new BadRequestError('missing mobile number field');
    }

    return {
      clientRef: referenceRandom,
      billId: billId,
      customerId: customerId,
      amount: amount,
      billQueryRef: billQueryRef,
      mobile: mobile,
    };
  } else if (billClass3.includes(billId)) {
    if (!billQueryRef) {
      throw new BadRequestError('missing  bill query reference field');
    }

    if (!productId) {
      throw new BadRequestError('missing  product id field');
    }

    if (!productName) {
      throw new BadRequestError('missing  product name field');
    }

    if (!mobile) {
      throw new BadRequestError('missing mobile number field');
    }

    return {
      clientRef: referenceRandom,
      billId: billId,
      customerId: customerId,
      amount: amount,
      billQueryRef: billQueryRef,
      productId: productId,
      mobile: mobile,
      productName: productName,
    };
  } else if (billClass4.includes(billId)) {
    if (!billQueryRef) {
      throw new BadRequestError('missing  bill query reference field');
    }

    return {
      clientRef: referenceRandom,
      billId: billId,
      customerId: customerId,
      amount: amount,
      billQueryRef: billQueryRef,
    };
  } else if (billClass5.includes(billId)) {
    if (!billQueryRef) {
      throw new BadRequestError('missing  bill query reference field');
    }

    if (!mobile) {
      throw new BadRequestError('missing mobile number field');
    }

    if (!productId) {
      throw new BadRequestError('missing  product id field');
    }

    return {
      clientRef: referenceRandom,
      billId: billId,
      customerId: customerId,
      amount: amount,
      billQueryRef: billQueryRef,
      mobile: mobile,
      productId: productId,
    };
  } else if (billClass6.includes(billId)) {
    if (!billQueryRef) {
      throw new BadRequestError('missing  bill query reference field');
    }

    if (!productId) {
      throw new BadRequestError('missing  product id field');
    }

    return {
      clientRef: referenceRandom,
      billId: billId,
      customerId: customerId,
      amount: amount,
      billQueryRef: billQueryRef,
      productId: billId != 35 ? productId : `DATA-${productId}`,
    };
  } else {
    throw new NotFoundError('product id not found');
  }
};
