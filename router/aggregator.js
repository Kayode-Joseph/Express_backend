const express = require('express');

const routers = express.Router();

const { register , login, getAggregatorTransactions} = require('../controllers/aggregator');

const aggregatorAuth=require('../middleware/aggregator_auth')
const aggregators = require('../DB/models/aggregators');

routers.route('/register').post(register);

routers.route('/login').post(login);

routers.route('/transactions').get(aggregatorAuth,getAggregatorTransactions);

module.exports = routers;
