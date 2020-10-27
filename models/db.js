//Mongo
var mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
var Schema = mongoose.Schema;
//old
// var options = {
//   user: 'admin',
//   pass: 'j2u4a9n2',
//   useNewUrlParser: true
// }
// var uri = 'mongodb://<dbadmin>:<dbj2u4a9n2>@ds013405.mlab.com:13405/deeli'
// //var uri1 ='mongodb://localhost/base'
// var db = mongoose.connect(uri, options, function (err) {
//   if (err) console.log(err);
// });

//New DATA BASE
var options = {
  user: 'Admin',
  pass: 'Camiloseven77*',
  useNewUrlParser: true
}
var uri = 'mongodb+srv://Admin:<Camiloseven77*>@handly.fgrux.gcp.mongodb.net/<Handly>?retryWrites=true&w=majority'
//var uri1 ='mongodb://localhost/base'
mongoose.connect(uri, options, function (err) {
  if (err) console.log(err);
});

//___________COLLECTION->Usuarios
//Tablas--> es como un Json
var userSchemaJson = {

  socket_id: String,
  firebase_token: String,
  coord: Object,
  type: Number,
  avatar: String,
  name: String,
  email: String,
  emailConfirmation: Boolean,
  tfl: String,
  descrip: String,
  valoracion: [],
  password: String,
  uriImg: String,
  Apublicados: [],
  Arecibidos: []


};

var user_schema = new Schema(userSchemaJson);

//validar password
user_schema.virtual('password_confirmation').get(function () {
  return this.p_c;
}).set(function (password) {
  this.p_c = password;
});

var User = mongoose.model('users', user_schema);
module.exports.User = User;


//___________COLLECTION->Chats-Conversaciones
var chatSchemaJson = {

  room_id: String,
  Idanuncio: String,
  users: [],
  conversation: []


};
var chat_schema = new Schema(chatSchemaJson);
var chat = mongoose.model('rooms_chats', chat_schema);
module.exports.chat = chat;


/* Tipos de datos mongo
String
Number
Date
Buffer
Boolean
Mixed
Objectidid
Array
*/
