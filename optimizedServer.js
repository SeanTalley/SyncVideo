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
      masterLat = lat/1000;
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
      io.emit("masterdisconnect");
    });
    console.log("Master is " + socket.id);
    socket.emit("master");
  }
  else {
    socket.on("disconnect",function() {
      console.log("Clients: " + Object.keys(io.sockets.connected).length);
      io.emit("clients",Object.keys(io.sockets.connected).length);      
    });
    socket.emit("updatePos", masterPos + masterLat);
    socket.emit("notmaster");
    console.log("NotMaster is " + socket.id);
    if(playing)
      socket.emit("play");
  }
  console.log("Clients: " + Object.keys(io.sockets.connected).length);
  io.emit("clients",Object.keys(io.sockets.connected).length);
});
console.log("Listening on port 8080");
server.listen(8080);