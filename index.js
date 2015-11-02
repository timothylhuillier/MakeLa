var express = require('express');
var request = require('request');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, resp) {
  response.render('pages/index');
});

app.get('/pizzas', function(req, resp) {

  request('https://pizzapi.herokuapp.com/pizzas', function (err, response, body) {
    if (err) {
      console.log(err, err.stack); // an error occurred
    }

    var listPizzas = {pizzas : JSON.parse(response.body)};
    resp.render('pages/pizzas', listPizzas);
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


