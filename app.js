const cron = require('node-cron');

const { Op } = require('sequelize');

const express = require('express');

const cluster= require('cluster')

const os= require('os')

const numCpu= os.cpus().length


const {
  merchant_transaction_cache,
  transactions,
  storm_wallet,
} = require('./DB/models');

const logger = require('morgan');
require('dotenv').config();
require('express-async-errors');

const fs = require('fs');

const path = require('path');

const authorize = require('./middleware/authentication');

const walletRouter = require('./router/wallet');

const transRouter = require('./router/transactions');

const authRouter = require('./router/auth');

const userRouter = require('./router/user');

const adminRouter = require('./router/admin');

const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

const jwt_authorize = require('./middleware/authorization');

//security packages

const helmet = require('helmet');

const xss_clean = require('xss-clean');

const cors = require('cors');

const { sequelize, user } = require('./DB/models');
const { header } = require('express/lib/response');

const app = express();

logger.token('PID', (req, res)=>{
return 'thread:'+process.pid
 })

const logfile = fs.createWriteStream(path.join(__dirname, 'logfile'), {
  flags: 'a',
});
app.use(
  logger(':status :url :method :date[clf] :res[content-length] :PID', {
    stream: logfile,
  })
);
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss_clean());


//testing
app.get('/', (req, res) => {
  res.send('testing testing');
});




app.use('/api/v1/admin', adminRouter);

app.use(authorize);

app.use('/api/v1/auth', authRouter);

app.use(jwt_authorize);



app.use('/api/v1/transaction', transRouter);

app.use('/api/v1/wallet', walletRouter);

app.use('/api/v1/users', userRouter);

app.get('/', (req, res) => {
  res.send('jobs api');
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

if(cluster.isMaster){

  for(let i=0; i<numCpu; i++){

    cluster.fork()
  }

  //  cluster.fork()


  cluster.on('exit', (worker, code, signal)=>{

  console.log('worker thread instance '+process.pid+ 'has crashed')
  cluster.fork()



  })

}
else{
app.listen(process.env.PORT || 3000, async () => {
  try {
    await sequelize.authenticate();
    console.log('sever started on port ' + process.env.PORT + "thread: "+process.pid);

    //update merchant transaction at 12pm everday
    cron.schedule('0 12 * * *', async () => {
      console.log('log');

      const date_in_millis = new Date().getTime();

      console.log(date_in_millis);

      const dateToGetUpper = new Date(date_in_millis);

      const dateToGetLower = new Date(date_in_millis - 86400 * 1000);

      try {
        const transaction_list = await merchant_transaction_cache.findAll({
          where: {
            createdAt: {
              [Op.lt]: dateToGetUpper,
              [Op.gt]: dateToGetLower,
            },
          },
          raw: true,
        });

        transaction_list.map(async (transaction) => {
          const storm_wallet_from_database = await storm_wallet.findOne({
            where: {
              storm_id: transaction.storm_id,
            },
          });

          storm_wallet_from_database.wallet_balance =
            storm_wallet_from_database.dataValues.ledger_balance;

          await storm_wallet_from_database.save({
            fields: ['wallet_balance'],
          });

          await transactions.update(
            { settlement_status: 'completed' },
            {
              where: {
                rrn: transaction.rrn,
              },
            }
          );
          await merchant_transaction_cache.destroy({
            where: {
              rrn: transaction.rrn,
            },
          });
        });
      } catch (e) {
        console.log(e);
      }
    });
  } catch (e) {
    console.log('unable to connect to database');
    console.log(e);
  }
})

};
