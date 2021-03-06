"use strict"

var os = require('os');
var express = require('express');
var app = express();
var https = require('https');
var fs = require('fs');
var options = {
  cert: fs.readFileSync('cert.crt'),
  key: fs.readFileSync('private.key')
};
https = https.createServer(options, app);
var path = require('path');
var io = require('socket.io')(https);
var port = process.env.PORT || 3000;
var mazes = require('./src/customMazes');
var db = require('./db.js');
var bcrypt = require('bcryptjs');
var BinaryServer = require('binaryjs').BinaryServer;
var binaryServer = new BinaryServer({ server:https, path: '/binary'});
var calculateDistance = require('./calculateDistance');
var nodemailer = require('nodemailer');
https.listen(port, function () {
  console.log('Example app listening on port 3000!');
});

/*************************************************************************************************
 Node & Express
 *************************************************************************************************/

app.use( function(req, res, next) {
  console.log('current serving ', req.method, ' @ ', req.url);
  next();
});

app.use('/build/bundle.js', function (req, res, next) {
  req.url = req.url + '.gz';
  res.set('Content-Encoding', 'gzip');
  console.log('Inside gzip!')
  next();
});

app.use('/', express.static(__dirname + '/src'));
app.use('/js', express.static(__dirname + '/src/js'));
app.use('/build', express.static(__dirname + '/src/build'));

app.get('/favicon.ico', function(request, response) {
  response.sendFile(path.join(__dirname, './src/favicon.ico'));
});

app.get('/home/favicon.ico', function(request, response) {
  response.sendFile(path.join(__dirname, './src/favicon.ico'));
});

app.get('/game/favicon.ico', function(request, response) {
  response.sendFile(path.join(__dirname, './src/favicon.ico'));
});

app.get('*', function (request, response){
  console.log('Sending index.html!')
  response.sendFile(path.resolve(__dirname, './src/index.html'));
});

/*************************************************************************************************
Node Mail
 *************************************************************************************************/
// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mazingfriendsgame@gmail.com',
    pass: 'anukuldjsavy'
  }
});

/*************************************************************************************************
 Socket.io
*************************************************************************************************/

// Declare necessary variables for keeping track of users, rooms, messages, and game levels
var userCount = 0;
var rooms = {};
var playerRoom = {};
var messages = {};
var roomCount = 0;
var newRoom = [];
var usernames = {};
var roomLevel = {};
var finalTime = {};
var roomUser = {};
var roomInformation = {rooms: rooms, levels: roomLevel, users: roomUser};

// Start socket.io server

var AWS = require('aws-sdk');
var BucketCredentials = require('./config.json');
AWS.config.update(BucketCredentials);
// AWS.config.loadFromPath('./config.json');
var s3 = new AWS.S3();

// Bucket names must be unique across all S3 users
var myBucket = 'mazingfriends1';

// console.log('@@@@@ Here is BucketCredentials : ', BucketCredentials);


io.on('connection', function(socket) {

  //get friend status for friend profile
  socket.on("getFriendStatus", function(data){
    console.log("USER", data);
    console.log("USERNAMES", usernames);
    if (usernames[data]){
      socket.emit("receiveFriendStatus", true);
    }
    else {
      socket.emit("receiveFriendStatus", false);
    }
  });
  socket.on("getProfileImage", function(data){
    console.log("trying to get user image");
    let params = {Bucket: myBucket, Key: data.user};
    s3.getObject(params, function(err, data){
      if (err) {
        console.log(err);
        socket.emit("setProfileImage", "");
      } else{
        console.log(data);
        socket.emit("setProfileImage", data.Body.toString());
      }
          })
  });
  socket.on("saveImage", function(data){
    let myKey = data.user;
    let params = {Bucket: myBucket, Key: myKey, Body: data.imageUrl};

        s3.putObject(params, function(err, data) {

          if (err) {

            console.log(err)

          } else {

            console.log("Successfully uploaded data to myBucket/myKey");

          }

        });
  })
  socket.on("invite", function(data){
    console.log(data);
// setup email data with unicode symbols
    var mailOptions = {
      from: 'mazingfriendsgame@hackreactor.com', // sender address
      to: data.email, // list of receivers
      subject: 'Sign up for Mazing Friends!', // Subject line
      html: '<a href="https://mazingfriends.net">Play Mazing Friends!</a>' // html body
    };

// send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        return console.log(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
    });
  });
  socket.on("getUserStats", function(user){
    console.log("trying to get user stats");
    db.Leaderboard.findAll({
      where: {
        username: user
      }
    }).then(function(data){
      socket.emit("userStats", data);
    });
  });
  socket.on("getFriends", function(user) {
    db.Friends.findAll({
      where: {
        user: user
      }
    }).then(function(data){
      var friends = [];
      for(var i = 0; i < data.length; i++) {
        friends.push(data[i].dataValues);
      }
      friends.forEach(function(obj) {
        let params = {Bucket: myBucket, Key: obj.friend};
        s3.getObject(params, function(err, data){
          if (err) {
            console.log("THIS IS THE ERROR:", err);
            obj.image = "";
          } else{
            console.log("THIS IS THE DATA", data);
            obj.image = data.Body.toString();
          }
          console.log("FRIENDS", friends);
          socket.emit("friendData", friends);
        })
      });
      });
  });
  //MODIFY THIS
  socket.on("addFriend", function(data){
    db.Friends.find({
      where: {
        user: data.user,
        friend: data.friend
      }
    }).then(function(response){
      if (response) {
        console.log("already added");
        socket.emit("alreadyAdded");
      }
      else {
        console.log("Adding friend", data.friend);
        db.Friends.create({
          user: data.user,
          friend: data.friend
        }).then(function(){
          db.Friends.findAll({
            where: {
              user: data.user
            }
          }).then(function(data){
            var friends = [];
            for(var i = 0; i < data.length; i++) {
              friends.push(data[i].dataValues);
            }
            friends.forEach(function(obj) {
              let params = {Bucket: myBucket, Key: obj.friend};
              s3.getObject(params, function(err, data){
                if (err) {
                  console.log("THIS IS THE ERROR:", err);
                  obj.image = "";
                } else{
                  console.log("THIS IS THE DATA", data);
                  obj.image = data.Body.toString();
                }
                console.log("FRIENDS", friends);
                socket.emit("friendData", friends);
              })
            });
          });
        })
      }
    })
  });
  socket.on("getRooms", function() {
    console.log("request to get all rooms");
    socket.emit("receive", rooms);
  });
  db.Leaderboard.findAll({
    order: [['time', 'ASC']]
  }).then(function(data){
    if(data.length > 0) {
      var newData = {
        time: data[0].dataValues.time,
        user: data[0].dataValues.username   
      };
        console.log('Here is all data : ', data);
        console.log('Here is the data sending to client : ', newData);
        socket.emit('receiveWorldRecord', newData);
     }
  });

  // Increment every time a new user is connected
  userCount++;
  console.log('a user connected', userCount);

  socket.on('disconnect', function(){
    // Decerement user count when a user leaves the game
    var username = usernames[socket.id];
    delete usernames[socket.id];
    delete usernames[username];
    userCount--;
    // Decrement number of people in the room
    rooms[playerRoom[socket.id]]--;
    // If there is no one in the room, delete the room
    if ( rooms[playerRoom[socket.id]] === 0 ) {
      delete rooms[playerRoom[socket.id]];
    }
    // Update rooms in lobby view
    io.sockets.emit("receiveRooms", rooms);
    console.log('user disconnected! Current user count : ', userCount);
  });
  socket.on('quit', function(data){
    delete usernames[socket.id];
    delete usernames[data];
  });
  /*************************************************************************************************
   Game Rooms / Messages Sockets
  *************************************************************************************************/
  
  // Listen for createRoom
  socket.on('createRoom', function (roomInfo) {
    var roomName = roomInfo.roomname;
    console.log('room info in server: ', roomInfo)
    // If no empty room exists, make a new room and put user into it
    if (!rooms[roomName]) {
      // Save game level for second player
      roomLevel[roomName] = roomInfo.level;
      // Save creating user for lobby
      roomUser[roomName] = roomInfo.user;
      // Create/save room and increment room count
      rooms[roomName] = 1;
      roomCount++;
      // Associate room name to user's socket id
      playerRoom[socket.id] = roomName;
      // Notify user that he/she is first player
      socket.emit('firstPlayer', 'firstPlayer');
      // Notify room name
      socket.emit('roomName', roomName);
      //emit created event to video for webrtc
      socket.emit('created', roomName, socket.id);
      // Connect user to the room
      socket.join(roomName);
      // Send maze to user
      socket.emit('serverSendingMaze', {
        maze: mazes[roomLevel[roomName]],
        mazeLevel: roomLevel[roomName]
      });
       //Find best record from database
      db.Leaderboard.findAll({
        where: {
          level: Number(roomLevel[playerRoom[socket.id]])
        },
        order: [['time', 'ASC']]
      }).then(function(data){
        if ( data.length === 0 ) {
          return;
        }
        var newData = {
          time: data[0].dataValues.time,
          user: data[0].dataValues.username
        };
        // Send best record back to users
        var roomName = playerRoom[socket.id];
        console.log('Send back world record to users in ', roomName);
        io.sockets.in(roomName).emit('receiveWorldRecord', newData);
      });
    } else {
      // Send error message back to user
      socket.emit('roomJoinError', 'roomAlreadyExsits');
    }
    console.log(rooms);
    // Update rooms in lobby view
    io.sockets.emit("receiveRooms", roomInformation);
  });

  socket.on('joinRoom', function(roomName) {
    if ( !rooms[roomName] ) {
      // Send error message back to user
      socket.emit('roomJoinError', 'noSuchRoom');
    } else if (rooms[roomName] === 2) {
      // Send error message back to user
      socket.emit('roomJoinError', 'roomFull');
    } else {
      // increment number of users in the room
      rooms[roomName]++;
      // Associate room name to user's socket id
      playerRoom[socket.id] = roomName;
      // Connect user to the room
      socket.join(roomName);
      // Notify user that he/she is second player
      socket.emit('secondPlayer', 'secondPlayer');
      // Notify room name
      socket.emit('roomName', roomName);
      // Request other player's game information
      socket.broadcast.to(playerRoom[socket.id]).emit('newPlayerRequestInfo');
      // Send maze and maze level to user
      socket.emit('serverSendingMaze', {
        maze: mazes[roomLevel[roomName]],
        mazeLevel: roomLevel[roomName]
      });
      // Find best record from database
      db.Leaderboard.findAll({
        where: {
          level: Number(roomLevel[playerRoom[socket.id]])
        },
        order: [['time', 'ASC']]
      }).then(function(data){
        if ( data.length === 0 ) {
          return;
        }
        var newData = {
          time: data[0].dataValues.time,
          user: data[0].dataValues.username
        };
        // Send best record back to users
        var roomName = playerRoom[socket.id];
        console.log('Send back world record to users in ', roomName);
        io.sockets.in(roomName).emit('receiveWorldRecord', newData);
      });
      /////////
      io.in(roomName).emit('join', roomName);
      socket.emit('joined', roomName, socket.id);
      io.sockets.in(roomName).emit('ready');
    }
    // Update rooms in lobby view
    io.sockets.emit("receiveRooms", rooms);
    // Start timer in the room
    io.to(roomName).emit('receiveStartTime', new Date().getTime() );
  });

  
  // Listen for user request for rooms for lobby view
  socket.on("getRoomInfo", function() {
    // Send room information back to user
    io.sockets.emit("receiveRooms", roomInformation);
  });

  // Receive a user's message and return all messages posted in the room
  socket.on('sendMessage', function(data) {
    var roomName = playerRoom[socket.id];
    var roomMessages = messages[roomName] || [];
    // Add new message and userId to messages array
    roomMessages.push({
      userId: data.user,
      message: data.message
    });
    // Save the update messages array
    messages[roomName] = roomMessages;
    // Send back ten newest messages to all users in the room
    // var lastTenMessages = roomMessages.slice(roomMessages.length-10);
    io.to(roomName).emit('receiveMessage', roomMessages);
  });

  /*************************************************************************************************
   Game Sockets
  *************************************************************************************************/


  // Receive a user's initial position and send it to all other players in the room
  socket.on('sendPlayer', function (playerCamera) {
    socket.broadcast.to(playerRoom[socket.id]).emit('receivePlayer', playerCamera);
  });

  // Receive a user's updated position and send it to all other players in the room
  socket.on('userPositionChanged', function (userPosition) {
    socket.broadcast.to(playerRoom[socket.id]).emit('receiveUserPosition', userPosition);
  });

  // Receive initial location of bullet that was fired and send it to all other players in the room
  socket.on('shotFired', function (shooter) {
    socket.broadcast.to(playerRoom[socket.id]).emit('incomingShot', shooter);
  });

  // calculate distance between two users and send back percentage (%)
  socket.on('calculateDistance', function(positionObject) {
    socket.emit('receiveDistancePercentage', calculateDistance(positionObject));
  });

  socket.on('time', function(time) {
    socket.emit('timer', time)
  });

  socket.on('gameover', function(data) {
    console.log("GAME OVER FINISH TIMES", playerRoom[socket.id]);
    var socketIds = Object.keys(io.in(playerRoom[socket.id])['adapter'].rooms[playerRoom[socket.id]]['sockets']);
    var friend = socketIds[0] === socket.id ? usernames[socketIds[1]] : usernames[socketIds[0]];
    var integerTime = 0;

    if ( !finalTime[playerRoom[socket.id]] ) {
      finalTime[playerRoom[socket.id]] = {
        time: data.time,
        user: data.user,
        friend: friend,
        id: socket.id
      };
      var finishTime = finalTime[playerRoom[socket.id]].time;
      if ( finishTime.split(':').length > 1 ) {
        var newTime = finishTime.split(':');
        integerTime = Number(newTime[0] * 60) + Number(newTime[1]);
      } else {
        integerTime = Number(finishTime);
      }
    } else if ( finalTime[playerRoom[socket.id]]['id'] !== socket.id ) {
      var finalTimeData = finalTime[playerRoom[socket.id]];
      finalTime[playerRoom[socket.id]] = {
        time: finalTime[playerRoom[socket.id]]['time'],
        user: data.user,
        friend: friend,
        id: socket.id
      };
      var friendSocketId = socketIds[0] === socket.id ? socketIds[1] : socketIds[0];
      var finishTime = finalTime[playerRoom[friendSocketId]].time;
      if ( finishTime.split(':').length > 1 ) {
        var newTime = finishTime.split(':');
        integerTime = Number(newTime[0] * 60) + Number(newTime[1]);
      } else {
        integerTime = Number(finishTime);
      }
      io.in(playerRoom[socket.id]).emit('gameoverlisten', finishTime);
      io.in(playerRoom[socket.id]).emit('timer', finishTime);
      io.in(playerRoom[socket.id]).emit('receiveFinalTime', finishTime);      

    }
    db.Leaderboard.create({
      username: finalTime[playerRoom[socket.id]].user,
      friend: finalTime[playerRoom[socket.id]].friend,
      time: integerTime,
      level: Number(roomLevel[playerRoom[socket.id]])
    }).then( function(data) {
      console.log('Saved : ', data);
    });
  });


  /*************************************************************************************************
   WebRTC Sockets
  *************************************************************************************************/
  socket.on('message', function(message) {
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });
  
  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on("changedToVideo", function(){
    socket.emit("roomName", playerRoom[socket.id]);
  });

  /*************************************************************************************************
   Testing Sockets
  *************************************************************************************************/

  // Send back number of users currently connected to server
  socket.on('numberOfUsers', function() {
    socket.emit('receiveNumberOfUsers', userCount);
  });

  /*************************************************************************************************
   Authentication Sockets 
  *************************************************************************************************/
  socket.on('signup', function(userInfo) {
    var username = userInfo.username;
    var password = userInfo.password;
    // Check whether username already exists
    db.User
        .findOne({
          where: {
            username: username
          }
        })
        .then(function (user) {
          bcrypt.genSalt(10, function (err2, salt) {
            if (user || err2) {
              // If user already exists, send error message back to user
              socket.emit('signupResponse', 'Username already exists');
            } else {
              // If username does not exist, then save username and hashed password
              bcrypt.hash(password, salt, function (err, hashedPassword) {
                db.User.create({
                  username: username,
                  password: hashedPassword
                })
              });
              usernames[socket.id] = username;
              usernames[username] = username;
              socket.emit('signupResponse', null);
              socket.emit('currentUser', username);
            }
          })
        });
  });
  socket.on('signin', function (userInfo) {
    var username = userInfo.username;
    var password = userInfo.password;
    // Check whether user already exists
    if (usernames[username]) {
      socket.emit("signinResponse", {message: "Youre already signed in"});
      return;
    }
    db.User
        .findOne({
          where: {
            username: username
          }
        })
        .then( function(user) {
          if ( !user ) {
            // If there is no such user, send error message back to user
            socket.emit('signinResponse', {message: 'user does not exist'});
          } else {
            // If user exists, then compare password
            bcrypt.compare(password, user.password, function(err, isAuthenticated) {
              if( err || !isAuthenticated) {
                // If there is database error or authentication failure, send error message back to user
                socket.emit('signinResponse', {message: "wrong password"});
              } else {
                // If authentication was successful, then send username back to user
                usernames[socket.id] = username;
                usernames[username] = username;
                socket.emit('signinResponse', {username: username});
                socket.emit('currentUser', username);
              }
            });
          }
        })
  });
  socket.on("getUsers", function(req) {
    db.User
        .findOne({
          where: {
            username: req
          }
        })
        .then(function (user) {
          if (!user) {
            socket.emit('users', {data: 'user does not exist'});
          } else {
            socket.emit('users', {data: user})
          }
        })

  });
});

/*************************************************************************************************
 Binary JS - Music Stream
 *************************************************************************************************/


// Listen for connection with client
binaryServer.on('connection', function(client) {
  // Save path to mp3 file in a variable
  var songFilePath = path.join(__dirname, '/songs/main.mp3');
  var jumpFilePath = path.join(__dirname, '/songs/jump.mp3');
  var shootFilePath = path.join(__dirname, '/songs/shoot.mp3');
  
  // Create file read streams
  var songStream = fs.createReadStream.call(this, songFilePath);
  var jumpStream = fs.createReadStream.call(this, jumpFilePath);
  var shootStream = fs.createReadStream.call(this, shootFilePath);

  // Send mp3 files to client
  client.send(songStream);
  client.send(jumpStream);
  client.send(shootStream);
});
