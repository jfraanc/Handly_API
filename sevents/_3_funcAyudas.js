const util = require('util');
var url_api = 'https://handly-api.herokuapp.com/';
function findPost(obj, key, key_val) {
  for (var i = 0; i < obj.length; i++) {
    if (obj[i][key] == key_val) {
      return i;
    }
  }
  return null;
}
module.exports.findPost = findPost;

function getUsersNear(tarjet, UsersConnected, limit) { //El límite en metros
  var geolib = require('geolib');
  //Los ordenamos de menor a mayor respecto a la distancia del emisor o anunciante
  var objt = geolib.orderByDistance({
    latitude: tarjet.latitude
    , longitude: tarjet.longitude
  }, UsersConnected);
  //Recorremos el array hasta el límite de distancia que queramos por ejemplo 30 km.
  
  console.log('putaMaddreeGEO ' + util.inspect(objt, {
    showHidden: false
    , depth: null
  }));
  var ArrayFinal = [];
  for (var i = 0; i < objt.length; i++) {

    if (objt[i].distance != null && objt[i].distance < limit) {
        UsersConnected[objt[i].key].distance = objt[i].distance
        ArrayFinal.push(UsersConnected[objt[i].key])  
    }
    else {
      //En el caso de que ya no se cumpla la condición salimos del array para que no lo recorra entero
      console.log('rompemos');
      break;
    }
  }
  console.log('putisiisisma array final ' + util.inspect(ArrayFinal, {
    showHidden: false
    , depth: null
  }));
  return ArrayFinal;
}
module.exports.getUsersNear = getUsersNear

 //Enviar mail confirmation
  function sendMailConfirm(tokenEmail, email) {
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
      service: 'gmail'
      , auth: {
        user: 'handly.ask@gmail.com'
        , pass: 'j2u4a9n2'
      }
    });
    const mailOptions = {
      from: 'handly.ask@gmail.com', // sender address
      to: email, // list of receivers
      subject: 'Activar cuenta Handly', // Subject line
      html:' <h7> H A N D L Y APP </h7>'+
      '<HR><h4>Para activar tu cuenta pulsa el logo de Handly</h4><a href="'+url_api+'/mailcnf/'+tokenEmail+'" class="site-logo visible-mobile"> <img style="with:auto; height:auto; max-width:300px" src="https://res.cloudinary.com/dz0lvutrn/image/upload/v1592736413/app/mailConfirmation/Handly_Logo.png" alt="handly"> </a>'
    };
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) console.log('_3_funcAyudas Error en el mail al enviar token para activar cuenta ' + err);
      else console.log('SuccesSS ' + info);
    });
  }
module.exports.sendMailConfirm = sendMailConfirm

//Enviar email con nueva contraseña
function sendMailNewPass(email,newPass) {
  var nodemailer = require('nodemailer');
  var transporter = nodemailer.createTransport({
    service: 'gmail'
    , auth: {
      user: 'handly.ask@gmail.com'
      , pass: 'j2u4a9n2'
    }
  });
  const mailOptions = {
    from:'handly.ask@gmail.com', // sender address
    to: email, // list of receivers
    subject: 'Activar cuenta Handly', // Subject line
    html:
    ' <h7> H A N D L Y APP </h7>'+
    '<h4>Esta es tu nueva contraseña (te recomendamos que actualizes tu contraseña en la sección de ajustes de tu perfil):</h4><HR><h1>'+newPass+'</h1>'
  };
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) console.log('_3_funcAyudas error en mail al enviar nueva contraseña ' + err);
    else console.log('SuccesSS ' + info);
  });
}
module.exports.sendMailNewPass = sendMailNewPass

