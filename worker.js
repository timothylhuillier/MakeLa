var request = require('request');
var redis = require('redis').createClient(
  process.env.REDIS_URL || 'redis://h:pct6t6lhpffn8n85j3b16lv5u3m@ec2-54-83-199-200.compute-1.amazonaws.com:15939');


var intervalObject = setInterval(function () {
  
  request.get('https://pizzapi.herokuapp.com/pizzas', function (err, httpResponse, body) {

    // s'il y a le timeout
    if (err.code === 'ETIMEDOUT') {
      console.log("timeout");
    }
    else{
      redis.set("listPizzas", httpResponse.body, redis.print);
    }

    client.get('listPizzas');
  });

}, 1000);

clearInterval(intervalObject);
