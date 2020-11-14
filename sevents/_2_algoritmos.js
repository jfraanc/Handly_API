const util = require('util');
var findPost = require('./_3_funcAyudas').findPost;
var getUsersNear = require('./_3_funcAyudas').getUsersNear;
var User = require('../models/db').User; //Base de dato de usuario
var Chat = require('../models/db').chat; //Collection chat conversaciones
var jwt = require('jsonwebtoken'); // Para Desencriptar el token
const { object } = require('underscore');
const { ObjectId } = require('mongodb');
var adminFirebase = require('../sevents/_4_firebase_config').admin; //Para enviar notificaciones
//Ponemos todas las notificaiones en alta prioridad
const notification_options = {
  defaultSound: true,
  defaultVibrateTimings: true,
  priority: "high",
  timeToLive: 60 * 60 * 24
};
const TYPE_ANUNCIO_EMITED = 7;
const TYPE_ANUNCIO_RECEIVED = 13;
//Actualizamos el socket Id en el Shema del usuario
function updateSocketId(token, socketId) {
  jwt.verify(token, 'ilovelondon', function (error, decoded) {
    if (!error) {
      User.findOneAndUpdate({
        _id: decoded.sub
      }, {
        socket_id: socketId
      }, function (err, data) {
        //if (!err) console.log('datos actualizados');
      });
    }
    else {
      console.log('token cagao no vale');
    }
  });
}
module.exports.updateSocketId = updateSocketId
//Buscar usuarios cerca conectados
function findUsers(name, idEmisor, anuncio, coordTarjet, socket, io, anuncio, callback) {
  const DISTANCIA = 20000; //20 km
  //Por el momento vamos a buscar en toda la base de datos y luego hacemos el filtrado,
  // tengo que implementar el buscar por ciudad de esta forma haríamos una busquedad mas efectiva
  User.find({ $and: [{ firebase_token: { $ne: "" } }, { 'coord.lat': { $ne: "" } }, { ['coord.lon']: { $ne: "" } }] }, (err, data) => {

    console.log('Todos los usuarios encontrados ' + util.inspect(data, {
      showHidden: false
      , depth: null
    }));
    //SE LO VAMOS A ENVIAR A TODOS LOS USUARIOS
    if (!err) {
      var allUsers = []
      var userTarjet = {};
      for (var i = 0; i < data.length; i++) {

        //console.log('algoritmos find user IDEMISOR '+idEmisor)

        if (data[i]._id != idEmisor) {
          var user = {
            _id: data[i]._id
            , firebase_token: data[i].firebase_token
            , latitude: data[i].coord.lat
            , longitude: data[i].coord.lon
          }
          //Creamos un array con sus coordenadas y el socket id
          allUsers.push(user);
        } else {

          userTarjet = {
            _id: data[i]._id
            , firebase_token: data[i].firebase_token
            , latitude: data[i].coord.lat
            , longitude: data[i].coord.lon
          }

        }

      }
      console.log('Usertarjet ' + util.inspect(userTarjet, {
        showHidden: false
        , depth: null
      }));

      console.log('Todos los usuarios menos el tarjet ' + util.inspect(allUsers, {
        showHidden: false
        , depth: null
      }));

      if (userTarjet.latitude != 0.0 || userTarjet.longitude != 0.0 || userTarjet.latitude != null || userTarjet.longitude != null) {
        //Conseguimos solo los usuarios conectados dentro de un rango de 20 km  
        var UsersNear = getUsersNear(userTarjet, allUsers, DISTANCIA);

        if (UsersNear !== null && UsersNear.length !== 0) {
          //Y finalmente aquí le enviariamos el anuncio a los usuarios en cuestión
          //Hay que ver como lo hago asíncrono para que envíe todos a la vez
          //Después de estos filtros vamos a asociar los anuncios a los usuarios elegidos y luego a enviarle la notificación

          for (var i = 0; i < UsersNear.length; i++) {
            //Reajustamos el anuncio en recibido Type=13 y le agregamos una clave de petición que es el estado de respuesta que el receptor da sobre el anuncio
            var distanciaPorUsuario = ""
            if (UsersNear[i].distance < 1000) {
              distanciaPorUsuario = "menos de 1 km"
            } else {
              distanciaPorUsuario = Math.round(UsersNear[i].distance / 1000) + " km"
            }

            var Anuncio_Emitido = {
              idAnunciante: anuncio.idAnunciante
              , name: anuncio.name
              , peticion: false //false = Pendiente de aceptación, true aceptado
              , estado: anuncio.estado
              , type: 13
              , leido: false
              , categoria: anuncio.categoria
              , idA: anuncio.idA
              , titulo: anuncio.titulo
              , descripcion: anuncio.descripcion
              , fecha: anuncio.fecha
              , hora: anuncio.hora
              , precioT: anuncio.precioT
              , duracion: anuncio.duracion
              , precioHora: anuncio.precioHora
              , lat: anuncio.lat
              , lon: anuncio.lon
              , distancia: distanciaPorUsuario //Personalizamos la distancia de cada usuario
              , uriImg: anuncio.uriImg
              , candidatos: []
            };
            //A partir de aqui enviamos la notificacion a todos lo usuarios cercanos

            User.findOneAndUpdate({
              '_id': UsersNear[i]._id
            }, {
              $push: {
                Arecibidos: Anuncio_Emitido
              }
            }, function (err, dato) {
              if (!err) {
                //No hace falta enviar notificacion porque el usuario tiene la app abierta al emitir el anuncio, y le llega 
                //a traves del evento por el cual emitió el anuncio
                callback({
                  status: 200
                });
                console.log('Ningún error al asociar el anuncio recibido a los candidatos')
              }
            });




            const message_notification = {
              notification: {
                title: name + " necesita ayuda con: ",
                body: anuncio.titulo
              }
            };

            adminFirebase.messaging().sendToDevice(UsersNear[i].firebase_token, message_notification, notification_options)
              .then(response => {

                //response.status(200).send("Algoritmos FindUser notification Notification sent successfully");

              })
              .catch(error => {
                console.log(error);
              });


            //Metodo antiguo socket.io
            /*
                            socket.broadcast.to(UsersNear[i].socket_id).emit('anuncios', {
                              notification: 0,
                              name: name + " necesita ayuda con: ",
                              msg: anuncio.titulo
                            });
            */
          }
          //Si encontramos usuarios cerca, adjuntamos al emisor y avisamos del ok, si no avisamos al emisor                       
          User.findOneAndUpdate({
            '_id': idEmisor
          }, {
            $push: {
              Apublicados: anuncio
            }
            , 'coord': {
              lat: userTarjet.latitude
              , lon: userTarjet.longitude
            }
          }, function (err, dato) {
            if (!err) {
              callback({
                status: 200
              });
            }
          });
        }
        else {
          console.log('No hay usuarios dentro del rango')
          callback({
            status: 502
          });
        }
      }
      else {
        console.log('No hemos podido obtener tu localización, intentalo de nuevo pasados unos minutos')
        callback({
          status: 501
        });
      }
    }
    else {
      console.log('Error desconocido, no encuentra ningún usuario')
      callback({
        status: 500
      });
    }
  })
};
module.exports.findUsers = findUsers;
//Manejador de tratos entre los usuarios, y notificación
function dealer(idInteresado, idA, Fecha, Hora, socket, callback) {
  const candidatos_max = 3
  //Primero buscamos el json del anunciante
  User.findOne({
    'Apublicados': {
      $elemMatch: {
        idA: idA,
        estado: true //Si está en true es que está disponible todavía
      }
    }
  }, function (err, dataANUNCIANTE) {
    if (err) {
      console.log('Nada error ' + err);
    }
    else if (dataANUNCIANTE == null) { //Esto significa que el anuncio está en false o no existe

      //Removemos el anuncio de la colección de anuncios del candidato interesado (receptor)
      User.updateOne({
        _id: idInteresado
      }, {
        $pull: {
          Arecibidos: {
            idA: idA
          }
        }
      }, function (err, data) {
        if (err) {
          console.log('Nada error ' + err);
        }
        else if (data == null) { //Esto significa que el anuncio está en false o no existe
          console.log('Hay algún tipo de error al buscar tu anuncio en la base de datos ');
          //Aquí le enviaríamos el callback 501
          callback({
            status: 501
          });
        }
        else {
          console.log('Anuncio eliminado de la collection del interesado (Receptor) ya que no está disponible');
          callback({
            status: 500
          });
        }
      });

    }
    else {
      //AGREGAMOS EL ANUNCIO EN  LAS COLLECCIONES DE ANUNCIOS DE AMBOS USUARIOS (ANUNCIANTE Y RECEPTOR)
      // PRIMERO AGREGAMOS LA INFORMACION DEL CANDIDATO ANUNCIANTE EN EL JSON ARRAY "CANDIDATOS" DEL ANUNCIO QUE ESTA EN EL ARRAY ANUNCIOS RECIBIDOS DEL RECEPTOR
      var Candidato_Anunciante = {
        Id: String(dataANUNCIANTE._id).trim()
        , Avatar: dataANUNCIANTE.avatar
        , Nombre: dataANUNCIANTE.name
        , RoomChat: (dataANUNCIANTE._id + '&' + idInteresado + '&' + idA).trim()
        , leido: false
        , valoracion_state: false
      }

      User.findOneAndUpdate({ '_id': idInteresado, 'Arecibidos': { $elemMatch: { idA: idA } } }, {

        $push: { 'Arecibidos.$.candidatos': Candidato_Anunciante },
        $set: { 'Arecibidos.$.peticion': true }

      }, function (err, dataInteresado) {
        if (!err) {
          // SI TODO HA IDO BIEN 
          //AGREGAMOS USUARIO INTERESADO(RECEPTOR) A LA COLLECTION DE ANUNCIOS PUBLICADOS DEL ANUNCIANTE
          var Candidato_Interesado = {
            Id:String(idInteresado).trim()
            , Avatar: dataInteresado.avatar
            , Nombre: dataInteresado.name
            , RoomChat: (dataANUNCIANTE._id + '&' + idInteresado + '&' + idA).trim()
            , leido: false
            , valoracion_state: false

          }

          User.findOneAndUpdate({ '_id': dataANUNCIANTE._id, 'Apublicados': { $elemMatch: { idA: idA } } }, {

            $push: { 'Apublicados.$.candidatos': Candidato_Interesado }

          }, function (err, datosAnunciante_Actualizado) {


            if (!err) {

              //Creamos un nuevo registro en la colección Chats 
              var chatSchemaJson = new Chat({
                room_id: (dataANUNCIANTE._id + '&' + idInteresado + '&' + idA).trim()
                , Idanuncio: idA
                , users: [String(dataANUNCIANTE._id), idInteresado.trim()]
                , conversation: []
              });
              chatSchemaJson.save(function () {
                //Devolvemos un ok, a la persona que acepto el anuncio si todo ha ido perfecto
                console.log('U got it');
                callback({
                  status: 200
                });
                /*Método antiguo enviar notificacion socket.io
                socket.broadcast.to(dataANUNCIANTE.socket_id).emit('notifications', {
                  notification: 0,
                  name: dataInteresado.name,
                  msg: " Ha aceptado el trato!"
                });
                */
                //Enviamos una notificación al anunciante
                const message_notification = {
                  notification: {
                    priority: "high",
                    title: dataInteresado.name,
                    body: " Ha aceptado el trato!",
                    sound: "default"
                  }
                };
                adminFirebase.messaging().sendToDevice(dataANUNCIANTE.firebase_token, message_notification, notification_options)
                  .then(response => {
                    console.log('Algoritmos dealer notificacion enviada al usuario de ha aceptado el trato')
                    //response.status(200).send("Algoritmos FindUser notification Notification sent successfully")
                  })
                  .catch(error => {
                    console.log(error);
                  });

              });

              //BUSCAMOS EL ANUNCIO QUE ACABAMOS DE ACTUALIZAR CON LOS NUEVOS CANDIDATOS Y CONTAMOS CUANTOS HAY PARA SABER SI HAY QUE PONERLO EN FALSE O NO
              console.log('DEALER ' + datosAnunciante_Actualizado.Apublicados[findPost(datosAnunciante_Actualizado.Apublicados, "idA", idA)].candidatos.length)
              if (datosAnunciante_Actualizado.Apublicados[findPost(datosAnunciante_Actualizado.Apublicados, "idA", idA)].candidatos.length + 1 == candidatos_max) {
                User.findOneAndUpdate({ '_id': dataANUNCIANTE._id, 'Apublicados': { $elemMatch: { idA: idA } } }, {

                  $set: { 'Apublicados.$.estado': false }

                }, function (err, dato) {
                  if (err) console("Ha habido un error al actualizar estado de anuncio")
                  console.log('DEALER ' + dato)
                });
              }

              //Creamos el evento valoración, el cual se activará 24 horas después de la realización del trato
              const delay_valoracion = 86400000
              let future_date = Date.parse(Fecha + ' ' + Hora) + delay_valoracion
              let ts = future_date - Date.now();
              let date_ob = new Date(future_date);
              let day = date_ob.getDate();
              let month = date_ob.getMonth() + 1;
              let year = date_ob.getFullYear();
              // current hours
              let hours = date_ob.getHours();
              // current minutes
              let minutes = date_ob.getMinutes();
              // current seconds
              let seconds = date_ob.getSeconds();
              // prints date & time in YYYY-MM-DD format
              console.log(future_date + ' --' + year + "-" + month + "-" + day + " // " + hours + ':' + minutes + ':' + seconds);
              //Esto se ejecutará 24 horas después de que el trato suceda.
              setTimeout(function () {
                User.findOneAndUpdate({
                  '_id': dataANUNCIANTE,
                  'Apublicados': { $elemMatch: { idA: idA, 'candidatos': { $elemMatch: { Id: idInteresado } } } },
                },
                  {
                    $set: { 'Apublicados.$.candidatos.$[x].valoracion_state': true },
                    returnNewDocument: true
                  }, {
                  arrayFilters: [{ 'x.Id': idInteresado }]
                }, function (err, dato) {
                  if (!err && dato != null) {
                    //Mandamos notificación al usuario al Anunciante (emisor)

                    const message_notification = {
                      notification: {
                        priority: "high",
                        title: 'A ' + dataInteresado.name,
                        body: "Le gustaría que le dejaras una valoración",
                        sound: "default"
                      }
                    };
                    adminFirebase.messaging().sendToDevice(dataANUNCIANTE.firebase_token, message_notification, notification_options)
                      .then(response => {
                        console.log('Algoritmos dealer notificacion enviada al usuario de ha aceptado el trato')
                        //response.status(200).send("Algoritmos FindUser notification Notification sent successfully")
                      })
                      .catch(error => {
                        console.log(error);
                      });

                  } else {
                    console.log('Ha habido un putisisiismo error ' + err);
                  }

                });
              }, ts);

            } else {
              //callback 502
              callback({
                status: 502
              });
            }

          });

        }
      });
    }
  });

}
module.exports.dealer = dealer;
//Eliminar anuncio
function rmvAnuncio(idInteresado, idA, idAnunciante, evenType, socket, callback) {
  //Primero buscamos el tipo de evento que nos llega. 
  const EVENT_REJECT_RECEIVED = 92;
  const EVENT_REMOVE_RECEIVED = 57;
  const EVENT_REMOVE_EMITED = 77;
  console.log('idInteresado ' + idInteresado);
  switch (evenType) {
    case EVENT_REJECT_RECEIVED:
      console.log('Evento REJECT_RECEIVED')
      User.updateOne({
        _id: idInteresado
      }, {
        $pull: {
          Arecibidos: {
            idA: idA
          }
        }
      }, function (err, data) {
        if (err) {
          console.log('Nada error ' + err);
        }
        else if (data == null) { //Esto significa que el anuncio está en false o no existe
          console.log('Hay algún tipo de error al buscar tu anuncio en la base de datos ');
          //Aquí le enviaríamos el callback 500
          callback({
            status: 500
          });
        }
        else {
          console.log('Anuncio rechazado con éxito');
          callback({
            status: 200
          });
        }
      });
      break;
    case EVENT_REMOVE_RECEIVED:
      console.log('Evento REMOVE_RECEIVED')
      //Primero eliminamos el anuncio igual que en el evento anterior del que lo recibe
      User.updateOne({
        _id: idInteresado
      }, {
        $pull: {
          Arecibidos: {
            idA: idA
          }
        }
      }, function (err, data) {
        if (err) {
          console.log('Nada error ' + err);
        }
        else if (data == null) { //Esto significa que el anuncio está en false o no existe
          console.log('Hay algún tipo de error la buscar tu anuncio en la base de datos ');
          //Aquí le enviaríamos el callback 500
          callback({
            status: 500
          });
        }
        else {
          console.log('fhsfhsfhsfh ' + (idAnunciante + '&' + idInteresado).trim());
          User.findOneAndUpdate({
            'Apublicados': {
              $elemMatch: {
                idA: idA
              }
            }
          }, {
            $pull: {
              'Apublicados.$.candidatos': {
                'RoomChat': (idAnunciante + '&' + idInteresado).trim()
              }
            }
          }, function (err, dato) {
            if (err) {
              //callback 502
              callback({
                status: 502
              });
            }
            else {
              //Devolvemos un ok, a la persona que acepto el anuncio si todo ha ido perfecto
              console.log('Exitaso evento REMOVE_RECEIVED');
              callback({
                status: 200
              });
            }
          });
        }
      });
      break;
    case EVENT_REMOVE_EMITED:
      User.findOneAndUpdate({
        'Apublicados': {
          $elemMatch: {
            idA: idA
          }
        }
      }, {
        $pull: {
          Apublicados: {
            idA: idA
          }
        }
      }, function (err, dato) {
        if (err) {
          //callback 502
          callback({
            status: 502
          });
        }
        else {
          User.findOneAndUpdate({
            'Arecibidos': {
              $elemMatch: {
                idA: idA
              }
            }
          }, {
            $pull: {
              Arecibidos: {
                idA: idA
              }
            }
          }, function (err, dato) {
            if (err) {
              //callback 502
              callback({
                status: 502
              });
            }
            else {
              //Devolvemos un ok, a la persona que acepto el anuncio si todo ha ido perfecto
              console.log('Exitaso evento REMOVE_EMITED');
              const util = require('util');
              console.log('Dato Test ' + util.inspect(dato, {
                showHidden: false
                , depth: null
              }));
              callback({
                status: 200
              });
            }
          });
        }
      });
      break;
  }
}
module.exports.rmvAnuncio = rmvAnuncio;

function updateAvatar(token, url, callback) {
  jwt.verify(token, 'ilovelondon', function (error, decoded) {
    if (!error) {
      console.log(decoded.sub + ' fasdfa sdfas')
      User.findOneAndUpdate({
        _id: decoded.sub
      }, {
        avatar: url
      }, function (err, data) {
        if (!err) {
          callback({
            status: 200
          });
        }
      });
    }
    else {
      console.log('token cagao no vale');
    }
  });
}
module.exports.updateAvatar = updateAvatar

function getCandidato(token, idCandidato, callback) {
  jwt.verify(token, 'ilovelondon', function (error, decoded) {
    if (!error) {
      User.findOne({
        '_id': idCandidato
      }, function (err, Data) {
        if (!err) {
          callback({
            status: 200
            , avatar: Data.avatar
            , name: Data.name
            , descripcion: Data.descrip
            , Arecibidos: Data.Arecibidos.length
            , Apublicados: Data.Apublicados.length
            , valoracion: Data.valoracion
          });
        }
        else {
          callback({
            status: 500
          });
        }
      });
    }
    else {
      //Tenemos que enviar siempre un estatus rollo 777 para eliminar la sesión del usuario
      console.log('ERROR TOKEN');
    }
  });
}
module.exports.getCandidato = getCandidato

function updateStatusAnuncioLeido(obj, Notification, socket) {



  if (!Notification) { //ESTAMOS DESCONECTADOS Y NOS UNIMOS A LA ROOM CHAT
    obj.typeA == TYPE_ANUNCIO_EMITED ? TIPO = "Apublicados" : TIPO = "Arecibidos"
    obj.typeA == TYPE_ANUNCIO_RECEIVED ? TIPO = "Arecibidos" : TIPO = "Apublicados"
    console.log('ACTUALIZAR LEIDOS AL ENTRAR EN ROOM ' + "NOTIFICATION " + Notification + " tipo " + obj.typeA)

    if (obj.typeA == TYPE_ANUNCIO_EMITED) {
      console.log('entrando en ' + obj.typeA + ' idAnuncio ' + obj.idA);
      User.findOneAndUpdate(
        { "Apublicados": { $elemMatch: { idA: obj.idA, candidatos: { $elemMatch: { Id: obj.idCandidato } } } } },
        {
          $set: { 'Apublicados.$.leido': true, 'Apublicados.$.candidatos.$[x].leido': true },
          returnNewDocument: true
        },
        { arrayFilters: [{ 'x.Id': obj.idCandidato }] }
        , function (err, dato) {
          if (err) {
            //console.log('Error ' + err)

          } else {
            //console.log('USER ' + dato);
          }


        });
    } else {
      User.findOneAndUpdate(
        { "Arecibidos": { $elemMatch: { idA: obj.idA } } }
        , {
          $set: { 'Arecibidos.$.leido': true },
          returnNewDocument: true
        }, function (err, dato) {
          if (err) {
            //console.log('Error ' + err)

          } else {
            //console.log('USER ' + dato);
          }


        });
    }

  } else { //ESTAMOS YA UNIDOS A LA ROOM CHAT Y MANDAMOS UN MENSAJE
    //Si es true, significa que estamos mandando mensajes a una persona desconectada
    //Cuando el otro usuario esta desconectado
    obj.typeA == TYPE_ANUNCIO_EMITED ? TIPO = "Arecibidos" : TIPO = "Apublicados"
    obj.typeA == TYPE_ANUNCIO_RECEIVED ? TIPO = "Apublicados" : TIPO = "Arecibidos"

    //Primero buscamos la roomChat que nos va a devolver los ids de los interesados
    Chat.findOne({
      room_id: obj.roomChat_id
    }, function (err, dato) {
      if (!err) {
        if (dato != null) {
          jwt.verify(obj.token, 'ilovelondon', function (error, decoded) {
            if (!error) {
              var tarjet_user;
              //Con el id (lo obtengo gracias al token) de la persona que envia el mensaje(Emisor o receptor) busco el id de la otra persona que lo recibe y que está desconectada
              for (var i = 0; i < dato.users.length; i++) {
                if (dato.users[i] != decoded.sub) tarjet_user = dato.users[i]
              }

              //Actualizamos el estado de la persona desconectada.
              User.findOneAndUpdate(
                { _id: tarjet_user, [TIPO]: { $elemMatch: { idA: obj.idA, candidatos: { $elemMatch: { Id: decoded.sub } } } } },
                {
                  $set: { [TIPO + '.$.leido']: false, [TIPO + '.$.candidatos.$[x].leido']: false },
                  returnNewDocument: true
                }, {
                  arrayFilters: [{ 'x.Id': decoded.sub }]
              }, function (err, datoUsuario) {
                if (!err && datoUsuario != null) {
                  //console.log('DATO ACTUALIZADO ' + datoUsuario)
                  //Despues de actualizar el estado de la persona desconectada le enviamos una notificación
                  User.findOne({
                    '_id': tarjet_user
                  }, function (err, data) {
                    if (!err && data != null) {
                      console.log('Exito al cambiar estado leido')
                      /* Método antiguo enviar notificacion socket.io
                      socket.broadcast.to(data.socket_id).emit('notifications', {
                        notification: 0,
                        name: obj.name,
                        msg: obj.msg
                      });
                      */
                      //Enviamos una notificación a el usuario que no esta en la room_chat 
                      //(pero como no sabemos si esta o no conectado lo enviamos)
                      const message_notification = {
                        notification: {
                          priority: "high",
                          title: obj.name,
                          body: obj.msg,
                          sound: "default"
                        }
                      };
                      adminFirebase.messaging().sendToDevice(data.firebase_token, message_notification, notification_options)
                        .then(response => {
                          //response.status(200).send("Algoritmos FindUser notification Notification sent successfully")
                          console.log("Enviando mensaje...")
                        })
                        .catch(error => {
                          console.log(error);
                        });

                    }

                    else {
                      console.log('eerororo ' + err);
                    }
                  });

                } else {

                  console.log('Error ' + err)
                }


              });


            }
            else {
              console.log('token cagao no vale');
            }
          });
        }
        else res.status(300).json({
          mode: 'err'
          , success: false
        })
      }
    });


  }


}

module.exports.updateStatusAnuncioLeido = updateStatusAnuncioLeido;