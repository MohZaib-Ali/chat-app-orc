const socket = io()

const msgForm = document.querySelector('#msg-form')
const msgFormInput = msgForm.querySelector('input')
const msgFormButton = msgForm.querySelector('button')
const sendLocationButton = document.querySelector('#send-location')
const msgs = document.querySelector('#msgs')

const msgTemplate = document.querySelector('#msg-template').innerHTML
const locationmsgTemplate = document.querySelector('#location-msg-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const newmsg = msgs.lastElementChild

    const newmsgStyles = getComputedStyle(newmsg)
    const newmsgMargin = parseInt(newmsgStyles.marginBottom)
    const newmsgHeight = newmsg.offsetHeight + newmsgMargin

    const visibleHeight = msgs.offsetHeight

    const containerHeight = msgs.scrollHeight

    const scrollOffset = msgs.scrollTop + visibleHeight

    if (containerHeight - newmsgHeight <= scrollOffset) {
        msgs.scrollTop = msgs.scrollHeight
    }
}

socket.on('msg', (msg) => {
    console.log(msg)
    const html = Mustache.render(msgTemplate, {
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    msgs.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationmsg', (msg) => {
    console.log(msg)
    const html = Mustache.render(locationmsgTemplate, {
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    msgs.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

msgForm.addEventListener('submit', (e) => {
    e.preventDefault()

    msgFormButton.setAttribute('disabled', 'disabled')

    const msg = e.target.elements.msg.value

    socket.emit('sendmsg', msg, (error) => {
        msgFormButton.removeAttribute('disabled')
        msgFormInput.value = ''
        msgFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('msg delivered!')
    })
})

sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')  
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})