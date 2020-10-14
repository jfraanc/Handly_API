'use strict'
//Token para sesión
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var moment = require('moment');
var secret = 'ilovelondon';

function createToken(user) {
  const payload = {
    sub: user._id
    , iat: moment().unix()
    , exp: moment().add(14, 'days').unix()
  };
  return jwt.sign(payload, secret);
  
}
module.exports.createToken = createToken;

var claveEmailConfirm = "marolyn19"

function createEmailToken(email){
  const payload = {
    sub: email
    , iat: moment().unix()
    , exp: moment().add(24, 'hours').unix()
  };
return jwt.sign(payload, claveEmailConfirm);
}
module.exports.createEmailToken = createEmailToken;
//Token para email confirmation
