const express = require('express');

const adminAuth= require('../middleware/admin_auth')

const routers = express.Router();

const {
  addTerminalId,
  getTransactions,
  superAdminLogin,
  registerAdmin,
  adminLogin,
  transactionsTrackerRoute,
  getStormUsers,
  createTerminalId,
  getDebitTransactions
  
} = require('../controllers/admin');


routers.route('/superadmin').post(superAdminLogin);

routers.route('/').post(registerAdmin);

routers.route('/add').put(adminAuth, addTerminalId);

 routers.route('/transaction').get(adminAuth,getTransactions)

 routers.route('/tid').post(adminAuth, createTerminalId )



routers.route('/login').post(adminLogin);

routers.route('/track').get(adminAuth, transactionsTrackerRoute)

routers.route('/users').get(adminAuth, getStormUsers);

routers.route('/debit').get(adminAuth,getDebitTransactions)



module.exports = routers;
