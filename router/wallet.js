const express = require('express');

const routers = express.Router();

const { getBalance, createWallet, debitWallet } = require('../controllers/wallet');




//routers.route('/').post(createWallet);
routers.route('/:stormId').get(getBalance).post(debitWallet)


module.exports= routers