var User = require('./models/db').User;
const id = "5f04865c2a52a607ac9e70ee";
const oldpass = 'emelio';
const newpass = 'j2u4a9n2';

User.findOneAndUpdate({ $and: [{ '_id': id }, { 'password': oldpass }] },
    {
        'password': newpass
    }, function (err, Data) {
        if (!err) {
            if(Data != null){
            //console.log(Data);
            console.log('Router profile Contraseña actualizada con éxito ' + Data);
           // res.status(200).json(Data);
            }else  {
            console.log('Router profile ChangePass Antigua Contraseña incorrecta');
            //res.status(500);
           }
        }
        else{
            console.log('HAY UN ERROR ' + err);
            //res.status(404);
        }
    });