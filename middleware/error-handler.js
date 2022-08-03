const { CustomAPIError } = require('../errors');
const { StatusCodes } = require('http-status-codes');
const chalk = require('chalk');
const errorHandlerMiddleware = (err, req, res, next) => {
    if (err instanceof CustomAPIError) {
        // console.log(err);
        res.status(err.statusCode).json({ msg: err.message });

        return;
    }
    console.log(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    return;
};

module.exports = errorHandlerMiddleware;
