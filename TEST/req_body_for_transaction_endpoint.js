module.exports=()=>{
const rand= Math.floor(Math.random()*10000000)

return JSON.stringify({
    AID: '',
    RRN: `586660112010${rand}`,
    STAN: '235134',
    TSI: '',
    TVR: '',
    accountType: 'SAVINGS',
    acquiringInstCode: '200008',
    additionalAmount_54:
        '1002566C0000146149001001566C0000146501601053566D000000001000',
    amount: 10,
    appCryptogram: '',
    authCode: '296632',
    cardExpiry: '2412',
    cardHolder: 'ADEBAYO/OLOYEDE',
    cardLabel: 'Master card',
    id: 0,
 
    localDate_13: '0507',
    localTime_12: '235134',
    maskedPan: '539983xxxxxx6497',
    merchantId: '2033LAGPOOO7885',
    originalForwardingInstCode: '627480',
    otherAmount: 0,
    otherId: '',
    responseCode: '00',
    responseDE55:
        '9F260836DF2A391F0DD79A9F2701809F10120110A74003020000000000000000000000FF9F370461DF19049F360201A2950500000080009A032205079C01009F02060000000000105F2A020566820239009F1A0205669F3303E0F8C89F0306000000000000910aCF355E92D841262400129F3501229F34034403029F1E0411420161',
    routingChannel: 'NIBSS',
    stormId: '0a41d3f9-e62b-4846-8765-f7b6663ebbbf',
    terminalId: '2033ALVL',
    transactionStatus: 'approved',
    transactionTimeInMillis: 165196,
    transactionType: 'PURCHASE',
    transmissionDateTime: '2022-07-07 11:51:37',
    userType: 'merchant',
});


}