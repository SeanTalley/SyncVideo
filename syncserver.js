var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server, {pingInterval: 500 });

app.use(express.static('www'));

var users = [];
var masterPos = 0;
var master = "";
var masterLat = 0;
var playing = false;
io.on('connection', function(socket) {
  if(master == "") {
    master = socket.id;
    socket.on("latency", function(lat) {
      masterLat = lat/1000;
    });
    socket.on("pos", function(pos) {
      masterPos = pos;
    });
    socket.on("play",function() {
      socket.broadcast.emit("play");
      playing = true;
    });
    socket.on("pause",function() {
      socket.broadcast.emit("pause");
      playing = false;
    });
    console.log("Master is " + socket.id);
    socket.emit("master");
  }
  else {
    users[socket.id] = {};
    users[socket.id].lat = 0;
    users[socket.id].pos = 0;
    socket.on("latency", function(lat) {
      users[socket.id].lat = lat/1000;
    });
    socket.on("pos", function(pos) {
      users[socket.id].pos = pos;
      if(Math.abs((pos + users[socket.id].lat) - (masterPos + masterLat)) > .15) {
        socket.emit("updatePos", masterPos + users[socket.id].lat + masterLat);
        console.log("Syncing to " + (masterPos + users[socket.id].lat + masterLat) + " MasterPos: " + masterPos);
      }
    });
    socket.emit("notmaster");
    console.log("NotMaster is " + socket.id);
    if(playing)
      socket.emit("play");
  }
  io.emit("clients",Object.keys(users).length + 1);
});
console.log("Listening on port 8080");
server.listen(8080);