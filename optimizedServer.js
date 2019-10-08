var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server, {pingInterval: 5000 });

app.use(express.static('www'));

var master = "";
var masterLat = 0;
var playing = false;
var masterPos = 0;
io.on('connection', function(socket) {
  if(master == "") {
    master = socket.id;
    socket.on("latency", function(lat) {
      masterLat = lat;
    });
    socket.on("pos", function(pos) {
      socket.broadcast.emit("updatePos", pos + masterLat);
      masterPos = pos + masterLat;
    });
    socket.on("play",function() {
      socket.broadcast.emit("play");
      playing = true;
    });
    socket.on("pause",function() {
      socket.broadcast.emit("pause");
      playing = false;
    });
    socket.on("disconnect",function() {
      io.emit("masterdisconnect"); //Add some graceful "Stream ended" code
    });
    socket.emit("master");
  }
  else {
    socket.on("disconnect",function() {
      io.emit("clients",Object.keys(io.sockets.connected).length);      
    });
    socket.emit("updatePos", masterPos);
    if(playing)
      socket.emit("play");
  }
  io.emit("clients",Object.keys(io.sockets.connected).length);
});
console.log("Listening on port 8080");
server.listen(8080);
