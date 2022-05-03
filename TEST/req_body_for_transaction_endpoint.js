module.exports=()=>{
const rand= Math.floor(Math.random()*10000000)

return JSON.stringify({
  stormId: 'b124e830-8621-47ec-9b77-ec6dcf82f3e9',
  key: 123456,
  AID: '',
  RRN: `586660112010${rand}`,
  STAN: '594728',
  TSI: '',
  TVR: '',
  accountType: 'Master card',
  acquiringInstCode: '',
  additionalAmount_54: '',
  amount: 9000000,
  appCryptogram: '',
  authCode: '',
  cardExpiry: '2412',
  cardHolder: 'ADEBAYO/OLOYEDE',
  cardLabel: 'Master card',
  id: 0,
  localDate_13: '2004',
  localTime_12: '114658',
  maskedPan: '5399834420826497',
  merchantId: 'aad00f66-af91-42a3-813a-78faa2405fed',
  originalForwardingInstCode: '',
  otherAmount: 0,
  otherId: '',
  responseCode: '99',
  responseDE55: '',
  terminalId: '2033ALZP',
  transactionTimeInMillis: 0,
  transactionType: 'PURCHASE',
  transmissionDateTime: '',
  userType: 'merchant',
  transactionStatus: 'approved',
  routingChannel: 'ISW',
});


}