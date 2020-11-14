var User = require('./models/db').User; //Base de dato de usuario

dataANUNCIANTE = "5fa2bc44c0749e072c779b87"
idInteresado = "5fa2b862c0749e072c779b86"
idA = '748326-71JC5'

// User.findOneAndUpdate({
//     '_id': dataANUNCIANTE,
//     'Arecibidos': { $elemMatch: { idA: idA, 'candidatos':{ $elemMatch: { Id:idInteresado} } } },
// }, 
// {
//     $set: { 'Arecibidos.$.candidatos.$[x].leido': true},
//     returnNewDocument: true 
// },{
//     arrayFilters:[{'x.Id':idInteresado}]
// }, function (err, dato) {
//     if (!err && dato != null) {
//         console.log('exito')
//     } else {
//         console.log('Ha habido un putisisiismo error '+err);
//     }

// });


User.findOne({
    '_id': dataANUNCIANTE,
    'Arecibidos': { $elemMatch: { idA: idA, candidatos:{ $elemMatch: { Id: idInteresado}}}},
}, function (err, dato) {
    if (!err && dato != null) {
        console.log('exito')
    } else {
        console.log('Ha habido un putisisiismo error '+err);
    }

});

// 5fa2b862c0749e072c779b86
// 5fa2b862c0749e072c779b86
