var express = require('express');
var request = require('request');
var app = express();
var client = require('redis').createClient(
  process.env.REDIS_URL || 'redis://h:pct6t6lhpffn8n85j3b16lv5u3m@ec2-54-83-199-200.compute-1.amazonaws.com:15939');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


// affiche la liste des pizzas
app.get('/', function(req, resp) {

  request.get('https://pizzapi.herokuapp.com/pizzas', {timeout: 3000}, function (err, httpResponse, body) {

    // s'il y a le timeout
    if (err.code === 'ETIMEDOUT') {
      console.log("timeout");
    }
    else{
      var listPizzas = {pizzas : JSON.parse(httpResponse.body)};
    }

    resp.render('pages/pizzas', listPizzas);
  });
});

// a middleware sub-stack which handles GET requests to /orders/:id
app.get('/orders/:id', function (req, resp, next) {

  request.post(
    {url:'https://pizzapi.herokuapp.com/orders', 
     json: {'id': parseInt(req.params.id)}
    }, 
    function(err,httpResponse,body){
      if (err) {
        console.log(err, err.stack); // an error occurred
        process.exit(0);
      } 
      console.log(body);
      resp.render('pages/order', {order: body});
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


