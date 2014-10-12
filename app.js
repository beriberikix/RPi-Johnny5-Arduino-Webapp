var five = require('johnny-five'),
    board = new five.Board(),
    PORT = 8080,
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({port: PORT}),
    localtunnel = require('localtunnel'),
    request = require('request'),
    networkInterfaces = require('os').networkInterfaces(),
    LOCAL_IP = '127.0.0.1',
    express = require('express'),
    app = express();

app.engine('html', require('ejs').renderFile);

// board setup
board.on('ready', function() {
  var motors, speed;

  speed = 100;
  motors = {
    left: new five.Motor([ 3, 12 ]),
    right: new five.Motor([ 11, 13 ])
  };

  board.repl.inject({
    motors: motors
  });
});

app.get('/', function(req, res) {
  res.render('index.html', { local_ip: LOCAL_IP, port: PORT });
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

// ws setup
wss.on('connection', function(ws) {
  ws.on('message', function(data, flags) {
    if(data === 'forward') {
      forward(255);
    } else if(data === 'reverse') {
      reverse(255);
    } else if(data === 'turnRight') {
      turnRight(255);
    } else if(data === 'turnLeft') {
      turnLeft(255);
    } else if(data === 'halt') {
      halt(255);
    }
  });
});

// motor functions
var stop = function() {
  motors.left.stop();
  motors.right.stop();
};

var forward = function(speed) {
  motors.left.fwd(speed);
  motors.right.fwd(speed);
};

var reverse = function(speed) {
  motors.left.rev(speed);
  motors.right.rev(speed);
};

var turnRight = function(speed) {
  motors.left.fwd(speed);
  motors.right.rev(speed);
};

var turnLeft = function(speed) {
  motors.left.rev(speed);
  motors.right.fwd(speed);
};

// dial-home device/localtunnel setup
localtunnel(PORT, function(err, tunnel) {
  var device = 'mark1';

  // use en0 if on mac while developing
  if(networkInterfaces.wlan0) {
    LOCAL_IP = networkInterfaces.wlan0[0].address;
  } else {
    LOCAL_IP = networkInterfaces.en0[1].address;
  }

  var dhd_url = 'http://dhd-basic.appspot.com/?device=' + device;
      dhd_url += '&local_ip=' + LOCAL_IP;
      dhd_url += '&localtunnel=' + tunnel.url;
  
  console.log(dhd_url);

  request.post(dhd_url);
});