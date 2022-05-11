const { user, storm_wallet } = require('../DB/models');

require('dotenv').config();


const { NotFoundError, UnauthenticatedError , BadRequestError} = require('../errors');

const bcrypt= require('bcrypt')

const jwt= require('jsonwebtoken')

const login = async (req, res) => {
  const {email, password}= req.body

  const user_that_want_to_login = await user.findOne({
    
    attributes:['storm_id', 'email','password', 'business_name', 'mobile_number', 'account_number', 'createdAt', 'updatedAt'],
    
    where: {
      email: email,
    },
    include: storm_wallet,
  });

  


  if (!user_that_want_to_login){
    throw new UnauthenticatedError('Incorrect login credentials')
  }

  const is_password_the_same = await bcrypt.compare(
    password,
    user_that_want_to_login.dataValues.password
  );
 
  if(is_password_the_same===true){
       const storm_id = user_that_want_to_login.dataValues.storm_id;
      try{
        
      const token = jwt.sign(
        { stormId: storm_id},
        process.env.SECRET,
        { expiresIn: '1d' }
      );

      delete user_that_want_to_login.dataValues.password

    res.status(200).json({token: token, user: user_that_want_to_login  })
      }
      catch(e){
          console.log(e)
          throw new BadRequestError('something went wrong')
      }
  }
  else{

    throw new UnauthenticatedError('Incorrect login credentials');
  }




  

};
 
const register= async (req,res)=>{

  console.log('yessir')

const {email, password, businessName, mobileNumber, accountNumber, bvn,  userType}= req.body

if(!password||!email||!businessName||!mobileNumber||!accountNumber||!bvn||!userType){
  throw new BadRequestError('missing field')
}

const salt= await bcrypt.genSalt(10)

const hashed_password= await bcrypt.hash(password,salt)

const new_user= await user.create({
email:email,

password: hashed_password,

business_name: businessName,

mobile_number: mobileNumber,

account_number: accountNumber,

bvn: bvn,
type: userType
})



if(!new_user){

throw new BadRequestError('something went wrong')
}

const stormId= new_user.dataValues.storm_id


 const check_return = await storm_wallet.create({
   storm_id: stormId,
   wallet_balance: 0,
   ledger_balance: 0,
 });


 if (!check_return) {
   throw new BadRequestError('unable to create wallet');
 }


 delete new_user.dataValues.password


let token= null
 try {
   token = jwt.sign({ stormId: stormId }, process.env.SECRET, {
     expiresIn: '1d',
   });

   
 } 
 catch (e) {
   console.log(e);
   throw new BadRequestError('something went wrong');
 }


res.status(201).json({user: new_user, token:token})

}

module.exports = { login, register };
