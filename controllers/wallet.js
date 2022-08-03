const {
    NotFoundError,
    UnauthenticatedError,
    BadRequestError,
} = require('../errors');

const axios = require('axios').default;

const bcrypt = require('bcrypt');

const { Op } = require('sequelize');

const Sequelize = require('sequelize');

const {
    storm_wallet,
    transactions,
    transaction_fees,
    user,
    banks,
} = require('../DB/models');

require('dotenv').config();

//not a route

const balanceGetter = async (id, isAggregator) => {
    const balanceGetterInternal = async (ledgerBalanceFlag = true) => {
        const balance = await transactions.findAll({
            attributes: isAggregator
                ? [
                      [
                          Sequelize.fn('SUM', Sequelize.col('transaction_fee')),
                          'totalTransactionFee',
                      ],
                      [
                          Sequelize.fn('SUM', Sequelize.col('aggregator_fee')),
                          'totalAggregatorFee',
                      ],
                  ]
                : [
                      [
                          Sequelize.fn('SUM', Sequelize.col('amount')),
                          'totalAmount',
                      ],
                      [
                          Sequelize.fn('SUM', Sequelize.col('transaction_fee')),
                          'totalTransactionFee',
                      ],
                  ],

            // group: ['transaction_type'],

            where: isAggregator
                ? {
                      transaction_status: 'approved',

                      aggregator_id: id,
                  }
                : ledgerBalanceFlag
                ? {
                      transaction_status: 'approved',

                      storm_id: id,
                  }
                : {
                      transaction_status: 'approved',

                      settlement_status: 'completed',
                      storm_id: id,
                  },
            raw: true,
        });

        if (isAggregator) {
            const totalDebitAmount = await transactions.findAll({
                attributes: [
                    [
                        Sequelize.fn('SUM', Sequelize.col('amount')),
                        'totalDebitAmount',
                    ],
                    [
                        Sequelize.fn('SUM', Sequelize.col('transaction_fee')),
                        'totalDebitTransactionFeeAmount',
                    ],
                ],

                where: {
                    user_type: 'aggregator',

                    transaction_status: 'approved',
                },

                raw: true,
            });

            balance[0].totalDebitAmount = totalDebitAmount[0].totalDebitAmount;
            balance[0].totalDebitTransactionFeeAmount =
                totalDebitAmount[0].totalDebitTransactionFeeAmount;
        }

        return balance;
    };

    if (isAggregator) {
        const aggregatorBalance = await balanceGetterInternal();
        return (
            aggregatorBalance[0].totalDebitAmount +
            aggregatorBalance[0].totalAggregatorFee +
            aggregatorBalance[0].totalDebitTransactionFeeAmount
        );
    }

    const ledgerBalance = await balanceGetterInternal(
        (ledgerBalanceFlag = true)
    );

    const walletBalance = await balanceGetterInternal(
        (ledgerBalanceFlag = false)
    );

    return [
        walletBalance[0].totalAmount + walletBalance[0].totalTransactionFee,
        ledgerBalance[0].totalAmount + ledgerBalance[0].totalTransactionFee,
    ];
};

const eTranzactCaller = async (
    bankCode,
    senderName,
    recieverName,
    accountNumber,
    amount,
    description,
    referenceRandom,
    debitTransaction,
    next
) => {
    let eTranzactResponse = null;
    try {
        eTranzactResponse = await axios.post(
            process.env.FTURL,
            {
                action: 'FT',
                terminalId: process.env.TID,
                transaction: {
                    pin: process.env.AES,
                    bankCode: bankCode,
                    senderName: `${senderName.substring(
                        0,
                        8
                    )}||${recieverName.substring(0, 8)}|${accountNumber} `,
                    amount: amount,
                    description: description,
                    destination: accountNumber,
                    reference: referenceRandom,
                    endPoint: 'A',
                },
            },
            { timeout: 32000 }
        );
    } catch (error) {
        console.log(error);
        debitTransaction.response_code = 500;

        debitTransaction.response_message = error.message;

        await debitTransaction.save({
            fields: ['response_code', 'response_message'],
        });

        next(error);

        return null;
    }

    return eTranzactResponse;
};

const paymentValidator = async (
    amount,
    user,
    storm_wallet,
    stormId,
    transaction_fees,
    BadRequestError,
    NotFoundError,
    pin,
    isAggregator,
    walletQueryObject
) => {
    const stormWallet = await storm_wallet.findOne({
        where: walletQueryObject,
    });

    if (!stormWallet) {
        throw new NotFoundError('something went wrong');
    }

    const database_pin = stormWallet.dataValues.pin;

    const is_pin_the_same = await bcrypt.compare(pin, database_pin);

    if (is_pin_the_same != true) {
        throw new UnauthenticatedError('wrong pin!');
    }

    let user_from_database = null;

    if (isAggregator === false) {
        user_from_database = await user.findOne({
            attributes: ['type', 'terminal_id', 'is_transfer_enabled'],

            where: {
                storm_id: stormId,
            },
        });

        if (!user_from_database) {
            throw new NotFoundError('something went wrong');
        }
    }
    const userType = isAggregator
        ? 'aggregator'
        : user_from_database.dataValues.type;

    const transactionFee = await transaction_fees.findOne({
        attributes: ['transfer_out_fee'],

        where: {
            agent_type: userType,
        },
    });

    if (!transactionFee) {
        throw new BadRequestError('invalid user type');
    }
    const balance = isAggregator
        ? await balanceGetter(stormId, true)
        : await balanceGetter(stormId);

    const walletBalance = isAggregator ? balance : balance[0];

    const check_if_available_balance_is_sufficient_for_transaction = Math.sign(
        walletBalance - amount - transactionFee.dataValues.transfer_out_fee
    );

    if (
        check_if_available_balance_is_sufficient_for_transaction != 0 &&
        check_if_available_balance_is_sufficient_for_transaction != 1 &&
        check_if_available_balance_is_sufficient_for_transaction != -1
    ) {
        throw new BadRequestError('something went wrong');
    }

    return {
        stormWallet,
        transactionFee,
        check_if_available_balance_is_sufficient_for_transaction,
        user_from_database,
        userType,
    };
};

//does a sum function on db

const getBalance = async (req, res) => {
    const { userId } = req.user;

    const { stormId } = req.params;

    if (!userId) {
        throw new UnauthenticatedError('UNAUTHORIZED');
    }
    if (userId != stormId) {
        throw new UnauthenticatedError('UNAUTHORIZED');
    }

    const [walletBalance, ledgerBalance] = await balanceGetter(stormId);

    res.status(200).json({
        data: {
            wallet_balance: walletBalance,
            ledger_balance: ledgerBalance,
        },
    });
};

const createWallet = async (req, res) => {
    const { stormId } = req.body;

    const check_return = await storm_wallet.create({
        storm_id: stormId,
        wallet_balance: 0,
        ledger_balance: 0,
    });

    if (!check_return) {
        throw new BadRequestError('unable to create wallet');
    }

    // res.send('wallet created')
};

const toggleBusyFlag = async (wallet, flag) => {
    wallet.isBusy = flag;

    await wallet.save({ fields: ['isBusy'] });
};

const debitWallet = async (req, res, next) => {
    const { userId } = req.user;

    const { stormId: stormIdParams } = req.params;

    const {
        accountNumber,

        senderName,

        recieverName,

        bankCode,

        stormId,

        amount,
        pin,
    } = req.body;

    if (
        !stormId ||
        !accountNumber ||
        !recieverName ||
        !senderName ||
        !amount ||
        !bankCode ||
        !pin
    ) {
        throw new BadRequestError('missing field');
    }

    if (isNaN(amount)) {
        throw new BadRequestError('invalid datatype for amount');
    }

    if (userId != stormId || userId != stormIdParams) {
        throw new UnauthenticatedError('unauthorized');
    }

    const bank = await banks.findOne({
        attributes: ['bank_code'],

        where: {
            bank_code: bankCode,
        },
    });

    if (!bank) {
        throw new BadRequestError('invalid bank code');
    }

    const {
        stormWallet,
        transactionFee,
        check_if_available_balance_is_sufficient_for_transaction,
        user_from_database,
        userType,
    } = await paymentValidator(
        amount,
        user,
        storm_wallet,
        stormId,
        transaction_fees,
        BadRequestError,
        NotFoundError,
        pin,
        false,
        (walletQueryObject = {
            storm_id: stormId,
        })
    );

    if (user_from_database.dataValues.is_transfer_enabled != 'true') {
        res.status(200).json({ code: 501, message: 'transfer disabled' });
        return;
    }

    if (check_if_available_balance_is_sufficient_for_transaction == -1) {
        res.status(200).json({
            code: 502,
            message: 'insufficient balance please fund storm wallet',
        });

        return;
    }
    if (stormWallet.dataValues.isBusy == true) {
        res.status(200).json({
            code: 503,
            message: 'Wallet is busy',
        });

        return;
    }

    await toggleBusyFlag(stormWallet, true);

    const referenceRandom = `FTSTORM${Math.floor(
        Math.random() * 1000000000000000
    )}`;

    const description = `from ${senderName.substring(
        0,
        8
    )} to ${recieverName.substring(0, 8)} via NetPos`;

    const debitTransaction = await transactions.create({
        bank_code: bankCode,
        amount: -amount,
        reference: referenceRandom,
        description: description,
        destination: accountNumber,
        senderName: senderName,
        endPoint: 'A',
        terminal_id: user_from_database.dataValues.terminal_id,
        storm_id: stormId,
        transaction_status: 'declined',
        user_type: userType,
        transaction_fee: -transactionFee.dataValues.transfer_out_fee,
        transaction_type: 'debit',
    });

    //res.send(eTranzactResponse.data);

    let eTranzactResponse = null;
    try {
        eTranzactResponse = await eTranzactCaller(
            bankCode,
            senderName,
            recieverName,
            accountNumber,
            amount,
            description,
            referenceRandom,
            debitTransaction,
            next
        );
    } catch (e) {
        await toggleBusyFlag(stormWallet, false);

        next(e);
    }

    if (!eTranzactResponse) {
        throw new Error('something went wrong');
    }

    if (eTranzactResponse.data.error === '0') {
        debitTransaction.reference_from_etranzact =
            eTranzactResponse.data.reference;

        debitTransaction.response_code = eTranzactResponse.data.error;

        debitTransaction.response_message = eTranzactResponse.data.message;

        debitTransaction.transaction_status = 'approved';

        debitTransaction.settlement_status = 'completed';

        await debitTransaction.save({
            fields: [
                'reference_from_etranzact',
                'response_code',
                'response_message',
                'transaction_status',
                'settlement_status',
            ],
        });

        res.status(200).json({
            code: '0',

            message: 'Account Credited Successfully',

            data: {
                ledger_balance: stormWallet.dataValues.ledger_balance,

                wallet_balance: stormWallet.dataValues.wallet_balance,
            },
        });

        await toggleBusyFlag(stormWallet, false);

        return;
    }

    await toggleBusyFlag(stormWallet, false);

    debitTransaction.reference_from_etranzact =
        eTranzactResponse.data.reference;

    debitTransaction.response_code = eTranzactResponse.data.error;

    debitTransaction.response_message = eTranzactResponse.data.message;

    await debitTransaction.save({
        fields: [
            'reference_from_etranzact',
            'response_code',
            'response_message',
        ],
    });

    res.json({
        code: eTranzactResponse.data.error,
        message: eTranzactResponse.data.message,
    });
};

const verifyName = async (req, res, next) => {
    const { userId } = req.user;

    const { stormId, bankCode, accountNumber } = req.body;

    if (!stormId || !bankCode || !accountNumber) {
        throw new BadRequestError('missing field');
    }

    if (stormId != userId) {
        throw new UnauthenticatedError('UNAUTHORIZED');
    }

    const referenceRandom = Math.floor(Math.random() * 1000000000000000);

    const eTranzactResponse = await axios.post(
        'https://www.etranzact.net/rest/switchIT/api/v1/account-query',
        {
            action: 'AQ',
            terminalId: process.env.TID,
            transaction: {
                pin: process.env.AES,
                bankCode: bankCode,
                amount: '0.0',
                description: 'Account Query',
                destination: accountNumber,
                reference: `AQSTORM${referenceRandom}`,
                endPoint: 'A',
            },
        },
        { timeout: 15000 }
    );

    if (eTranzactResponse.data.error === '0') {
        res.status(200).json({
            code: eTranzactResponse.data.error,
            message: eTranzactResponse.data.message,
        });
        return;
    } else if (eTranzactResponse.data.error == 24) {
        res.status(200).json({
            code: 24,
            message: eTranzactResponse.data.message,
        });

        return;
    }

    res.status(200).json({
        code: eTranzactResponse.data.error,
        message: eTranzactResponse.data.message,
    });
};
module.exports = {
    getBalance,
    createWallet,
    debitWallet,
    verifyName,
    paymentValidator,
    balanceGetter,
    eTranzactCaller,
    toggleBusyFlag,
};
