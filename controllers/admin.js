const {
  NotFoundError,
  UnauthenticatedError,
  BadRequestError,
} = require('../errors');

const { Op } = require('sequelize');

const {
  user,
  transactions,
  storm_wallet,
  superadmin,
  admin,
} = require('../DB/models');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

require('dotenv').config();

//not a route controller just a regular function
const transactions_tracker = async () => {
  let transaction_count = 0;

  let transaction_value = 0;

  const date_in_millis = new Date().getTime();

  console.log(date_in_millis);

  const dateToGetUpper = new Date(date_in_millis);

  const dateToGetLower = new Date(date_in_millis - 86400 * 1000);

  const transaction_list = await transactions.findAll({
    attributes: ['amount'],

    where: {
      createdAt: {
        [Op.lt]: dateToGetUpper,
        [Op.gt]: dateToGetLower,
      },
      transaction_status: 'approved',
    },
    raw: true,
  });

  transaction_list.map((transaction) => {
    transaction_count += 1;

    transaction_value += transaction.amount;
  });

  return [transaction_count, transaction_value];
};

const transactionsTrackerRoute = async (req, res) => {

  const {userId}= req.user

  if(!userId){

    throw new UnauthenticatedError('not authorized')
  }
  

  
  
  const [transaction_count, transaction_value] = await transactions_tracker();

  res.status(200).json({transaction_count: transaction_count, transaction_value:transaction_value})


};

const addTerminalId = async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }


  const { stormId, terminalId } = req.body;

  const user_to_update = await user.findOne({
    where: {
      storm_id: stormId,
    },
  });

  if (!user_to_update) {
    throw new NotFoundError('cannot find user');
  }

  user_to_update.terminal_id = terminalId;

  user_to_update.is_terminal_id = 'true';

  await user_to_update.save({ fields: ['terminal_id', 'is_terminal_id'] });

  res.send('terminal id updated');
};




const getStormUsers = async (req,res) => {
  
   const { userId } = req.user;

   if (!userId) {
     throw new UnauthenticatedError('UNAUTHORIZED');
   }

  
  const page = req.query.page;

  if(!page){
    throw new BadRequestError('query param page is missing')
  }
  if(isNaN(page)){

        throw new BadRequestError('query param page must be a number');
  }

  const users = await user.findAll({
    attributes:['business_name', 'email', 'mobile_number', 'storm_id'],
    offset: 20 * page,
    limit: 20,
  });

  res.status(200).send(users)

};

const getTransactions = async (req, res) => {
  const { userId } = req.user;
  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const page = req.query.page;

  if (!page) {
    throw new BadRequestError('query param page is missing');
  }
  if (isNaN(page)) {
    throw new BadRequestError('query param page must be a number');
  }

 

  const transaction_list = await transactions.findAll({
    attributes:['rrn', 'amount','createdAt', 'settlement_status', 'transaction_status'],

    offset: 20 * page,
    limit: 20,
  });

  res.send(transaction_list);
};

const superAdminLogin = async (req, res) => {
  const user_credentials = req.body;

  if (!user_credentials.email || !user_credentials.password) {
    throw new BadRequestError('missing body fielda');
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

     attributes: ['email', 'admin_id', 'business_name', 'mobile_number', 'password'],
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

  res.status(201).json({
    admin: user_that_want_to_login,
    token: token,
    transaction_count: transaction_count,
    transaction_value: transaction_value,
  });
};

module.exports = {
  addTerminalId,
  getTransactions,
  superAdminLogin,
  registerAdmin,
  adminLogin,
  transactionsTrackerRoute,
  getStormUsers,
};
