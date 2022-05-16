const express = require('express');

const routers = express.Router();

const { getOneBank, getAllBanks } = require('../controllers/banks');

routers.route('/').get(getAllBanks);

routers.route('/:code').get(getOneBank);

module.exports = routers;
