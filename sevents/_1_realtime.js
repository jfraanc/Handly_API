var io = require('../app').io;
var jwt = require('jsonwebtoken'); // Para Desencriptar el token
var Chat = require('../models/db').chat; //Collection chat conversaciones
//Funciones Algoritmicas
var rmvAnuncio = require('./_2_algoritmos').rmvAnuncio;
var dealer = require('./_2_algoritmos').dealer;
var updateSocketId = require('./_2_algoritmos').updateSocketId;
var findUsers = require('./_2_algoritmos').findUsers;
var sendJobtoUser = require('./_2_algoritmos').sendJobtoUser;
var updateAvatar = require('./_2_algoritmos').updateAvatar;
var getCandidato = require('./_2_algoritmos').getCandidato;
var updateStatusAnuncioLeido = require('./_2_algoritmos').updateStatusAnuncioLeido;
var updateMensajesLeidos = require('./_2_algoritmos').updateMensajesLeidos;
io.on('connection', function (socket) {
  // Tenemos que actualizar socket_id en el shema del usario cada vez que se conecta
  //De esta manera puedo identificar a los usuarios que están conectados en todo momento 
  //y así enviar mensajes específicos a cualquiera de ellos HAY QUE BUSCAR LA FORMA DE HACER MIDLEWARE ASI NO ESTOY TODO EL RATO DESENCRIPTANDO EL PUTO TOKEN

  //console.log("User connected");
  socket.on('updateSocketId', function (msg, callback) {
    updateSocketId(msg.token, socket.id);
  });
  socket.on('anuncios', function (jsonAnuncio, callback) {

    const MODE_EMIT_MULTIPLES = "puesbrothers"
    const MODE_EMIT_SINGLE = "solounbro";
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
            , distancia: jsonAnuncio.distancia
            , uriImg: jsonAnuncio.uriImg
            , candidatos: []
          };
          //No si se comprobar antes si el usuario existe en la base de datos
          //Aqui es donde vamos a elegir los usuarios a los cuales vamos a enviar el anuncio.
          //Dependiendo de la localización, preferencias... A ver como lo hago.
          //socket.broadcast.emit('anuncios', AnunRecibido); //io.emit para emitir a todos socket.broadcast.emit, para enviar y no devolver

          if (jsonAnuncio.mode == MODE_EMIT_MULTIPLES) {
            console.log('EMIT multiples')
            findUsers(jsonAnuncio.name, decoded.sub, AnunRecibido, {
              lat: jsonAnuncio.lat
              , lon: jsonAnuncio.lon
            }, socket, io, AnunRecibido, callback);
          } else if ((jsonAnuncio.mode == MODE_EMIT_SINGLE)) {
            //Método que crearía el chat solo con la persona elegida de la comunidad de usuarios
            console.log('EMIT SINGLE')
            sendJobtoUser(decoded.sub, jsonAnuncio.idCandidato, AnunRecibido, callback)
          }
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
      updateStatusAnuncioLeido(dataRoom, false, socket);
      //Al conectarme a la room chat tengo que actualizar los msg leidos de la otra persona
      updateMensajesLeidos(dataRoom.roomChat_id, dataRoom.name,socket);   
    }
  });
  socket.on('message', function (msgObjt, callback) {
    var LEIDO;
    if (io.sockets.adapter.rooms[msgObjt.roomChat_id] !== undefined) {
      //Si es igual a 1 significa que estoy solo en la sala del chat y le tengo que enviar la notificacion
      //Si es 2 ambas personas están conectadas
      if (Object.keys(io.sockets.adapter.rooms[msgObjt.roomChat_id].sockets).length == 1) {
        //Actualizamos noticacion en anuncio y candidato
        updateStatusAnuncioLeido(msgObjt, true, socket);
        LEIDO = false;
      } else {
        LEIDO = true;
      }
      var fecha = new Date().toISOString().
        replace(/T/, ' '). // replace T with a space
        replace(/\..+/, '')
      var Mensaje = {
        date: fecha
        , name: msgObjt.name
        , msg: msgObjt.msg
        , leido: LEIDO
      }
      //Guardamos cada mensaje en la room
      Chat.findOneAndUpdate({
        room_id: msgObjt.roomChat_id
      }, {
        $push: {
          conversation: Mensaje
        }
      }, function (err, data) {
        if (!err && data != null) {
          (LEIDO) ? callback({ status: 200 }) : callback({ status: 201 })
          socket.broadcast.in(msgObjt.roomChat_id).emit('message', {
            date: fecha
            , name: msgObjt.name
            , msg: msgObjt.msg
            , update: false
          });

        }
        else {
          console.log('No se ha encontrado la room');
        }
      });

    }

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