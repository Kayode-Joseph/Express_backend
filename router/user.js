const express = require('express');

const routers = express.Router();

const getOneUser = require('../controllers/user');

routers.route('/:stormId').get(getOneUser);



module.exports = routers;
