

const { Op } = require('sequelize');

const { NotFoundError, UnauthenticatedError, BadRequestError } = require('../errors');

const {
  user,
  transactions,
  storm_wallet,
  merchant_transaction_cache,
} = require('../DB/models');

 //admin operation get all database transactions


const updateTransactionAndWalletBalance = async (req, res) => {
  
  const {userId}= req.user

  if (!userId){
    throw new UnauthenticatedError('UNAUTHORIZED')
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
    id,
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
    userType
    
  } = req.body;

  if (stormId!=userId){

throw new UnauthenticatedError("UNAUTHORIZED")
  }

  if (!userType) {
    throw new BadRequestError('user tpe not sepecified');
  }




  

  //logging the transaction
  const created_transaction=await transactions.create({
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
    id: id,
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
    transaction_status: 'pending',
    user_type: userType
  });

  


  

  //updating storm wallet

const owner_of_storm_wallet = await storm_wallet.findOne({
  //attributes: ['wallet_balance'],
  where:{

    storm_id: stormId
  }
});

if(!owner_of_storm_wallet){

  throw new NotFoundError('user not found in storm database')
}

console.log(owner_of_storm_wallet)

if(userType=='agent'){

const new_wallet_balance= owner_of_storm_wallet.dataValues.wallet_balance

console.log('amount'+amount)

const new_wallet_balance_95_percent= new_wallet_balance+ amount*0.95

console.log(new_wallet_balance_95_percent)

 console.log("ledger "+owner_of_storm_wallet.wallet_balance);

 owner_of_storm_wallet.ledger_balance = new_wallet_balance_95_percent;

 owner_of_storm_wallet.wallet_balance = new_wallet_balance_95_percent;



 await owner_of_storm_wallet.save({
   fields: ['ledger_balance', 'wallet_balance'],
 });

 created_transaction.transaction_status= 'completed'

 await created_transaction.save({fields:['transaction_status']})

   res.send('transaction created and wallet updated');

}

else if (userType==='merchant'){

  const new_wallet_balance = owner_of_storm_wallet.dataValues.wallet_balance;

  console.log('amount' + amount);

  const new_wallet_balance_95_percent = new_wallet_balance + amount * 0.95;

  console.log(new_wallet_balance_95_percent);

  owner_of_storm_wallet.ledger_balance = new_wallet_balance_95_percent;

  await owner_of_storm_wallet.save({
    fields: ['ledger_balance'],
  });

  const trans_cache=await merchant_transaction_cache.create({
    rrn: RRN,
    amount: amount,
    storm_id:stormId
  })

  if(!trans_cache){
    throw new Error('something went wrong')
  }

  res.send('transaction created');

}



// const erro =await transactions.update({
// wallet_balance: new_wallet_balance_95_percent

// }, {where:{

//     terminal_id: terminalId
//   }})

  //transactions.save()

  
  // await storm_wallet.create({
  //   terminal_id: terminalId,
  //   wallet_balance: amount,
  // });

  console.log('transaction updated');


};

const getOneTransactions = async (req, res) => {
  const trans_id = req.params.rrn;

 const {userId}= req.user

  console.log(trans_id);

  const transaction = await transactions.findOne({
    where: {
      rrn: trans_id,
    },
  });

  if (!transaction) {
    throw new NotFoundError('transaction id not found');
  }

  if (transaction.dataValues.storm_id != userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }
  res.status(200).json({transaction});
};

 //admin operation get all database transactions for a date range

const getTransactionByDate = async (req, res) => {

 


  const { userId } = req.user;

     if (!userId) {
       throw new UnauthenticatedError('UNAUTHORIZED');
     }

 
  const { dateLowerBound, dateUpperBound, storm_id } = req.body;



  if (userId!= storm_id){

    throw new UnauthenticatedError("NOT AUTHORIZED")
  }





  console.log(dateUpperBound);
  //month first in req body

  const dateLowerBound_in_milliseconds = new Date(dateLowerBound + ' 00:00').getTime();



  const dateUpperBound_in_milliseconds = new Date(dateUpperBound + ' 00:00').getTime() ;

    console.log(dateUpperBound_in_milliseconds);

  console.log('date lupper millis'+ dateUpperBound_in_milliseconds)

  const dateToGetLower = new Date(dateLowerBound_in_milliseconds);

  const dateToGetUpper = new Date(dateUpperBound_in_milliseconds +86400 *1000);

  console.log('date'+dateToGetLower)

  console.log(dateToGetUpper);

  const transaction = await transactions.findAll({
    where: {
      createdAt: {
        [Op.lt]: dateToGetUpper,
        [Op.gt]: dateToGetLower,
      },
      storm_id: userId
    },
  });
  res.send(transaction);

  console.log('get transaction by date');
};

module.exports = {
  getOneTransactions,
 
  updateTransactionAndWalletBalance,
  getTransactionByDate,
};
