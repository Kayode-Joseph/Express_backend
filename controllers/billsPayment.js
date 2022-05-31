require('dotenv').config();

const axios = require('axios').default;

const { paymentValidator } = require('./wallet');

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
  } = req.body;

  if (!billId || !customerId || !amount || !stormId) {
    throw new BadRequestError('missing field');
  }

  if (isNaN(amount)) {
    throw new BadRequestError('invalid datatype for amount');
  }

  if (userId != stormId) {
    throw new UnauthenticatedError('Unauthorized');
  }

  const {
    stormWallet,
    transactionFee,
    check_if_available_balance_is_sufficient_for_transaction,
    user_from_database,
    userType,
  } = await paymentValidator(
    amount,
    user,
    storm_wallet,
    stormId,
    transaction_fees,
    BadRequestError,
    NotFoundError
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
    return 
  }

  if (!etranzactPayload) {
    throw new Error('something went wrong');
  }

  const bill = await bill_payment.create({
    storm_id: stormId,

    client_ref: referenceRandom,

    status: false,
    message: null,
    amount: amount,
    product_id: productId ? productId : null,
    bill_id: billId,

    customer_id: customerId,
    bill_name: null,
    bill_query_ref: billQueryRef ? billQueryRef : null,
    transaction_fee: -transactionFee.dataValues.transfer_out_fee,
    user_type: userType,
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
    bill.message = error.message;

    await bill.save({
      fields: ['message'],
    });

    next(error);

    return;
  }

  if (!eTranzactResponse) {
    throw new Error('something went wrong');
  }
  if (eTranzactResponse.data.status == true) {
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

    bill.status = eTranzactResponse.data.status;

    bill.message = eTranzactResponse.data.message;

    await bill.save({
      fields: ['message', 'status'],
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

  bill.status = eTranzactResponse.data.status;

  bill.message = eTranzactResponse.data.message;

  await bill.save({
    fields: ['message', 'status'],
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

  const billClass2 = [
    8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 27,
  ];

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
  else if (
   billClass2.includes(billId)
  ) {
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
