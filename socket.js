let socket_io = require("socket.io");
var cookieparser = require("cookie-parser");

exports.initialize = function(server) {

    const io = socket_io.listen(server);
    io.use(((middleware) => {
        return (socket, next) => {
            middleware(socket.request, socket.request.res, next);
        };
    })(cookieparser()));

    io.set('authorization', function(data, accept){
        var cookies = data.headers.cookie;
        if(cookies){
           data.nickname = cookies['nickname'];
        } else {
            return accept('No cookie transmitted.', false);
        }
        accept(null, true);
    });

    this.chatInfra = io.of("/chat_infra");
    this.chatInfra.on("connection", (socket) => { 
        socket.on('set_name', (data) => {
            socket.nickname = data.name;
            socket.emit('name_set', data);
            socket.send(JSON.stringify({type:'serverMessage', message: 'Welcome to the most interesting chat room on earth!.'}));
            socket.broadcast.emit('user_entered', data);
        });

        socket.on("join_room", (room) => {
            var nickname = socket.handshake.nickname;
            socket.join(nickname);
            socket.nickname = nickname;
            // socket.emit('name_set', { name: nickname });
            // socket.send(JSON.stringify({type:'serverMessage',
            //     message:'Welcome to the most interesting ' +
            //     'chat room on earth!'}));
            const current_com_socket_id = `/chat_com#${socket.id.split('#')[1]}`;
            const current_com_socket = this.chatCom.sockets[current_com_socket_id];
            current_com_socket.join(nickname);
            current_com_socket.room = nickname;
            socket.in(nickname).broadcast.emit('user_entered', {'name': socket.nickname});
        });

        socket.on('get_rooms', () => {
            var rooms = {};
            for(let room in socket.adapter.rooms){
                if(room.indexOf('/') < 0){
                    rooms[room] = socket.adapter.rooms[room];
                }                
            } 
            socket.emit('rooms_list', rooms);
        });
    });

    this.chatCom = io.of("/chat_com");
    this.chatCom.on("connection", (socket) => { 
        socket.on("message", (message => {
            message = JSON.parse(message);
            if(message.type == "userMessage"){
                message.username = socket.nickname;
                socket.in(socket.room).broadcast.send(JSON.stringify(message));
                // socket.broadcast.send(JSON.stringify(message));
                message.type = "myMessage";
                socket.send(JSON.stringify(message));
            }
        }));
    });
}