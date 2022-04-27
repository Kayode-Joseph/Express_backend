const express = require('express');

const routers = express.Router();

const { getBalance, createWallet } = require('../controllers/wallet');




routers.route('/').post(createWallet);
routers.route('/:tid').get(getBalance)


module.exports= routers