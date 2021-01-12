// Aqui nos registraremos o loguearemos activando la sesión
var express = require('express');
var router = express.Router();
var User = require('../models/db').User;
var createToken = require('../services/token').createToken;
var createEmailToken = require('../services/token').createEmailToken;
var jwt = require('jsonwebtoken');
var sendMailConfirm = require('../sevents/_3_funcAyudas').sendMailConfirm;
var sendMailNewPass = require('../sevents/_3_funcAyudas').sendMailNewPass;
//Chat para hacer pruebas
router.get('/', function (req, res, next) {
  res.render('error');
});

//Registro de usuarios
router.post('/add', function (req, res) {
  /*const util = require('util'); //con este paquete podemos ver por consola un json entero
    console.log('DATA ' + util.inspect(req.body.nameValuePairs, {
    showHidden: false
    , depth: null
  }));*/


  var user = new User({
    socket_id: 'none'
    , firebase_token: req.body.nameValuePairs.firebaseToken
    , avatar: ''
    , name: req.body.nameValuePairs.name
    , email: req.body.nameValuePairs.email
    , emailConfirmation: false
    , tfl: ''
    , password: req.body.nameValuePairs.password
    , password_confirmation: req.body.nameValuePairs.password_confirmation
    , descrip: ''
    , valoracion: 0
    , Apublicados: []
    , Arecibidos: []
    , coord: {
      lat: '0.0'
      , lon: '0.0'
    }
  });
  if (req.body.nameValuePairs.password == req.body.nameValuePairs.password_confirmation) {
    //Debemos comprobar primero si el usuario ya está en la base de datos
    User.findOne({
      'email': req.body.nameValuePairs.email
    }, function (err, usuario) {
      if (usuario == null || err) {
        user.save(function (err, userSaved) {
          console.log('El usuario ha sido registrado---Enviando email---');
          //Enviamos un email con su token creado a partir de su email con segundo token 
          if (!err || userSaved != null) {
            console.log('asdfasd '+req.body.nameValuePairs.email)
            sendMailConfirm(createEmailToken(req.body.nameValuePairs.email), req.body.nameValuePairs.email)
            res.status(200).json({
              message: 'Enjoy your token!'
              , success: true
              , name: req.body.nameValuePairs.name
              , email: req.body.nameValuePairs.email
              , token: createToken(userSaved)
            });
          }
          else {
            console.log('Error al guardar el usuario' + err)
            res.status(403).json({
              success: false
              , message: 'Error'
            });
          }
        });
      }
      else {
        console.log('Usuario ya registrado o hay algún tipo de error ' + err)
        res.status(403).json({
          success: false
          , message: 'Error'
        });
      }
    });
  }
  else {
    res.send('Error al introducir password');
    console.log('Error al introducir password');
  }
});
//Autenticación o logueo
router.post('/authenticate', function (req, res) {
  // find the user
  /* const util = require('util'); //con este paquete podemos ver por consola un json entero
   console.log('DATA ' + util.inspect(req.body.nameValuePairs, {
     showHidden: false
     , depth: null
   })); */
  User.findOne({
    email: req.body.nameValuePairs.email
  }, function (err, User) {
    if (err) throw err;
    if (!User) {
      res.status(401).json({
        success: false
        , message: 'Authentication failed. User not found.'
      });
    }
    else if (User) {
      // check if password matches
      if (User.password != req.body.nameValuePairs.password) {
        res.status(403).json({
          success: false
          , message: 'Authentication failed. Wrong password.'
        });
      }
      else {
        // if user is found and password is right
        // create a token
        res.status(200).json({
          message: 'Enjoy your token!'
          , success: true
          , name: User.name
          , email: User.email
          , emailConfirmation: User.emailConfirmation
          , token: createToken(User)
        });
      }
    }
  });
});
//Resetar password
router.post('/resetpass', function (req, res) {
if(req.body.nameValuePairs.email != null){
  const new_pass = Math.random().toString(36).slice(2);
  const email = req.body.nameValuePairs.email;
  console.log('ROUTER REGISTRO - este es el nuevo password ' + new_pass);
  User.findOneAndUpdate({
    'email': email
  },
    { $set: { 'password': new_pass } }, function (err, usuario) {
      if (usuario == null || err) {
        console.log('Usuario no encontrado o hay algún error en la base de datos ' + err)
        res.status(404).json({
          success: false
          , message: 'Error'
        });
      }
      else {
        console.log('Contraseña actualizada con éxtio');
        res.status(200).json({
          success: true
          , message: 'Contraseña actualizada con éxito'
        });
        sendMailNewPass(email,new_pass);
      }
    });
  }
});

//Email Confirmation
router.get('/mailcnf/:id', function (req, res) {
  //Decodificar el tokenEmail del usuario para que nos devuleva el email y poder buscarlo en la base de datos
  //A continuación ponemos email confirmatión en true y enviamos el correo al usuario.
  var tokenEmail = req.params.id;
  jwt.verify(tokenEmail, 'marolyn19', function (err, decoded) {
    if (err) {
      console.log('Fallo con el token pirobo');
      res.status(500).render('error');
    }
    else {
      User.findOneAndUpdate({
        email: decoded.sub
      }, {
        emailConfirmation: true
      }, function (err, USUARIO) {
        if (!err) {
          if (!USUARIO) {
            res.status(401).json({
              success: false
              , message: 'User not found.'
            });
          }
          else if (USUARIO) {

            res.redirect('http://handly.io/mailconfirm')
          }
        } else {
          console.log("ROUTER REGISTRO ERROR MAIL CONFIRM-> " + err);
        }
      });
    }
  });
});
//Volver a enviar email confirmation
router.post('/rsnd', function (req, res) {
  //Creamos Email con segundo token 
  sendMailConfirm(createEmailToken(req.body.nameValuePairs.email), req.body.nameValuePairs.email);
  res.status(200);
});

//test
module.exports = router;