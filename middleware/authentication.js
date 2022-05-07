require('dotenv').config();
const { UnauthenticatedError}= require('../errors')

const authorize=(req,res, next)=>{

 
if (req.headers['x-api-key'] != process.env.KEY) {

  throw new UnauthenticatedError('UNAUTHORIZED');
}

  

next()


}

module.exports=authorize