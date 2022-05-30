

const express= require('express')

const routers= express.Router()

const { getTransactions, updateTransactionAndWalletBalance, getTransactionByDate, getDebitTransactions}= require('../controllers/transactions')

//routers.route('/').get(getTransactions)


routers.route('/date').post(getTransactionByDate);

routers.route('/debit').get(getDebitTransactions);

routers.route('/:stormId').post(updateTransactionAndWalletBalance).get(getTransactions)




module.exports=routers