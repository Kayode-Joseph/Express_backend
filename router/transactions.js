const authorize= require('../middleware/authentication')

const express= require('express')

const routers= express.Router()

const {getOneTransactions, getTransactions, updateTransactionAndWalletBalance, getTransactionByDate}= require('../controllers/transactions')

routers.route('/').get(getTransactions)


routers.route('/date').post(getTransactionByDate);

routers.route('/:rrn').post(updateTransactionAndWalletBalance).get(getOneTransactions)


module.exports=routers