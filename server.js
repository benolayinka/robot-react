const express =  require('express')
const path = require('path')
const app = express()
const log = 'log.txt'
const winston = require('winston')

//logging
winston.add(new winston.transports.File({
  format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
  level:'info',
  filename: log
}))

winston.add(new winston.transports.Console({
  format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
  silent: false 
}))

//because of client side routing, send everything to index
app.use(express.static(path.join(__dirname, 'build')));
app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'), function(err) {
    if (err) {
      res.status(500).send(err)
    }
  })
})

//listen for http
const http_port = process.env.HTTP_PORT || 5000
app.listen(http_port, () =>
  console.log('Listening on port ' + http_port),
);

//listen for ws
const ws_port = process.env.WS_PORT || 5001
var io = require('socket.io')(ws_port);

const usersByRooms = {}

const socketTypes = {
    USER: 'user',
    ROBOT: 'robot',
}

io.on('connection', function (socket) {
  socket.user = {name: 'debug', uuid: 'debug'}
  socket.robot = {robot: 'debug'}

  socket.on('user connected', function(user) {
    winston.info('user connected: ' + user.name + ' uuid: ' + user.uuid)
    socket.type = socketTypes.USER
    socket.user = user
  })

  socket.on('robot connected', function(robot) {
    winston.info('robot connected: ' + robot.robot + ' video_port: ' + robot.video_port)
    socket.type = socketTypes.ROBOT
    socket.robot = robot
  })

  socket.on('join', function(room, fn){
    winston.info('room joined: ' + room)
    //ack
    fn('joined room: ' + room)

    if(socket.type===socketTypes.USER){
      //create object if it doesn't exist
      usersByRooms[room] = usersByRooms[room] || [];
      //add user
      usersByRooms[room].push(socket.user)
      //broadcast all rooms
      io.sockets.emit('users by rooms', usersByRooms)
    }
    
    socket.join(room)

    socket.on('message', function (message) {
      winston.silly(message)

      if(room==='debug'){
        io.sockets.emit('message', message)
      } else{
        socket.to(room).emit('message', message)
        //also send all messages to debug room
        socket.to('debug').emit('message', message)
      }
    });

    socket.on('disconnect', function() {
      if(socket.type===socketTypes.USER){
        var removeIndex = usersByRooms[room].map(function(item) { return item.uuid; })
                       .indexOf(socket.user.uuid);
        (removeIndex >= 0) && usersByRooms[room].splice(removeIndex, 1)
        io.sockets.emit('users by rooms', usersByRooms)
      }
    })
  })
});