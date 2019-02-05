const io = require('socket.io')();
io.origins('*:*');

let serverState = new Map([
    [1, { status: 'free', tableValues: Array(9).fill(null), isXNext: true}],
    [2, { status: 'free', tableValues: Array(9).fill(null), isXNext: true}],
    [3, { status: 'free', tableValues: Array(9).fill(null), isXNext: true}],
    [4, { status: 'free', tableValues: Array(9).fill(null), isXNext: true}],
    [5, { status: 'free', tableValues: Array(9).fill(null), isXNext: true}],
    [6, { status: 'free', tableValues: Array(9).fill(null), isXNext: true}],
    [7, { status: 'free', tableValues: Array(9).fill(null), isXNext: true}],
    [8, { status: 'free', tableValues: Array(9).fill(null), isXNext: true}]
]);

io.on('connection', (client) => {
    // client.on('hostGame', (gameKey) => {
    //     client.join(gameKey);
    // });

    client.on('gameSetup', (obj) => {    //After pressing the modal accordingly -- argument Obj should have the game room ID and role of the client
       client.join(obj.gameKey);
       if (obj.role === 'host') {
           serverState.get(obj.gameKey).status = 'hosted';
       } else if (obj.role === 'tenant') {
           serverState.get(obj.gameKey).status = 'busy';
       }
       client.emit('setTableValues', {values: serverState.get(obj.gameKey).tableValues, isXNext: serverState.get(obj.gameKey).isXNext});
    });

    client.on('leaveGame', (obj) => {
       let key = obj.gameKey, role = obj.gameRole;
       if(role === 'host' || role === 'tenant') {
           io.sockets.to(key).emit('endGame', key);
           serverState.get(key).tableValues = Array(9).fill(null);
           serverState.get(key).status = 'free';
           serverState.get(key).isXNext = true;
       } else {
           client.emit('endGame', role);
       }
    });

    client.on('leaveRoom', (prevGameKey) => {
        client.leave(prevGameKey);
    });
    // client.on('viewGame', (gameKey) => {
    //     client.join(gameKey);
    //     client.emit('setTableValues', tableValues.get(gameKey));
    // });

    client.on('updateTableValues', (data) => {
        let key = data.gameKey, array = data.arrayValues.slice(), role = data.gameRole;
        console.log(key, role, array);
        serverState.get(key).tableValues = array;
        serverState.get(key).isXNext = role !== 'host';
        io.sockets.to(key).emit('setTableValues', {values: array, isXNext: serverState.get(key).isXNext}); //This is a broadcast message
    });


    client.on('getGameRoomsStatus', (role) => {
        let rooms = [];
        if (role === 'host')
        {
            serverState.forEach(function(value, key, map) {
                if(value.status === 'free')
                    rooms.push(key);
            });
        }
        else if (role === 'tenant')
        {
            serverState.forEach(function(value, key, map) {
                if(value.status === 'hosted')
                    rooms.push(key);
            });
        }
        else if (role === 'viewer')
        {
            serverState.forEach(function(value, key, map) {
                if(value.status === 'busy')
                    rooms.push(key);
            });
        }
        client.emit('setGameRoomsStatus', {
            role: role,
            arrayValues: rooms
        })
    });
});

// let tableValues = Array(9).fill(null);
//
// io.on('connection', (client) => {
//     client.emit('setTableValues', tableValues);
//
//     client.on('updateTableValues', (newValues) => {
//         console.log(newValues);
//         tableValues = newValues.slice();
//         client.broadcast.emit('setTableValues', tableValues); //This is a broadcast message
//     });
// });

const port = 8000;
io.listen(port);
console.log('listening on port ', port);
