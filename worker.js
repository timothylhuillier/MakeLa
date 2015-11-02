var request = require('request');
var redis = require('redis').createClient(
  process.env.REDIS_URL || 'redis://localhost:6379');

setInterval(function () {
  
  request.get('https://pizzapi.herokuapp.com/pizzas', {timeout: 3000}, function (err, httpResponse, body) {

    // s'il y a le timeout
    if (err || JSON.parse(body).id == "maintenance") {
      console.log("timeout or maintenance");
    }
    else{
      redis.set("listPizzas", body, redis.print);
    }
  });

}, 10000);