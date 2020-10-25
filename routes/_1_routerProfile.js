/* Aqui hacemos todas operaciones de publicación, actualización o eliminación de anuncios así como la actualización del profile del usuario */
var express = require('express');
var router = express.Router();
var User = require('../models/db').User;
var Chat = require('../models/db').chat; //Collection chat conversaciones
const util = require('util'); //con este paquete podemos ver por consola un json entero
/* console.log('DATA ' + util.inspect(jason, {
           showHidden: false
           , depth: null
         }));*/
//ACCESIBLES SOLO CON SESSION
//Todas las peticion get a app, se redirigen a mi cuenta
router.get('/', function (req, res) {
  res.redirect('profile/app');
});
router.post('/app', function (req, res, next) {
  User.findOne({
    '_id': req.id
  }, function (err, Data) {
    if (!err) {
      if (Data != null) {
        res.status(200).json({
          _id: Data.id
          , socket_id: Data.socket_id
          , avatar: Data.avatar
          , name: Data.name
          , email: Data.email
          , emailConfirmation: Data.emailConfirmation
          , tfl: Data.tfl
          , descrip: Data.descrip
          , valoracion: Data.valoracion
          , Arecibidos: Data.Arecibidos
          , Apublicados: Data.Apublicados
          ,
        });
      }
      else {
        res.status(500);
      }
    }
  });
});
router.post('/getanuncios', function (req, res) {
  User.findOne({
    '_id': req.id
  }, function (err, dato) {
    if (!err) {
      if (dato != null) {
        /* console.log('DATA ' + util.inspect(dato.Apublicados, {
           showHidden: false
           , depth: null
         }));*/
        //Aqui publicaremos el anuncio
        res.status(200).json({
          mode: 'anuncios'
          , success: true
          , anuncios: dato.Apublicados.concat(dato.Arecibidos) //Enviamos tanto los anuncios recibidos como publicados
        });
      }
      else {
        console.log("ROUTER PROFILE DATO NULLO " + dato);
        res.status(500).json({
          code: 500
        });
      }
    }
    else {
      //Si hay error en la base de datos
      console.log("ROUTER PROFILE  ERROR EN BASE DE DATOS " + err);
      console.log("ROUTER PROFILE DATO NULLO " + dato);
      res.status(501).json({
        code: 501
      });
    }
  });
});
router.post('/conversation', function (req, res) {
  const room_id = req.body.nameValuePairs.roomChat_id;
  console.log('Esta es la room id > ' + room_id);
  Chat.findOne({
    room_id: room_id
  }, function (err, dato) {
    if (!err) {
      if (dato != null) {
        //Aqui le enviamos toda la conversación para que la recargue en el recyclerview
        res.status(200).json({
          mode: 'conversation'
          , success: true
          , conversation: dato.conversation //Enviamos toda la conversación
        });
      }
      else res.status(300).json({
        mode: 'err'
        , success: false
      })
    }
  });
});
router.post('/updatelocation', function (req, res) {
  const lat = req.body.nameValuePairs.lat;
  const lon = req.body.nameValuePairs.lon;
  User.findOneAndUpdate({
    '_id': req.id
  }, {
    'coord': {
      lat: lat
      , lon: lon
    }
  }, function (err, Data) {
    if (!err) {
      //console.log(Data);
      res.status(200);
      console.log("Ubicación actualizada " + lat + ' ' + lon);
    }
  });
});
router.post('/updatedata', function (req, res) {
  User.findOneAndUpdate({
    '_id': req.id
  }, {
    'descrip': req.body.nameValuePairs.description
    , 'tfl': req.body.nameValuePairs.telefono
  }, function (err, Data) {
    if (!err && Data) {
      //console.log(Data);
      console.log('NO HAY ERROR ' + Data);
      res.status(200).json(Data);
    }
    else {
      console.log('HAY UN ERROR ' + err);
      res.status(401);
    }
  });
});
router.post('/upfirebase', function (req, res) {
  console.log("_routerprofile_ + firebasetoken " + req.body.nameValuePairs.firebase_token)
  User.findOneAndUpdate({
    '_id': req.id
  }, {
    'firebase_token': req.body.nameValuePairs.firebase_token
  }, function (err, Data) {
    if (!err && Data) {
      //console.log(Data);
      console.log('Routerprofile Firebase token actualizado ' + Data);
      res.status(200).json(Data);
    }
    else {
      console.log('Routerprofile firebase token error ' + err);
      res.status(500);
    }
  });
});
router.post('/changepass', function (req, res) {
  const oldpass = req.body.nameValuePairs.oldPass;
  console.log('router Profile change pass old pass ' + oldpass);
  const newpass = req.body.nameValuePairs.newPass;
  console.log('router Profile change pass new pass ' + newpass);

  User.findOneAndUpdate({ $and: [{ '_id': req.id }, { 'password': oldpass }] },
    {
      'password': newpass
    }, function (err, Data) {
      if (!err) {
        if (Data != null) {
          console.log('Router profile Contraseña actualizada con éxito ' + Data);
          res.status(200).json({ msg: "contraseña actualizada" });
        } else {
          console.log('Router profile ChangePass Antigua Contraseña incorrecta');
          res.status(404).json({ msg: "contraseña incorrecta" });
        }
      }
      else {
        console.log('HAY UN ERROR ' + err);
        res.status(500).json({ msg: "Usuario no encontrado" });
      }
    });
});
router.post('/addfeedback', function (req, res) {
  const feedback =
  {
    idAnuncio: req.body.nameValuePairs.idAnuncio,
    tituloAnuncio: req.body.nameValuePairs.tituloAnuncio,
    idAnunciante: req.body.nameValuePairs.idAnunciante,
    NameAnunciante: req.body.nameValuePairs.NameAnunciante,
    fecha: req.body.nameValuePairs.fecha,
    feedback_rate: req.body.nameValuePairs.feedback_rate,
    comentario: req.body.nameValuePairs.comentario
  }
  const idInteresado = req.body.nameValuePairs.idCandidato 
  User.findOneAndUpdate({ '_id': idInteresado},
    {
      $push: { 'valoracion': feedback }
    }, function (err, Data) {
      if (!err) {
        if (Data != null) {
          console.log('Valoración agregada con exito' + Data);
          res.status(200).json({ msg: "feedback agregado correctamente" });
          //Establecemos la clave valoracion_state en false porque para evitar que valore mas de una vez al candidato
          User.findOneAndUpdate({
            '_id': feedback.idAnunciante,
            'Apublicados': { $elemMatch: { idA: feedback.idAnuncio, 'candidatos': { $elemMatch: { Id: idInteresado } } } },
          },
            {
              $set: { 'Apublicados.$.candidatos.$[x].valoracion_state': false },
              returnNewDocument: true
            }, {
            arrayFilters: [{ 'x.Id': idInteresado }]
          }, function (err, dato) {
            if (!err && dato != null) {
              //Todo ha ido genial
            } else {
              console.log('Ha habido un putisisiismo error ' + err);
            }

          });
        } else {
          console.log('Router profile ChangePass Antigua Contraseña incorrecta');
          res.status(404).json({ msg: "usuario no existe?" });
        }
      }
      else {
        console.log('HAY UN ERROR ' + err);
        res.status(500).json({ msg: "Usuario no encontrado" });
      }
    });


});
module.exports = router;