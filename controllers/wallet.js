

const { NotFoundError, UnauthenticatedError } = require('../errors');

const {  storm_wallet } = require('../DB/models');

const getBalance = async (req, res) => {

    const {tid}= req.params

    console.log(tid)

  const balance =await storm_wallet.findOne({
        attributes:['wallet_balance'],
        where:{
            terminal_id: tid
        }
    })

    if (!balance){
        throw new NotFoundError(' user not found')
    }

    res.send(balance)

}

const createWallet = async (req, res) => {

    const { terminalId}=req.body

  const check_return=await storm_wallet.create({
    terminal_id: terminalId,
    wallet_balance: 0,
  });

  console.log(check_return)

  res.send('wallet created')
};

module.exports={ getBalance , createWallet};
