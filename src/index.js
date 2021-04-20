const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users') 

const app = express() //create new express application and get it configured
//all we've done is we've created the server outside of the Express library, we're creating it ourself
//and configuring it to use our Express app then we are starting it up using server.listen()
const server = http.createServer(app) //create a new web server and we're going to pass to it our Express application.
//this is why we had to do the refactoring of creating http server, socketIO expects it to be called with the 
//raw HTTP server.Now when express creates that behind the scenes we don't have access to it to pass it in right here.
//That's why we've created it on our own.
const io = socketio(server) //new instance of socket.io to configure web sockets to work with our server

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// if I have five clients connecting to the server this function is going to run five different times one time for each new connection.
io.on('connection', (socket) => { //listening for given event to occur(when socket.io server gets new connection from client)  
    console.log('new socket connection') //socket is an object that contains info abt new connection

    socket.on('join', (options, callback) => { //instead of {username, room}, options is used
        const {error, user} = addUser({ id: socket.id, ...options }) //socket object has unique identifier for that particular connection, either error or user will be returned
        
        if(error) {
            return callback(error)
        }

        socket.join(user.room) //allows to join mentioned chat room, this gives access to specifically emit events to just that room
        
        socket.emit('message', generateMessage('Admin', 'Welcome!')) //send an event from server and receive on client,atleast one parameter i.e name of event shd be there(built in one is 'connection'), count will be passed as argument to client
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`)) //when we broadcst an event, we send it to everybody except the current client i.e except this particular socket from which emit occurs
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (msg, callback) => { //listen for an event sent by client, event names shd be same both in server and client
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(msg)) 
            return callback('Profanity is not allowed')

        //socket.emit('countUpdated', count) //send back to client, when we use socket.emit we are emitting the event to a particular connection, to that particular socket,but in this case,We don't want to limit it to just a single connection.I want to emit it to every connection available.
        io.to(user.room).emit('message', generateMessage(user.username, msg)) //this emits event for al connections, not just for single one
        callback('Message Delivered!') //this is acknowledgement function
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.lat},${coords.long}`))
        callback('Location shared!')
    })

    socket.on('disconnect', () => { //disconnect is a built in event like connection up above
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`)) //no need of boradcast as the current client has already left
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }



    })
})

server.listen(port, () => { //starts the http server
    console.log(`server is up on port ${port}`)
})

//socket.emit -> emits an event to a particular client
//io.emit -> emits an event to all client
//socket.broadcast.emit -> emits an event to everybody except for current client who sent that msg
//io.to.emit -> emits an event to everyboody in a specific room
//socket.broadcast.to.emit -> emits an event to everybody in a specific room except for current client who sent that msg
 
