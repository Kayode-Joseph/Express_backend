const { Op } = require('sequelize');

const axios = require('axios').default;

const chalk = require('chalk');

const {
    NotFoundError,
    UnauthenticatedError,
    BadRequestError,
} = require('../errors');

const {
    user,
    transactions,
    storm_wallet,
    merchant_transaction_cache,
    transaction_fees,
    aggregator_wallet,
} = require('../DB/models');

//not a route, function to get debit wallet transactions
const debit_transaction_getter = async (
    stormId,
    page,
    terminalId,
    reference
) => {
    const transactionList = reference
        ? await transactions.findOne({
              attributes: [
                  'reference',
                  'amount',
                  'transaction_fee',
                  'description',
                  'destination',
                  'storm_id',
                  'terminal_id',
                  'reference_from_etranzact',
                  'transaction_status',
                  'terminal_id',
                  'reference_from_etranzact',
                  'response_code',
                  'response_message',
                  'updatedAt',
              ],

              where: {
                  reference: reference,
                  transaction_type: 'debit',
              },
          })
        : stormId
        ? await transactions.findAll({
              attributes: [
                  'reference',
                  'amount',
                  'transaction_fee',
                  'description',
                  'destination',
                  'storm_id',
                  'terminal_id',
                  'reference_from_etranzact',
                  'transaction_status',
                  'terminal_id',
                  'reference_from_etranzact',
                  'response_code',
                  'response_message',
                  'updatedAt',
              ],

              where: {
                  storm_id: stormId,
                  transaction_type: 'debit',
              },

              offset: page * 20,

              limit: 20,

              order: [['updatedAt', 'DESC']],
          })
        : terminalId
        ? await transactions.findAll({
              attributes: [
                  'reference',
                  'amount',
                  'transaction_fee',
                  'description',
                  'destination',
                  'storm_id',
                  'terminal_id',
                  'reference_from_etranzact',
                  'transaction_status',
                  'terminal_id',
                  'reference_from_etranzact',
                  'response_code',
                  'response_message',
                  'updatedAt',
              ],

              where: {
                  terminal_id: terminalId,
                  transaction_type: 'debit',
              },

              order: [['updatedAt', 'DESC']],

              offset: page * 20,

              limit: 20,
          })
        : await transactions.findAll({
              attributes: [
                  'reference',
                  'amount',
                  'transaction_fee',
                  'description',
                  'destination',
                  'storm_id',
                  'terminal_id',
                  'reference_from_etranzact',
                  'transaction_status',
                  'terminal_id',
                  'reference_from_etranzact',
                  'response_code',
                  'response_message',
                  'updatedAt',
              ],
              offset: page * 20,

              where: {
                  transaction_type: 'debit',
              },

              limit: 20,

              order: [['updatedAt', 'DESC']],
          });

    const transactionListArray = Array.isArray(transactionList)
        ? transactionList
        : [transactionList];

    return transactionListArray;
};

//function to push transaction to webhook
const netposWebHookFunc = async (req, RRN, transactionStatus, userType, amount) => {
    const netposWebHookResponse = await axios.post(
        userType=== 'merchant'?  process.env.MERCHANTWEBHOOK : process.env.WEBHOOKURL ,
        {
            transactionResponse: {
                ...req.body,
                rrn: RRN,
                amount: userType==='merchant'? amount*100 : amount,
                responseMessage: transactionStatus,
            },
        },
        {
            timeout: 15000,
            headers: {
                'content-type': 'application/json',
            },
        }
    );

    return netposWebHookResponse;
};

const updateTransactionAndWalletBalance = async (req, res) => {
    const { userId } = req.user;

    const storm_id_param = req.params.stormId;

    if (!userId) {
        throw new UnauthenticatedError('UNAUTHORIZED');
    }

    const {
        stormId,
        AID,
        RRN,
        STAN,
        TSI,
        TVR,
        accountType,
        acquiringInstCode,
        additionalAmount_54,
        amount,
        appCryptogram,
        authCode,
        cardExpiry,
        cardHolder,
        cardLabel,
        localDate_13,
        localTime_12,
        maskedPan,
        merchantId,
        originalForwardingInstCode,
        otherAmount,
        otherId,
        responseCode,
        responseDE55,
        terminalId,
        transactionTimeInMillis,
        transactionType,
        transmissionDateTime,
        userType,
        transactionStatus,
        routingChannel,
    } = req.body;

    if (stormId != userId || storm_id_param != userId) {
        throw new UnauthenticatedError('UNAUTHORIZED');
    }

    if (!userType) {
        throw new BadRequestError('user type not sepecified');
    }

    if (!transactionStatus) {
        throw new BadRequestError('transaction status not sepecified');
    }
    if (transactionStatus != 'approved' && transactionStatus != 'declined') {
        throw new BadRequestError('transaction status invalid');
    }
    if (Math.sign(amount) != 1) {
        throw new BadRequestError('invalid transaction amount');
    }

    const checkIfTransactionExists = await transactions.findOne({
        attributes: ['rrn'],
        where: {
            rrn: RRN,
        },
    });

    if (checkIfTransactionExists) {
        res.status(409).json({
            msg: 'transaction with rrn ' + RRN + ' already exists',
        });

        return;
    }

    const userFromDB = await user.findOne({
        attributes: ['type', 'aggregator_id'],
        where: {
            storm_id: userId,
        },
    });

    if (!userFromDB) {
        throw new NotFoundError('User not found');
    }

    if (userFromDB.dataValues.type != userType) {
        throw new BadRequestError('userType mismatch');
    }


        let netposWebHookResponse = null;

        for (let i = 0; i < 2; i++) {
            if (netposWebHookResponse) {
                if (netposWebHookResponse.data.status != 'success') {
                    console.log(
                        chalk.red(JSON.stringify(netposWebHookResponse.data))
                    );
                }

                break;
            }

            try {
                netposWebHookResponse = await netposWebHookFunc(
                    req,
                    RRN,
                    transactionStatus,
                    userType,
                    amount
                );

                console.log(netposWebHookResponse.data);
            } catch (e) {
                console.log(
                    JSON.stringify(e) +
                        '\n count: ' +
                        i +
                        '\ntime: ' +
                        new Date(Date.now())
                );
            }
        }
    

    //logging the transaction
    const created_transaction = await transactions.create({
        storm_id: stormId,
        aid: AID,
        rrn: RRN,
        stan: STAN,
        tsi: TSI,
        tvr: TVR,
        account_type: accountType,
        acquiring_inst_code: acquiringInstCode,
        additional_amount_54: additionalAmount_54,
        amount: amount,
        app_cryptogram: appCryptogram,
        auth_code: authCode,
        card_expiry: cardExpiry,
        card_holder: cardHolder,
        card_label: cardLabel,

        local_date_13: localDate_13,
        local_date_12: localTime_12,
        masked_pan: maskedPan,
        merchant_id: merchantId,
        original_forwarding_inst_code: originalForwardingInstCode,
        transaction_type: transactionType,
        other_amount: otherAmount,
        other_id: otherId,
        response_code: responseCode,
        response_de55: responseDE55,
        terminal_id: terminalId,
        transaction_time_in_mills: transactionTimeInMillis,
        transmission_date_time: transmissionDateTime,
        settlement_status: 'pending',
        user_type: userType,
        transaction_status: transactionStatus,
        routing_channel: routingChannel,
        transaction_type: 'credit',
        aggregator_id: userFromDB.dataValues.aggregator_id,
        aggregator_fee: null,
    });

    if (transactionStatus === 'declined') {
        res.status(200).json({ msg: 'transaction logged' });
        created_transaction.settlement_status = 'completed';
        await created_transaction.save({ fields: ['settlement_status'] });

        return;
    }

    const transactionFeeRate = await transaction_fees.findOne({
        where: {
            agent_type: userType,
        },
    });

    if (!transactionFeeRate) {
        throw new BadRequestError('wrong user type');
    }

    let transactionFee = null;

    if (userType.includes('agent')) {
        let amount_to_credit = null;

        if (amount >= transactionFeeRate.dataValues.max_debit_amount) {
            amount_to_credit = amount - transactionFeeRate.dataValues.cap;
        } else if (
            amount < transactionFeeRate.dataValues.max_debit_amount &&
            userType === 'agent_1'
        ) {
            amount_to_credit =
                amount * transactionFeeRate.dataValues.transaction_percentage;
        } else if (
            amount < transactionFeeRate.dataValues.max_debit_amount &&
            userType === 'agent_2'
        ) {
            amount_to_credit =
                amount * transactionFeeRate.dataValues.transaction_percentage;
        } else {
            throw new BadRequestError('invalid user type');
        }

        created_transaction.settlement_status = 'completed';

        transactionFee = amount - amount_to_credit;

        created_transaction.transaction_fee = -transactionFee;

        await created_transaction.save({
            fields: ['settlement_status', 'transaction_fee'],
        });

        res.json({ msg: 'transaction created and wallet updated' });
    } else if (userType === 'merchant') {
        let amount_to_credit =
            amount * transactionFeeRate.dataValues.transaction_percentage;

        //when 0.9935
        if (amount > transactionFeeRate.dataValues.max_debit_amount) {
            amount_to_credit = amount - transactionFeeRate.dataValues.cap;
        }

        transactionFee = amount - amount_to_credit;

        created_transaction.transaction_fee = -transactionFee;

        await created_transaction.save({
            fields: ['transaction_fee'],
        });

        const trans_cache = await merchant_transaction_cache.create({
            rrn: RRN,
            amount: amount,
            storm_id: stormId,
        });

        if (!trans_cache) {
            throw new Error('something went wrong');
        }

        res.json({ msg: 'transaction created' });
    }

    const aggregatorId = userFromDB.dataValues.aggregator_id;

    if (aggregatorId) {
        const aggregatorFeeRate = await transaction_fees.findOne({
            where: {
                agent_type: 'aggregator',
            },
        });

        const aggregatorPercentage =
            aggregatorFeeRate.dataValues.transaction_percentage;

        const aggregatorFee = aggregatorPercentage * transactionFee;

        // const aggregatorWallet = await aggregator_wallet.findOne({
        //     where: {
        //         aggregator_id: aggregatorId,
        //     },
        // });

        // if (!aggregatorWallet) {
        //     throw new NotFoundError('aggregator not found!');
        // }

        // aggregatorWallet.wallet_balance =
        //     aggregatorWallet.dataValues.wallet_balance + aggregatorFee;

        // aggregatorWallet.ledger_balance =
        //     aggregatorWallet.dataValues.ledger_balance + aggregatorFee;

        // await aggregatorWallet.save({
        //     fields: ['wallet_balance', 'ledger_balance'],
        // });

        created_transaction.aggregator_fee = aggregatorFee;

        await created_transaction.save({
            fields: ['aggregator_fee'],
        });

        return;
    }
};

const getTransactions = async (req, res) => {
    const stormId = req.params.stormId;

    const rrn = req.query.rrn;

    const page = req.query.page;

    const reference = req.query.reference;

    const dateLowerBound = req.query.dateLowerBound;

    const dateUpperBound = req.query.dateUpperBound;

    const { userId } = req.user;

    if (isNaN(page)) {
        throw new BadRequestError('page must be a number');
    }

    if (!rrn && !page) {
        throw new BadRequestError('missing key query param');
    }

    if (!reference && !page) {
        throw new BadRequestError('missing key query param');
    }

    if (dateLowerBound && !dateUpperBound) {
        throw new BadRequestError('date lower bound requires date upper bound');
    }

    if (!dateLowerBound && dateUpperBound) {
        throw new BadRequestError('date upper bound requires date lower bound');
    }

    if (!stormId) {
        throw UnauthenticatedError('unautheticated');
    }

    if (!userId) {
        throw new UnauthenticatedError('unauthenticated');
    }

    if (userId != stormId) {
        throw new UnauthenticatedError('unautheticated');
    }

    let dateValidityChecker = false;

    let dateLowerBound_in_milliseconds = null;

    let dateUpperBound_in_milliseconds = null;

    if (dateLowerBound && dateLowerBound) {
        dateLowerBound_in_milliseconds = new Date(
            dateLowerBound + ' 01:00'
        ).getTime();

        dateUpperBound_in_milliseconds =
            new Date(dateUpperBound + ' 01:00').getTime() + 86400 * 1000;

        function dateIsValid(date) {
            return new Date(date) instanceof Date && !isNaN(date);
        }

        if (
            !dateIsValid(dateLowerBound_in_milliseconds) ||
            !dateIsValid(dateUpperBound_in_milliseconds)
        ) {
            throw new BadRequestError('invalid date fromat');
        }

        dateValidityChecker = true;
    }

    const transaction = rrn
        ? await transactions.findOne({
              where: dateValidityChecker
                  ? {
                        rrn: rrn,
                        storm_id: stormId,
                        updatedAt: {
                            [Op.lt]: dateUpperBound_in_milliseconds,
                            [Op.gt]: dateLowerBound_in_milliseconds,
                        },
                    }
                  : {
                        rrn: rrn,
                        storm_id: stormId,
                    },
              attributes: [
                  'storm_id',
                  'amount',
                  'rrn',
                  'createdAt',
                  'updatedAt',
                  'reference',
                  'amount',
                  'transaction_fee',
                  'description',
                  'destination',
                  'storm_id',
                  'transaction_status',
                  'settlement_status',
                  'transaction_type',
              ],
          })
        : reference
        ? await transactions.findOne({
              where: dateValidityChecker
                  ? {
                        reference: reference,
                        storm_id: stormId,
                        transaction_type: 'debit',
                        updatedAt: {
                            [Op.lt]: dateUpperBound_in_milliseconds,
                            [Op.gt]: dateLowerBound_in_milliseconds,
                        },
                    }
                  : {
                        reference: reference,
                        storm_id: stormId,
                        transaction_type: 'debit',
                    },
              attributes: [
                  'storm_id',
                  'amount',
                  'rrn',
                  'createdAt',
                  'updatedAt',
                  'reference',
                  'amount',
                  'transaction_fee',
                  'description',
                  'destination',
                  'storm_id',
                  'transaction_status',
                  'settlement_status',
                  'transaction_type',
              ],
          })
        : await transactions.findAll({
              where: dateValidityChecker
                  ? {
                        storm_id: stormId,
                        updatedAt: {
                            [Op.lt]: dateUpperBound_in_milliseconds,
                            [Op.gt]: dateLowerBound_in_milliseconds,
                        },
                    }
                  : {
                        storm_id: stormId,
                    },

              attributes: [
                  'storm_id',
                  'amount',
                  'rrn',
                  'createdAt',
                  'updatedAt',
                  'transaction_status',
                  'settlement_status',
                  'reference',
                  'amount',
                  'transaction_fee',
                  'description',
                  'destination',
                  'storm_id',
                  'transaction_type',
              ],

              offset: page * 20,

              limit: 20,

              order: [['updatedAt', 'DESC']],
          });

    if (!transaction) {
        throw new NotFoundError('transaction with rrn not found');
    }

    res.status(200).json({ transaction });
};

const getTransactionByDate = async (req, res) => {
    const { userId } = req.user;

    if (!userId) {
        throw new UnauthenticatedError('UNAUTHORIZED');
    }

    const { dateLowerBound, dateUpperBound, storm_id } = req.body;

    if (userId != storm_id) {
        throw new UnauthenticatedError('NOT AUTHORIZED');
    }

    const dateLowerBound_in_milliseconds = new Date(
        dateLowerBound + ' 01:00'
    ).getTime();

    const dateUpperBound_in_milliseconds = new Date(
        dateUpperBound + ' 01:00'
    ).getTime();

    function dateIsValid(date) {
        return date instanceof Date && !isNaN(date);
    }

    if (
        !dateIsValid(dateLowerBound_in_milliseconds) ||
        !dateIsValid(dateLowerBound)
    ) {
        throw new BadRequestError('invalid date fromat');
    }

    const dateToGetLower = new Date(dateLowerBound_in_milliseconds);

    const dateToGetUpper = new Date(
        dateUpperBound_in_milliseconds + 86400 * 1000
    );

    const transaction = await transactions.findAll({
        attributes: [
            'storm_id',
            'amount',
            'rrn',
            'createdAt',
            'updatedAt',
            'transaction_status',
            'settlement_status',
            'reference',
            'amount',
            'transaction_fee',
            'description',
            'destination',
            'storm_id',
            'transaction_type',
        ],

        where: {
            updatedAt: {
                [Op.lt]: dateToGetUpper,
                [Op.gt]: dateToGetLower,
            },
            storm_id: userId,

            order: [['updatedAt', 'DESC']],
        },
    });
    res.send(transaction);
};

const getDebitTransactions = async (req, res) => {
    const { userId } = req.user;

    const stormId = req.query.stormId;

    if (userId != stormId) {
        throw new UnauthenticatedError('Unathenticated');
    }

    const page = req.query.page;

    const reference = req.query.reference;

    const terminalId = req.query.terminalId;

    if (isNaN(page)) {
        throw new BadRequestError('page must be a number');
    }

    if (!reference && !page) {
        throw new BadRequestError('missing key query param');
    }

    const transaction_list = await debit_transaction_getter(
        stormId,
        page,
        terminalId,
        reference
    );

    if (!transaction_list) {
        throw new Error('Something went wrong');
    }

    if (transaction_list[0] == null) {
        res.send([]);
    }

    res.send(transaction_list);
};

module.exports = {
    getTransactions,
    getDebitTransactions,

    updateTransactionAndWalletBalance,
    getTransactionByDate,
    debit_transaction_getter,
};
