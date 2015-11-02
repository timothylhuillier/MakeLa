var express = require('express');
var request = require('request');
var app = express();

var CircuitBreaker = require('circuit-breaker-js');
var breaker = new CircuitBreaker({numBuckets: 3});

var redis = require('redis').createClient(
  process.env.REDIS_URL || 'redis://localhost:6379');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


// affiche la liste des pizzas
app.get('/', function(req, resp) {

  request.get('https://pizzapi.herokuapp.com/pizzas', {timeout: 3000}, function (err, httpResponse, body) {

    var returned = {pizzas : null,
                    available: false};
    console.log("breaker : " + breaker.isOpen())

    // s'il y a le timeout
    if (err || JSON.parse(body).id == "maintenance") {
      console.log(err);
      redis.get('listPizzas', function(err, reply) {
          returned.pizzas = JSON.parse(reply);
          resp.render('pages/pizzas', returned);
      });
      return;
    }
    else{
      returned.pizzas = JSON.parse(httpResponse.body);
      // si le circuit breaker est fermé (donc que l'api focntionne) 
      if(!breaker.isOpen()){
        returned.available = true;
      } 
    }
    resp.render('pages/pizzas', returned);
  });
});

// a middleware sub-stack which handles GET requests to /orders/:id
app.get('/orders/:id', function (req, resp, next) {

  var command = function(success, failure) {
    request.post(
      {url:'https://pizzapi.herokuapp.com/orders', 
      json: {'id': parseInt(req.params.id)}
      }, 
      function(err,httpResponse,body){
      if (err) {
        failure();
        console.log(err, err.stack); // an error occurred
        // process.exit(0);
      } else {
        success();
      }
      console.log(body);
      resp.render('pages/order', {order: body});
    });
  }


  var fallback = function() {
    alert("Service is down");
  };
   
  breaker.run(command, fallback);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
