// const url_api = "";
// const tokenEmail = "";
// const email = "j.fraanc@gmail.com"

// var nodemailer = require('nodemailer');
//     var transporter = nodemailer.createTransport({
//       service: 'hotmail'
//       , auth: {
//         user: 'handly.ask@outlook.com'
//         , pass: 'j2u4a9n2'
//       }
//     });
//     const mailOptions = {
//       from: 'handly.ask@outlook.com', // sender address
//       to: email, // list of receivers
//       subject: 'Activar cuenta Handly', // Subject line
//       html:' <h7> H A N D L Y APP </h7>'+
//       '<HR><h4>Para activar tu cuenta pulsa el logo de Handly</h4><a href="'+url_api+'mailcnf/'+tokenEmail+'" class="site-logo visible-mobile"> <img style="with:auto; height:auto; max-width:300px" src="https://res.cloudinary.com/dz0lvutrn/image/upload/v1592736413/app/mailConfirmation/Handly_Logo.png" alt="handly"> </a>'
//     };
//     transporter.sendMail(mailOptions, function (err, info) {
//       if (err) console.log('_3_funcAyudas Error en el mail al enviar token para activar cuenta ' + err);
//       else console.log('SuccesSS ' + info);
//     });