var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routesRegistro = require('./routes/_0_routerRegistro');
var routesProfile = require('./routes/_1_routerProfile');
var session_middleware_profile=require('./middlewares/session_profile');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var SocketIOevents = require('./sevents/_1_realtime').SocketIOevents
SocketIOevents(io);
console.log('INICIANDO API')
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(function(req, res, next){
  res.io = io;
  next(); 
});
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); //Esto enviaría toda la parte pública


//Cookies
/*
var cookieSession= require('cookie-session');
app.use(cookieSession({
  name:'session',
  keys: ['key-1','key'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
*/

app.use('/', routesRegistro);
app.use('/profile',session_middleware_profile);
app.use('/profile', routesProfile);





// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = {app: app, server: server, io: io};
