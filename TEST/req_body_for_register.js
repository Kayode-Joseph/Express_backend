module.exports=()=>{
let randomNum= Math.random()*100000

return JSON.stringify({

  

email :`testing_merchant${randomNum}@gmail.com`,

password: "hashed_password",

businessName: "testing",

mobileNumber: "12345678909",

accountNumber: "12345678",

bvn: "123478",

userType: "merchant"


})

}
