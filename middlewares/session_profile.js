//El middleware maneja todas las peticiones antes de llegar al routeador
module.exports = function (req, res, next) {
  var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
  // check header or url parameters or post parameters for token
  var token = req.body.token ||req.headers['x-access-token'];
  //console.log('este es el token '+req.headers['x-access-token'] )
  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, 'ilovelondon', function (err, decoded) {
      if (err) {
        console.log('Fallo con el token pirobo');
        res.status(500).json({
          success: false
          , message: 'Failed to authenticate token.'
        });
      }
      else {
        // if everything is good, save to request for use in other routes
        req.id = decoded.sub;
        //console.log('Id decodificado Middlewares '+req.id); // este el número que genera mlab con un nuevo registro
        //const util = require('util'); //con este paquete podemos ver por consola un json entero
        //console.log('DATA '+util.inspect(decoded, {showHidden: false, depth: null}) );
        next();
      }
    });
  }
  else {
    // if there is no token
    // return an error
    
    return res.status(403).send({
      success: false
      , message: 'No token provided.'
    });
  }
};