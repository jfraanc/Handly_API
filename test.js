// var User = require('./models/db').User; //Base de dato de usuario

// dataANUNCIANTE = "5f73f09328194d2250983d2a"
// idInteresado = "5f73f0a328194d2250983d2b"
// idA = '364194-N0CVC'

// User.findOneAndUpdate({
//     '_id': dataANUNCIANTE,
//     'Apublicados': { $elemMatch: { idA: idA, 'candidatos':{ $elemMatch: { Id:idInteresado} } } },
// }, 
// {
//     $set: { 'Apublicados.$.candidatos.$[x].valoracion_state': true},
//     returnNewDocument: true 
// },{
//     arrayFilters:[{'x.Id':idInteresado}]
// }, function (err, dato) {
//     if (!err && dato != null) {
//         //Mandamos notificación al usuario
//     } else {
//         console.log('Ha habido un putisisiismo error '+err);
//     }

// });


// 86400000 estos son 24 horas en milisegundos
const venticuatro_horas = 0
let future_date = Date.parse("2020-10-25 13:55") + venticuatro_horas
let ts = future_date - Date.now()


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
//console.log(future_date+' --'+year + "-" + month + "-" + day+" // "+hours+':'+minutes+':'+seconds);

setTimeout(function(){
    console.log('Aloha')
},ts);

