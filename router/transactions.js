

const express= require('express')

const routers= express.Router()

const { getTransactions, updateTransactionAndWalletBalance}= require('../controllers/transactions')

//routers.route('/').get(getTransactions)





routers.route('/:stormId').post(updateTransactionAndWalletBalance).get(getTransactions)




module.exports=routers