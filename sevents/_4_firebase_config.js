var admin = require("firebase-admin");


var serviceAccount = require('../services/serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://handlly.firebaseio.com"
});

module.exports.admin = admin