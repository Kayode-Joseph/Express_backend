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
  getStormUsers
} = require('../controllers/admin');



routers.route('/').post(registerAdmin);

routers.route('/add').put(adminAuth, addTerminalId);

 routers.route('/transaction').get(adminAuth,getTransactions)

routers.route('/superadmin').post(superAdminLogin)


routers.route('/login').post(adminLogin);

routers.route('/track').get(adminAuth, transactionsTrackerRoute)

routers.route('/users').get(adminAuth, getStormUsers);



module.exports = routers;
