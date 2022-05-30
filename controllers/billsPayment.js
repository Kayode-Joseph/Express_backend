require('dotenv').config();

const axios = require('axios').default;

const redis = require('redis');

const {
  NotFoundError,
  UnauthenticatedError,
  BadRequestError,
} = require('../errors');

const {
  user,
  transactions,
  storm_wallet,
  superadmin,
  admin,
  terminal_id,
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

const VTUPayment = async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('Unauthorized');
  }

  const { stormId, clientRef, billId, customerId, amount } = req.body;

  if (!clientRef || !billId || !customerId || !amount || !stormId) {
    throw new BadRequestError('missing field');
  }

   if (isNaN(amount)) {
     throw new BadRequestError('invalid datatype for amount');
   }

  if (userId != stormId) {
    throw new UnauthenticatedError('Unauthorized');
  }

  const transferEnabled = await user.findOne({
    attributes: ['is_transfer_enabled'],

    where: {
      storm_id: stormId,
    },
  });

  if (!transferEnabled) {
    throw new NotFoundError('user not found');
  }

  if (transferEnabled != 'true') {
    res.send('Contact administrator to enable transfer');

    return;
  }

  const referenceRandom = Math.floor(Math.random() * 1000000000000000);

  const eTranzactResponse = await axios.post(
    process.env.BILLQUERYURL,
    {
      clientRef: `BP${referenceRandom}`,
      billId: billId,
      customerId: customerId,
      amount: amount,
    },
    {
      timeout: 30000,
      headers: {
        terminalId: process.env.TID,
        PIN: process.env.AES,
      },
    }
  );

  if (!eTranzactResponse) {
    throw new Error('something went wrong');
  }
};

module.exports = { billQuery, VTUPayment };
