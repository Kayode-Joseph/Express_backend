const { NotFoundError, UnauthenticatedError } = require('../errors');

const { user, transactions, storm_wallet } = require('../DB/models');


const addTerminalId= async (req,res)=>{

const { userId } = req.user;

if (!userId) {
  throw new UnauthenticatedError('UNAUTHORIZED');
}

const adminUser= await user.findOne({
    
attributes:['role'],
    where:{
    storm_id:userId
}})

if(adminUser.dataValues.role!='admin'){

  throw new UnauthenticatedError('NOT AUTHORIZED')
}

const {stormId, terminalId}=req.body


const user_to_update= await user.findOne({where:{
  storm_id: stormId 
}}) 

console.log(user_to_update)
if(!user_to_update){

  throw new NotFoundError('cannot find user')
}

user_to_update.terminal_id=terminalId

user_to_update.is_terminal_id= 'true'

await user_to_update.save({ fields: ['terminal_id', 'is_terminal_id'] });


res.send('terminal id updated')




}


const getTransactions = async (req, res) => {

  const { userId } = req.user;

  if (!userId) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const adminUser = await user.findOne({
    attributes: ['role'],
    where: {
      storm_id: userId,
    },
  });

  if (adminUser.dataValues.role != 'admin') {
    throw new UnauthenticatedError('NOT AUTHORIZED');
  }




  const transaction_list = await transactions.findAll({ limit: 100 });

  res.send(transaction_list);


};




module.exports={addTerminalId, getTransactions}