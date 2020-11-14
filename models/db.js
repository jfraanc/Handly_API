//Mongo
var mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
var Schema = mongoose.Schema;

//CONECTION DB
var options = {
  user: 'Admin',
  pass: 'Camiloseven77*',
  useNewUrlParser: true
}
var uri ='mongodb+srv://Admin:<Camiloseven77*>@handly.fgrux.gcp.mongodb.net/<Handly>?retryWrites=true&w=majority'
//var uri = 'mongodb://127.0.0.1:27017/handly'
mongoose.connect(uri, options, function (err) {
  (err) ? console.log(err) : console.log('conectado a DB-> ');
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
