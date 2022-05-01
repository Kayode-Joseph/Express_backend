const express = require('express');

const routers = express.Router();

const  {addTerminalId, getTransactions} = require('../controllers/admin');

routers.route('/add').post(addTerminalId);

routers.route('/').get(getTransactions)


module.exports = routers;
