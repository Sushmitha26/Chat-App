const socket = io() //connect to server,set socket to function's return value,this allows to send and receive events from both server and client

//elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })//location.search->returns the location object's url query including ? Ex: "?username=Sushmitha&room=chat+room". Qs is from script included in chat.html file, qs.min.js

const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild //that's going to grab the last element as a child which would be the new message since new messages are added to the bottom.
    
    //height of new message
    const newMessageStyles = getComputedStyle($newMessage) //from this, we can get margin bottom spacing value
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin //this doesn't take into acct the margin, hence add it

    //visible height of screen
    const visibleHeight = $messages.offsetHeight

    //total height of content
    const contentHeight = $messages.scrollHeight

    //how far user has scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight //scrollTop gives amt of distance user has scrolled from the top

    /*we're doing this is becoz we want to figure out if the user is at the bottom before this message was added in.
    If we don't account for this we'll never be scrolled to the bottom because we're running this code just
    after adding the new message and the user would never get a chance to scroll down.
    So in this case we're just taking the new message out of the mix.
    So we're seeing if that content height is less than or equal to scroll offset.
    So we want to make sure that we were indeed at the bottom before the last message was added.*/
    if(contentHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight //this is going to push us to the bottom
    }  
}


//to receive event that server is sending to us
socket.on('message', (msgObj) => {
    console.log(msgObj)
    const html = Mustache.render(messageTemplate, {
        username: msgObj.username,
        message: msgObj.text, //passing data, msg is an object which has property 'text'
        createdAt: moment(msgObj.createdAt).format('h:mm a') //a stands for am/pm
    })

    $messages.insertAdjacentHTML('beforeend', html) //beforeend will add messages at the bottom inside div
    autoscroll()
})

socket.on('locationMessage', (urlObj) => {
    console.log(urlObj)
    const html = Mustache.render(locationTemplate, { 
        username: urlObj.username,
        url: urlObj.url,
        createdAt: moment(urlObj.createdAt).format('h:mm a') 
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    console.log(room, users)
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled') //disable, to prevent same msg being sent multiple times if u keep on clicking on send

    //const msg = document.querySelector('input').value
    const msg = e.target.elements.msg.value //e.target gives form
  
    socket.emit('sendMessage', msg, (acceptRejectMsg) => { //from client to server, the function will run when event is acknowledged from server
        $messageFormButton.removeAttribute('disabled') //enable
        $messageFormInput.value = ''
        $messageFormInput.focus() //move focus back to input box
        
        console.log(acceptRejectMsg)
    })
})


$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation)
        return alert('Geolocation is not supported by your browser')

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => { //get current position is indeed asynchronous it takes a little time to get the location but unfortunately it currently does not support the promised API so we can't use promises or async await.Instead we'll be calling this function passing to it a single callback function.
        const coords = {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }

        socket.emit('sendLocation', coords, (acceptRejectMsg) => {
            $sendLocationButton.removeAttribute('disabled') 
            console.log(acceptRejectMsg)
        })
    }) 
})

socket.emit('join', {username, room}, (error) => { //3rd argument is acknowledgement function after emitting event, that can be either error or no error
    if(error) {
        alert(error)
        location.href = '/'
    }
})


//server(emit) -> client(receive) - 'message' event --acknowledgement from client -> server
//client(emit) -> server(receive) - 'sendMessage' event --acknowledgement from server -> client

