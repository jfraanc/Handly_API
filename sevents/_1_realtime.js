var io = require('../app').io;
var jwt = require('jsonwebtoken'); // Para Desencriptar el token
var Chat = require('../models/db').chat; //Collection chat conversaciones
//Funciones Algoritmicas
var rmvAnuncio = require('./_2_algoritmos').rmvAnuncio;
var dealer = require('./_2_algoritmos').dealer;
var updateSocketId = require('./_2_algoritmos').updateSocketId;
var findUsers = require('./_2_algoritmos').findUsers;
var updateAvatar = require('./_2_algoritmos').updateAvatar;
var getCandidato = require('./_2_algoritmos').getCandidato;
var updateStatusAnuncioLeido = require('./_2_algoritmos').updateStatusAnuncioLeido;
io.on('connection', function (socket) {
  // Tenemos que actualizar socket_id en el shema del usario cada vez que se conecta
  //De esta manera puedo identificar a los usuarios que están conectados en todo momento 
  //y así enviar mensajes específicos a cualquiera de ellos HAY QUE BUSCAR LA FORMA DE HACER MIDLEWARE ASI NO ESTOY TODO EL RATO DESENCRIPTANDO EL PUTO TOKEN

  //console.log("User connected");
  socket.on('updateSocketId', function (msg, callback) {
    updateSocketId(msg.token, socket.id);
  });
  socket.on('anuncios', function (jsonAnuncio, callback) {
    console.log('Este es la CATEGORIA -> ' + jsonAnuncio.categoria);
    if (jsonAnuncio != null && jsonAnuncio.token) {
      // verifies secret and checks exp
      jwt.verify(jsonAnuncio.token, 'ilovelondon', function (err, decoded) {
        if (err) {
          callback({
            status: 500
          });
        }
        else {
          // Si todo va bien
          var AnunRecibido = {
            idAnunciante: decoded.sub
            , name: jsonAnuncio.name
            , peticion: jsonAnuncio.peticion
            , leido: false
            , estado: jsonAnuncio.estado
            , type: jsonAnuncio.type
            , categoria: jsonAnuncio.categoria
            , idA: jsonAnuncio.idA
            , titulo: jsonAnuncio.titulo
            , descripcion: jsonAnuncio.descripcion
            , fecha: jsonAnuncio.fecha
            , hora: jsonAnuncio.hora
            , precioT: jsonAnuncio.precioT
            , duracion: jsonAnuncio.duracion
            , precioHora: jsonAnuncio.precioHora
            , lat: jsonAnuncio.lat
            , lon: jsonAnuncio.lon
            , distancia: ""
            , uriImg: jsonAnuncio.uriImg
            , candidatos: []
          };
          //No si se comprobar antes si el usuario existe en la base de datos
          //Aqui es donde vamos a elegir los usuarios a los cuales vamos a enviar el anuncio.
          //Dependiendo de la localización, preferencias... A ver como lo hago.
          findUsers(jsonAnuncio.name, decoded.sub, AnunRecibido, {
            lat: jsonAnuncio.lat
            , lon: jsonAnuncio.lon
          }, socket, io, AnunRecibido, callback);
          //socket.broadcast.emit('anuncios', AnunRecibido); //io.emit para emitir a todos socket.broadcast.emit, para enviar y no devolver  
        }
      });
    }
    else {
      //Le devolvemos un 500 si el token está mal
      callback({
        status: 500
      });
    }
  });
  //Aqui administramos las peticiones de los usuarios para aceptar o rechazar los anuncios y los candidato
  socket.on('dealer', function (jsonUserCandidato, callback) {
    jwt.verify(jsonUserCandidato.token, 'ilovelondon', function (err, decoded) {
      if (err) {
        callback({
          status: 502
        });
      }
      else {
        dealer(decoded.sub, jsonUserCandidato.idA, jsonUserCandidato.date, jsonUserCandidato.hora, jsonUserCandidato.distancia, callback);
      }
    });
  });
  //Eliminar anuncio o candidato
  socket.on('eliminarAnuncio', function (json, callback) {
    jwt.verify(json.token, 'ilovelondon', function (err, decoded) {
      if (err) {
        callback({
          status: 502
        });
      }
      else {
        //No estoy usando idAnunciante mirar si al final se utiliza
        rmvAnuncio(decoded.sub, json.idA, json.idAnunciante, json.TypEvent, socket, callback);
      }
    });
  });

  //DEBERIAN SER ESTO MEJOR SIMPLES PETICIONES POST?
  //Subir foto avatar
  socket.on('avatar', function (json, callback) {
    updateAvatar(json.token, json.url, callback)
  });

  //Get Candidato
  socket.on('candidato', function (json, callback) {
    getCandidato(json.token, json.idCandidato, callback)
  });

  //EVENTO DE CHAT
  socket.on('room', function (dataRoom) {
    if (dataRoom.roomChat_id !== undefined) {
      var room = dataRoom.roomChat_id
      console.log("JODER ROOM " + dataRoom.roomChat_id)
      socket.join(room);
      console.log("el user se metio a la rooom")
      //AL UNIRME A LA ROOM SIMPLEMENTE PONGO MI REGISTRO GENERAL DEL ANUNCIO EN TRUE
      //console.log('JOIN ROOM '+dataRoom.typeA)
      updateStatusAnuncioLeido(dataRoom, false, socket);
    }
  });
  socket.on('message', function (msgObjt) {

    if (io.sockets.adapter.rooms[msgObjt.roomChat_id] !== undefined) {
      //Si es igual a 1 significa que estoy solo en la sala del chat y le tengo que enviar la notificacion
      if (Object.keys(io.sockets.adapter.rooms[msgObjt.roomChat_id].sockets).length == 1) updateStatusAnuncioLeido(msgObjt, true, socket);
    }

    var fecha = new Date().toISOString().
      replace(/T/, ' '). // replace T with a space
      replace(/\..+/, '')
    var Mensaje = {
      date: fecha
      , name: msgObjt.name
      , msg: msgObjt.msg
    }
    //Guardamos cada mensaje en la room
    Chat.findOneAndUpdate({
      room_id: msgObjt.roomChat_id
    }, {
      $push: {
        conversation: Mensaje
      }
    }, function (err, data) {
      if (!err) {

        if (data != null) {
          socket.broadcast.in(msgObjt.roomChat_id).emit('message', {
            date: fecha
            , name: msgObjt.name
            , msg: msgObjt.msg
          });
        }
      }
      else {
        console.log('No se ha encontrado la room');
      }
    })
  });

  //COMO HAGO PARA SABER SI ESTOY SOLO EN LA ROOM O NO
  socket.on('leave', function (jsonObj) {
    socket.leave(jsonObj.roomChat_id);
    console.log('el usuario ha dejado la room ' + jsonObj.roomChat_id);

  });

  socket.on('disconnect', function () {
    console.log('user disconnected')
  });
  //No se si esto es neceseario
  socket.on('notifications', function (msg, callback) {
    console.log('puta vida tete');
  });
});
module.exports.io = io;