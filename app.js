const express= require('express')
const logger =require('morgan')
require('dotenv').config();
require('express-async-errors');

const fs=require('fs')

const path = require('path')

const authorize = require('./middleware/authentication')

const walletRouter= require('./router/wallet')

const transRouter = require('./router/transactions');

const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

//security packages

const helmet=require('helmet')

const xss_clean= require('xss-clean')

const cors= require('cors')


const { sequelize, user }= require('./DB/models')

const app= express()

// logger.token('myLogger', (req, res)=>{
//   console.log(res)
// })


const logfile= fs.createWriteStream(path.join(__dirname, 'logfile'), {flags:'a'})
app.use(logger(':status :url :method :date[clf] :res[content-length]', {stream:logfile}));
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss_clean());

//testing
app.get("/", (req, res)=>{
  res.send('testing testing')
})

app.use(authorize)
app.use('/api/v1/transaction', transRouter);

app.use('/api/v1/wallet', walletRouter);




app.get('/', (req, res) => {
  res.send('jobs api');
});





app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);



app.listen(process.env.PORT||3000, async ()=>{
try{
await sequelize.authenticate()
console.log('sever started on port '+ process.env.PORT)
}
catch{

  console.log('unable to connect to database')
}

})










