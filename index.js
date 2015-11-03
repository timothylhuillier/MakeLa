var librato = require('librato-node');
var express = require('express');
var request = require('request');
var CircuitBreaker = require('circuit-breaker-js');

// Metrics (www.librato.com)
librato.configure({email: 'tech@iothinks.com', token: 'a9b8fb2463fcbcdb713e33b80adb79bf078b04aeecef27d7b2e3dd39d3ab2d6c'});
librato.start();

var app = express();

var breaker = new CircuitBreaker({
  numBuckets: 3, 
  windowDuration: 10000,
  volumeThreshold: 2});

var redis = require('redis').createClient(
  process.env.REDIS_URL || 'redis://localhost:6379');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

breaker.onCircuitOpen = function (metrics){

  console.log(metrics);
};


// affiche la liste des pizzas
app.get('/', function(req, resp) {

  // envoie une metrics de temps a Liberto
  librato.timing('la liste des pizzas', function () {
    request.get('https://pizzapi.herokuapp.com/pizzas', {timeout: 3000}, function (err, httpResponse, body) {

      var returned = {pizzas : null,
                      available: false};

      // si le circuit breaker est fermé (donc que l'api focntionne) 
      if(!breaker.isOpen()){
        returned.available = true;
      } 
      console.log("breaker : " + breaker.isOpen())

      // s'il y a le timeout ou id maintenance
      if (err || httpResponse.statusCode == 503) {
        console.log(err);
        redis.get('listPizzas', function(err, reply) {
            returned.pizzas = JSON.parse(reply);
            resp.render('pages/pizzas', returned);
        });
        return;
      }
      else{
        returned.pizzas = JSON.parse(httpResponse.body);
        resp.render('pages/pizzas', returned);
        return;
      }
    });
  });

});

// a middleware sub-stack which handles GET requests to /orders/:id
app.get('/orders/:id', function (req, resp, next) {

  var command = function(success, failure) {
    // envoie une metrics de temps a Liberto
    librato.timing('Effectue une commande', function () {
      var Time = request.post(
        {url:'https://pizzapi.herokuapp.com/orders', 
         json: {'id': parseInt(req.params.id)}
        },function(err, httpResponse, body){
        if (err || httpResponse.statusCode == 503) {
          console.log("failure");
          failure();
          resp.render('pages/fail', {err: err});
          return; 
        } else {
          success();
          console.log("success");
          resp.render('pages/order', {order: body});
          return; 
        }      
      });
    }); 
  };


  var fallback = function() {
    alert("Service is down");
  };
   
  breaker.run(command, fallback);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
