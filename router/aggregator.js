const express = require('express');

const routers = express.Router();

const { register , login, getAggregatorTransactions, debitAggregatorWallet, verifyNameAggregator, getWalletBalance} = require('../controllers/aggregator');

const aggregatorAuth=require('../middleware/aggregator_auth')
const aggregators = require('../DB/models/aggregators');

routers.route('/register').post(register);

routers.route('/login').post(login);

routers.route('/verify').post(aggregatorAuth,verifyNameAggregator);

routers.route('/transactions').get(aggregatorAuth,getAggregatorTransactions);

routers.route('/transactions/:aggregatorId').post(aggregatorAuth, debitAggregatorWallet);

routers
  .route('/wallet/:id')
  .get(aggregatorAuth, getWalletBalance);



module.exports = routers;
