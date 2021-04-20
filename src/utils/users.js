const users = []

const addUser = ({ id, username, room }) => {
    //clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //validate data
    if(!username || !room) {
        return {
            error: 'username and room are required!'
        }
    }

    //check for existing user 
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username //First up this user needs to be in the same room the new person trying to join.Next,if I'm joining South Philly room and my username is already taken I should not be able to join right here.
    })

    //validate user
    if(existingUser) {
        return {
            error: 'Username already taken!'
        }
    }

    //store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id
    })

    if(index != -1)
        return users.splice(index, 1)[0]  //remove an item from an array by its index, here we remove an item, we get back an array, we then extract the individual item which is the user object of the user that was removed and that gets returned.
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}

