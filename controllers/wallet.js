

const { NotFoundError, UnauthenticatedError, BadRequestError } = require('../errors');

const {  storm_wallet } = require('../DB/models');

const getBalance = async (req, res) => {
  const {userId}= req.user

    const {stormId}= req.params

    if(!userId){
      throw new UnauthenticatedError('UNAUTHORIZED')
    }
    if(userId!=stormId){
    throw new UnauthenticatedError('UNAUTHORIZED');
    }


  const balance =await storm_wallet.findOne({
        attributes:['wallet_balance'],
        where:{
          storm_id: stormId
        }
    })

    if (!balance){
        throw new NotFoundError(' user not found')
    }

    res.status(200).json({data: balance})

}

const createWallet = async (req, res) => {

  const {  stormId }=req.body

  const check_return = await storm_wallet.create({
    
    storm_id: stormId,
    wallet_balance: 0,
    ledger_balance: 0,
  });

  if(!check_return){
    throw new BadRequestError('unable to create wallet')
  }

 // res.send('wallet created')
};

module.exports={ getBalance , createWallet};
