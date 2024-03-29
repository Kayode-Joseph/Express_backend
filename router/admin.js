const express = require('express');

const adminAuth = require('../middleware/admin_auth');

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
    getDebitTransactions,
    getTerminalIds,
    changeAgentType,
    changePassword,
    assignAggregator,
    getAggregators,
    toggleBusyFlagAdmin,
} = require('../controllers/admin');

routers.route('/superadmin').post(superAdminLogin);

routers.route('/').post(registerAdmin);

routers.route('/add').put(adminAuth, addTerminalId);

routers.route('/transaction').get(adminAuth, getTransactions);

routers.route('/tid').post(adminAuth, createTerminalId);

routers.route('/tid').get(adminAuth, getTerminalIds);

routers.route('/login').post(adminLogin);

routers.route('/track').get(adminAuth, transactionsTrackerRoute);

routers.route('/users').get(adminAuth, getStormUsers);

routers.route('/users/type').put(adminAuth, changeAgentType);

routers.route('/users/password').put(adminAuth, changePassword);

routers.route('/users/busy').put(adminAuth, toggleBusyFlagAdmin);

routers.route('/debit').get(adminAuth, getDebitTransactions);

routers.route('/aggregator').put(adminAuth, assignAggregator);

routers.route('/aggregator').get(adminAuth, getAggregators);

module.exports = routers;
