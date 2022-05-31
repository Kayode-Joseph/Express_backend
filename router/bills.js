const express = require('express');

const routers = express.Router();

const { billQuery, billPayment } = require('../controllers/billsPayment');
const bill_payment = require('../DB/models/bill_payment');

routers.route('/query').post(billQuery)

routers.route('/pay').post(billPayment);


module.exports = routers;