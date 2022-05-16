

const {
  NotFoundError,
  UnauthenticatedError,
  BadRequestError,
} = require('../errors');

const {
banks
} = require('../DB/models');


const getAllBanks= async(req,res)=>{

    const allBanks = await banks.findAll({

        attributes:['bank_code','bank_name']
    })



    res.send(allBanks)


}

const getOneBank = async (req, res) => {
    const code= req.params.code
  const oneBank = await banks.findOne(

    

    {
        attributes:['bank_code','bank_name'],
        where:{
            bank_code:code
        }
    }
  );

  res.send(oneBank);
};

module.exports={

    getAllBanks, getOneBank
}


