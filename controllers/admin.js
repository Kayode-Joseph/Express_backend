const {
  NotFoundError,
  UnauthenticatedError,
  BadRequestError,
} = require('../errors');

const { Op } = require('sequelize');

const Sequelize = require('sequelize');

const { debit_transaction_getter } = require('./transactions');

const {
  user,
  transactions,
  storm_wallet,
  superadmin,
  admin,
  terminal_id,
  aggregators,
  aggregator_wallet,
} = require('../DB/models');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

require('dotenv').config();

//not a route controller just a regular function
const transactions_tracker = async () => {
  const date_in_millis = new Date().getTime();

  // console.log(date_in_millis);

  const dateToGetUpper = new Date(date_in_millis);

  const dateToGetLower = new Date(date_in_millis - 86400 * 1000);

  const transaction_list = await transactions.findAll({
    attributes: [
      [Sequelize.fn('SUM', Sequelize.col('amount')), 'sum'],
      [Sequelize.fn('count', Sequelize.col('amount')), 'count'],
    ],

    group: ['transaction_type'],

    where: {
      createdAt: {
        [Op.lt]: dateToGetUpper,
        [Op.gt]: dateToGetLower,
      },
      transaction_status: 'approved',
      transaction_type: 'credit',
    },
    raw: true,
  });

  console.log(transaction_list);

  return transaction_list.length == 1
    ? [transaction_list[0].count, transaction_list[0].sum]
    : [null, null];
};

//not a contoller just a function

const transactionGetter = async (
  param = {
    rrn,

    reference,

    stormId,

    page,

    tid,

    dateLowerBound,

    dateUpperBound,

    aggregatorId,
  }
) => {
  const page = param.page;

  const rrn = param.rrn;

  const stormId = param.stormId;

  const reference = param.reference;

  const tid = param.tid;

  const dateLowerBound = param.dateLowerBound;

  const dateUpperBound = param.dateUpperBound;

  const aggregatorId = param.aggregatorId;

  if (dateLowerBound && !dateUpperBound) {
    throw new BadRequestError('date lower bound requires date upper bound');
  }

  if (!dateLowerBound && dateUpperBound) {
    throw new BadRequestError('date upper bound requires date lower bound');
  }

  let dateValidityChecker = false;

  let dateLowerBound_in_milliseconds = null;

  let dateUpperBound_in_milliseconds = null;

  if (dateLowerBound && dateLowerBound) {
    dateLowerBound_in_milliseconds = new Date(
      dateLowerBound + ' 01:00'
    ).getTime();

    dateUpperBound_in_milliseconds =
      new Date(dateUpperBound + ' 01:00').getTime() + 86400 * 1000;

    function dateIsValid(date) {
      return new Date(date) instanceof Date && !isNaN(date);
    }

    if (
      !dateIsValid(dateLowerBound_in_milliseconds) ||
      !dateIsValid(dateUpperBound_in_milliseconds)
    ) {
      throw new BadRequestError('invalid date fromat');
    }

    dateValidityChecker = true;
  }

  let queryObject = {
    attributes: [
      'storm_id',
      'terminal_id',
      'amount',
      'rrn',
      'reference',
      'user_type',
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
      'transaction_type',
      'aggregator_id',
      'aggregator_fee',
    ],

    offset: 20 * page,
    limit: 20,

    where: {
      rrn: rrn,
      reference: reference,
      terminal_id: tid,
      storm_id: stormId,
      aggregator_id: aggregatorId,
      updatedAt: {
        [Op.lt]: dateUpperBound_in_milliseconds,
        [Op.gt]: dateLowerBound_in_milliseconds,
      },
    },

    order: [['updatedAt', 'DESC']],
  };

  if (page) {
    if (isNaN(page)) {
      throw new BadRequestError('query param page must be a number');
    }
  }

  if (!aggregatorId) {
    delete queryObject.where.aggregator_id;
  }

  if (!rrn) {
    delete queryObject.where.rrn;
  }

  if (!reference) {
    delete queryObject.where.reference;
  }
  if (!tid) {
    delete queryObject.where.terminal_id;
  }
  if (!page) {
    delete queryObject.offset;

    delete queryObject.limit;
  }

  if (!dateValidityChecker) {
    delete queryObject.where.updatedAt;
  }

  if (!stormId) {
    delete queryObject.where.storm_id;
  }

  const transaction_list = rrn
    ? await transactions.findOne(queryObject)
    : reference
    ? await transactions.findOne(queryObject)
    : await transactions.findAll(queryObject);

  return transaction_list;
};

const transactionsTrackerRoute = async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('not authorized');
  }

  const [transaction_count, transaction_value] = await transactions_tracker();

  res.status(200).json({
    transaction_count: transaction_count,
    transaction_value: transaction_value,
  });
};

const addTerminalId = async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const { stormId, terminalId, isTransferEnabled } = req.body;

  if (!stormId) {
    throw new BadRequestError('missing stormId field');
  }

  if (!terminalId && !isTransferEnabled) {
    throw new BadRequestError('missing Fields');
  }

  if (isTransferEnabled) {
    if (isTransferEnabled != 'true' && isTransferEnabled != 'false') {
      throw new BadRequestError('invalid input for field isTransferEnabled');
    }
  }

  const check_if_terminal_id_is_assigned = await user.findOne({
    attributes: ['terminal_id'],

    where: {
      terminal_id: terminalId,
    },
  });

  if (check_if_terminal_id_is_assigned) {
    throw new BadRequestError('terminal id already assigned');
  }

  const terminal_id_from_db = await terminal_id.findOne({
    where: {
      terminal_id: terminalId,
    },
  });

  if (!terminal_id_from_db) {
    throw new Error('terminal id does not exist');
  }

  const user_to_update = await user.findOne({
    attributes: [
      'storm_id',
      'email',
      'password',
      'business_name',
      'mobile_number',
      'account_number',
      'type',
      'createdAt',
      'updatedAt',
    ],
    where: {
      storm_id: stormId,
    },
  });

  if (!user_to_update) {
    throw new NotFoundError('cannot find user');
  }

  if (terminalId) {
    user_to_update.terminal_id = terminalId;
    terminal_id_from_db.is_assigned = true;

    await terminal_id_from_db.save({ fields: ['is_assigned'] });

    await user_to_update.save({ fields: ['terminal_id'] });
  }
  if (isTransferEnabled) {
    user_to_update.is_transfer_enabled = isTransferEnabled;
    await user_to_update.save({ fields: ['is_transfer_enabled'] });
  }

  if (terminalId && isTransferEnabled === 'true') {
    res.send('terminal Id and transfer enabled');
    return;
  }

  if (terminalId && isTransferEnabled === 'false') {
    res.send('terminal id and transfer disabled');
    return;
  }

  terminalId
    ? res.send('terminal id updated')
    : isTransferEnabled === 'true'
    ? res.send('transfer enabled')
    : isTransferEnabled === 'false'
    ? res.send('transfer disabled')
    : res.status(400).send('bad request');
};

const getStormUsers = async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const page = req.query.page;

  const stormId = req.query.stormId;

  const email = req.query.email;

  const tid = req.query.tid;

  if (!page) {
    throw new BadRequestError('query param page is missing');
  }
  if (isNaN(page)) {
    throw new BadRequestError('query param page must be a number');
  }

  const users = stormId
    ? await user.findOne({
        attributes: [
          'business_name',
          'email',
          'mobile_number',
          'storm_id',
          'terminal_id',
          'is_transfer_enabled',
          'type',
          'aggregator_id',
          'createdAt',
          'updatedAt',
        ],

        where: {
          storm_id: stormId,
        },
      })
    : email
    ? await user.findOne({
        attributes: [
          'business_name',
          'email',
          'mobile_number',
          'storm_id',
          'terminal_id',
          'is_transfer_enabled',
          'aggregator_id',
          'type',
          'createdAt',
          'updatedAt',
        ],

        where: {
          email: email,
        },
      })
    : tid
    ? await user.findOne({
        attributes: [
          'business_name',
          'email',
          'mobile_number',
          'storm_id',
          'terminal_id',
          'is_transfer_enabled',
          'aggregator_id',
          'type',
          'createdAt',
          'updatedAt',
        ],

        where: {
          terminal_id: tid,
        },
      })
    : await user.findAll({
        attributes: [
          'business_name',
          'email',
          'mobile_number',
          'storm_id',
          'terminal_id',
          'is_transfer_enabled',
          'aggregator_id',
          'type',
          'createdAt',
          'updatedAt',
        ],
        offset: 20 * page,
        limit: 20,
        order: [['updatedAt', 'DESC']],
      });

  Array.isArray(users)
    ? res.status(200).json({ page: page, count: users.length, result: users })
    : res
        .status(200)
        .json({ page: page, count: users ? 1 : 0, result: [users] });
};

const getTransactions = async (req, res) => {
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

const superAdminLogin = async (req, res) => {
  const user_credentials = req.body;

  if (!user_credentials.email || !user_credentials.password) {
    throw new BadRequestError('missing body field');
  }

  const super_admin = await superadmin.findOne({
    attributes: ['password'],

    where: {
      email: user_credentials.email,
    },
  });

  if (!super_admin) {
    throw new UnauthenticatedError('wrong username or password');
  }

  const is_password_the_same = await bcrypt.compare(
    user_credentials.password,
    super_admin.dataValues.password
  );

  if (is_password_the_same === true) {
    try {
      const token = jwt.sign(
        { email: user_credentials.email },
        process.env.ADMINSECRET,
        { expiresIn: '10m' }
      );

      res.status(200).json({ token: token });
    } catch (e) {
      console.log(e);
      throw new BadRequestError('something went wrong');
    }
  } else {
    throw new UnauthenticatedError('Incorrect login credentials');
  }
};

const registerAdmin = async (req, res) => {
  if (!req.headers.authorization) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const super_admin_token = req.headers.authorization;

  let super_user_email = null;

  try {
    const payload = jwt.verify(super_admin_token, process.env.ADMINSECRET);

    super_user_email = payload.email;
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid');
  }

  if (!super_user_email) {
    throw new UnauthenticatedError('Authentication Invalid');
  }

  const {
    email,
    password,
    businessName,
    mobileNumber,
    accountNumber,
    bvn,
    role,
    bankName,
  } = req.body;

  if (
    !password ||
    !email ||
    !businessName ||
    !mobileNumber ||
    !accountNumber ||
    !bvn
  ) {
    throw new BadRequestError('missing field');
  }

  const salt = await bcrypt.genSalt(10);

  const hashed_password = await bcrypt.hash(password, salt);

  const new_admin = await admin.create({
    email: email,

    password: hashed_password,

    business_name: businessName,

    mobile_number: mobileNumber,

    account_number: accountNumber,

    bvn: bvn,

    super_user: super_user_email,
  });

  if (!new_admin) {
    throw new BadRequestError('something went wrong');
  }

  delete new_admin.dataValues.password;

  let token = null;
  try {
    token = jwt.sign(
      { adminId: new_admin.dataValues.admin_id },
      process.env.ADMINUSERSECRET,
      {
        expiresIn: '1d',
      }
    );
  } catch (e) {
    console.log(e);
    throw new BadRequestError('something went wrong');
  }

  const [transaction_count, transaction_value] = await transactions_tracker();

  res.status(201).json({
    admin: new_admin,
    token: token,
    transaction_count: transaction_count,
    transaction_value: transaction_value,
  });
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('request body fields incorrect');
  }

  const user_that_want_to_login = await admin.findOne({
    attributes: [
      'email',
      'admin_id',
      'business_name',
      'mobile_number',
      'password',
    ],
    where: {
      email: email,
    },
  });

  if (!user_that_want_to_login) {
    throw new UnauthenticatedError('Incorrect login credentials');
  }

  const is_password_the_same = await bcrypt.compare(
    password,
    user_that_want_to_login.dataValues.password
  );

  if (is_password_the_same == false) {
    throw new UnauthenticatedError('Incorrect login credentials');
  }

  let token = null;
  try {
    token = jwt.sign(
      { adminId: user_that_want_to_login.dataValues.admin_id },
      process.env.ADMINUSERSECRET,
      {
        expiresIn: '1d',
      }
    );
  } catch (e) {
    console.log(e);
    throw new BadRequestError('something went wrong');
  }

  if (token === null) {
    throw new BadRequestError('something went wrong');
  }

  const [transaction_count, transaction_value] = await transactions_tracker();

  delete user_that_want_to_login.dataValues.password;
  res.status(200).json({
    admin: user_that_want_to_login,
    token: token,
    transaction_count: transaction_count,
    transaction_value: transaction_value,
  });
};

const createTerminalId = async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const { terminalId, merchantId } = req.body;

  if (!terminalId || !merchantId) {
    throw new BadRequestError('missing fields');
  }

  const createdTerminalId = await terminal_id.create({
    terminal_id: terminalId,

    merchant_id: merchantId,
  });

  if (!createdTerminalId) {
    throw new Error('something went wrong');
  }

  res.status(200).send('terminal Id created');
};

const getDebitTransactions = async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const stormId = req.query.stormId;

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

const getTerminalIds = async (req, res) => {
  const { userId } = req.user;
  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const page = req.query.page;

  if (isNaN(page)) {
    throw new BadRequestError('page must be a number');
  }

  const terminalIds = await terminal_id.findAll({
    offset: 20 * page,
    limit: 20,
    order: [['updatedAt', 'DESC']],
  });

  res.json({
    page: page,
    length: terminalIds.length,
    result: terminalIds,
  });
};

const changeAgentType = async (req, res) => {
  const { userId } = req.user;
  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const { stormId, type } = req.body;

  if (!stormId || !type) {
    throw new BadRequestError('missing field');
  }

  if (type != 'agent_1' && type != 'agent_2' && type != 'merchant') {
    throw new BadRequestError('invalid input for type field');
  }

  const user_from_db = await user.findOne({
    where: {
      storm_id: stormId,
    },
  });

  if (!user_from_db) {
    throw new NotFoundError('user not found!');
  }

  user_from_db.type = type;

  await user_from_db.save({
    fields: ['type'],
    exclude: ['terminalIdTerminalId'],
  });

  res.send('user type updated');
};

const changePassword = async (req, res) => {
  const { userId } = req.user;
  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const { stormId, newPassword } = req.body;

  if (!stormId || !newPassword) {
    throw new BadRequestError('missing field');
  }

  if (newPassword.length < 3) {
    throw new BadRequestError('password too short');
  }

  const salt = await bcrypt.genSalt(10);

  const hashed_password = await bcrypt.hash(newPassword, salt);

  const user_from_db = await user.findOne({
    where: {
      storm_id: stormId,
    },
  });

  if (!user_from_db) {
    throw new NotFoundError('user not found!');
  }

  user_from_db.password = hashed_password;

  await user_from_db.save({
    fields: ['password'],
  });

  res.send('password updated');
};

const assignAggregator = async (req, res) => {
  const { userId } = req.user;
  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const { aggregatorId, stormId } = req.body;

  if (!aggregatorId || !stormId) {
    throw new BadRequestError('missing fields');
  }

  const user_from_db = await user.findOne({
    where: {
      storm_id: stormId,
    },
  });

  if (!user_from_db) {
    throw new UnauthenticatedError('no user found');
  }

  user_from_db.aggregator_id = aggregatorId;

  await user_from_db.save({ fields: ['aggregator_id'] });

  res.send('aggregator updated');
};

const getAggregators = async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const page = req.query.page;

  const id = req.query.id;

  const email = req.query.email;

 

  if (page) {
    if (isNaN(page)) {
      throw new BadRequestError('query param page must be a number');
    }
  }

  const queryObject = {
    attributes: [
      'id',
      'email',
      'name',
      'phoneNumber',
      'createdAt',
      'updatedAt',
    ],

    where: {
      id: id,

      email: email,
    },

    offset: page * 20,

    limit: 20,

    order: [['updatedAt', 'DESC']],
  };

  if (!email) {
    delete queryObject.where.email;
  }

  if (!id) {
    delete queryObject.where.id;
  }

  if (!page) {
    delete queryObject.limit;
    delete queryObject.offset;
  }

  const aggregatorList =
    email || id
      ? await aggregators.findOne(queryObject)
      : await aggregators.findAll(queryObject);

  Array.isArray(aggregatorList)
    ? res.json({
        page: page,
        length: aggregatorList.length,
        result: aggregatorList,
      })
    : res.json({
        page: page,
        length: 1,
        result: [aggregatorList],
      });

  console.log(page);
};

module.exports = {
  addTerminalId,
  getTransactions,
  superAdminLogin,
  registerAdmin,
  adminLogin,
  transactionsTrackerRoute,
  getStormUsers,
  createTerminalId,
  getDebitTransactions,
  getTerminalIds,
  changeAgentType,
  changePassword,
  assignAggregator,
  transactionGetter,
  getAggregators,
};
