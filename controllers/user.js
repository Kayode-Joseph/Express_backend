const { NotFoundError, UnauthenticatedError } = require('../errors');

const { user, transactions, storm_wallet } = require('../DB/models');

const getOneUser = async (req, res) => {
  const  stormId  = req.params.stormId;
  if (!req.user) {
    throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const { userId } = req.user;

  console.log(stormId)

  if (stormId != userId) {
      throw new UnauthenticatedError('UNAUTHORIZED');
  }

  const user_from_db =await user.findOne({
      where:{
          storm_id:stormId
      },
      include: storm_wallet
  })

  if (!user_from_db){
      throw new NotFoundError('user not found')
  }

  res.send(user_from_db)

};

module.exports= getOneUser
