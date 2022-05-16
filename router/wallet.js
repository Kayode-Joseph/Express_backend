const express = require('express');

const routers = express.Router();

const { getBalance, createWallet, debitWallet, verifyName } = require('../controllers/wallet');




//routers.route('/').post(createWallet);



routers.route('/getname').post(verifyName)


routers.route('/:stormId').get(getBalance).post(debitWallet);

module.exports= routers