var chatInfra = io.connect('/chat_infra');
var chatCom = io.connect('/chat_com');

var search = location.search.replace('?','');
var query = search.split("=");

if(query.length){
    chatInfra.emit('join_room', {'name':query[1]});
   
    chatInfra.on('name_set', function(data){
        chatInfra.emit('join_room', { 'name': query[1] });
        $('#nameform').hide();
        $('#messages').append('<div class="systemMessage">' + 'Hello '+data.name+'</div>');
    });
}

chatCom.on('message', function(data){
    data = JSON.parse(data);
    if(data.username){
        $('#messages').append('<div class="'+ 
            data.type + '"><span class="name">' +
            data.username + ":</span> " +
            data.message + '</div>');
    } else {
        $('#messages').append('<div class="'+data.type+'">' +
            data.message + '</div>');
    }
});

chatInfra.on('user_entered', function(user){
    $('#messages').append('<div class="systemMessage">' + user.name + ' has joined the room.' + '</div>');
});

$(function(){
    $('#send').click(function(){
        var data = {
            message: $('#message').val(),
            type:'userMessage' 
        };
        chatCom.send(JSON.stringify(data));
        $('#message').val('');
    });

    $('#setname').click(function() {
        chatInfra.emit("set_name", {name: $('#nickname').val()});
    });
});

