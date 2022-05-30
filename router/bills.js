const express = require('express');

const routers = express.Router();

const { billQuery, VTUPayment } = require('../controllers/billsPayment');

routers.route('/query').post(billQuery)

routers.route('/vtu').post(VTUPayment);


module.exports = routers;