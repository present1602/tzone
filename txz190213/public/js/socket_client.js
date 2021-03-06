console.log('socket_client.js 로드 시작');

if(!socket){   
    console.log("socket empty try connect")
    console.log('in socket_client.js io in !socket block : ', io);
    
    // socket = io.connect(clientBaseUrl);
    socket = io();
}

var chatlist = document.getElementById("chatlist");
function userLeave(){
    var cfm = confirm("참여를 취소하시겠습니까?");

    if(cfm){
        console.log('if 참여취소 confirm true 실행');
        if(!socket){
            console.log('if !socket 블록 실행');

            socket.open();
            // io.connect(clientBaseUrl)
        }
        console.log('if !socket 블록 아래 실행');

        var data = {"user_oid":userOid, "username":username, "post_oid":postOid, "chat_oid":chatOid};
        console.log("참여취소 - data : ", data)
        socket.emit('leave', data, function(response){
            console.log("leave event 전달, cb 실행 - response : ", response);

            if(response.is_success="success"){
                
                webDB.transaction(function (tx) {
                    var deleteSQL = 'DELETE FROM chat_history';
                    tx.executeSql(deleteSQL);
                });

                alert("방에서 퇴장하였습니다");
            
                $("#postJoinViewWrap").css("display", "none").html("");

                var postSum = document.getElementById("postJoinSum");
                postSum.parentNode.removeChild(postSum);

                localStorage.removeItem("chat_on")
                localStorage.removeItem("post_oid")
                
                var authToken = localStorage.getItem('x-access-token');
                if(authToken){
                    loadIndex(authToken);
                }
            }
        });    
    }else{
        return;
    }
};
socket.on('connect', function(){ //소켓 끊어졌다 재접속돼도 chatOnId변수값 남아있음
    console.log("socket connected, userOid : " + userOid + ', chatOid : ' + chatOid);
    
    webDB.transaction(function(tr){ //basic.js 나 다른 파일로 옮기기?
        var stat = 'create table if not exists ';
        //creted_at : type Date?
        stat += 'chat_history(room text, message text, sender_name text, sender_pic text, is_sender text, created_at text)';  
        tr.executeSql(stat, [], function(){
            console.log('테이블생성_sql 실행 성공'); 
        }, function(){
            alert('테이블생성_sql 실행 실패'); 
        });
      }, function(){ //에러 발생 시 호출할 메소드
          alert('테이블 생성 트랜잭션 실패...롤백은 자동');
      }, function(){ // 성공 시 호출할 메소드
        //   console.log('테이블 생성 트랜잭션 성공');
    });
    webDB.transaction(function(tr){
        tr.executeSql("select * from chat_history", [], function(tx, result){
            var conversation = result.rows;
            
            var printList = "";
            for(i=0; i<conversation.length; i++){
                var senderName = conversation[i].sender_name;
                var message = conversation[i].message;
                var createdAt = conversation[i].created_at;
                var profileImage = conversation[i].sender_pic;
                
                if(conversation[i].is_sender == "false"){
                    printList += '<li class="messageListItem">'
                    + '<div class="userInfo">'
                    + '<img class="profileImage" src="https://bucket-tz-20201021.s3.ap-northeast-2.amazonaws.com/profile/' + profileImage + '">'
                    + '<p class="senderName">' + senderName + '</p>'
                    + '</div>'
                    + '<div class="messageInfo">'
                    + '<p class="get_message">' + message +'</p>'
                    + '<p class="sent_at">' + processMessageDate(new Date(createdAt)) + '</p>'
                    + '</div>'
                    + '</li>'
                }else if(conversation[i].is_sender == "true"){
                    printList += "<li class='messageListItem'>"
                    + '<div class="echoMessageBox">'
                    + '<p class="my_message get_message">' + message + '</p>'
                    + '<p class="sent_at">' + processMessageDate(new Date(createdAt)) + '</p>'
                    + '</div>'
                    + '</li>'
                }
            }
            chatlist.innerHTML = printList;         
        }, function(tr, err){ 
            alert('DB오류 : ' + err.message + err.code);
        });  
    })
    
    socket.on('member_join', function(data){
        // data: {"linkedchat":chatId, "username":localStorage.getItem('username')}); 
        console.log('member join data : ', data);
        alert(data.username + "님이 참여했습니다");
        var countNode = document.getElementById("memberCount")
        var count = Number(countNode.textContent);
        count++;
        countNode.innerHTML = count;

        var postOid = data.linkedpost;
        var partiCountId = postOid + "_participant_count";
        var partiCount = document.getElementById(partiCountId);
        
        if( partiCount != null){
            var partiCountVal = partiCount.value;
            if( partiCountVal && Number(partiCountVal) ){
                var countUpdated = Number(partiCountVal) +1;          
                partiCount.value = countUpdated;
            }
        }

    })

    socket.on('member_leave', function(data){
        alert(data.username + "님이 참여를 취소하였습니다");
        var countNode = document.getElementById("memberCount")
        var count = Number(countNode.textContent);
        count--;
        countNode.innerHTML = count;
        var postOid = data.post_oid;
        var partiCountId = postOid + "_participant_count";
        var partiCount = document.getElementById(partiCountId);
        
        if( partiCount != null){
            var partiCountVal = partiCount.value;
            if(partiCountVal && Number(partiCountVal) && Number(partiCountVal) > 0){
                var countUpdated = Number(partiCountVal) -1;          
                partiCount.value = countUpdated;
            }else{
                alert('something wrong to participant count as user leave ')
            }
        }
        
    })
    if(chatOid && postOid){
        console.log("if(chatOid) && postOid -> true 구문 실행"); 
        socket.emit('participantConnedted', {"user_oid":userOid, "chat_oid":chatOid});
    }
     
    
    socket.on('message', function(data){
        console.log('메세지 전송 받음 - jstr data : ' + JSON.stringify(data));
        console.log("data.senderPicFilename : " + data.senderPicFilename);
        var room = data.room;
        var message = data.content;
        var senderName = data.senderName; //sender Id
        var senderPic = data.senderPicFilename;
        var createdAt = new Date(data.createdAt);
        var processDate = processMessageDate(createdAt);

        var printMessage = '<li class="messageListItem">';
        printMessage += '<div class="userInfo">'
        //    + '<img class="profileImage" src="uploads/' + senderPic + '">' 
           + '<img class="profileImage" src="https://bucket-tz-20201021.s3.ap-northeast-2.amazonaws.com/profile/' + senderPic + '">' 
           + '<p class="senderName">' + senderName + '</p>'
           + '</div>'
           + '<div class="messageInfo">'
           + '<p class="get_message">' + message + '</p>'
           + '<p class="sent_at">' + processDate + '</p>'
           + '</li>'
        
        chatlist.insertAdjacentHTML('beforeend', printMessage);
        
        var newMessageNumber  = document.getElementById("newMessageNumber");
        // debugger;

        if(newMessageNumber.value == 0 && history.state.page != "chat"){
            newMessageNumber.value++;
            newMessageNumber.className += "active";
        }else if(history.state.page != "chat"){
            newMessageNumber.value++;
        }


        webDB.transaction(function(tr){
            console.log("전송받은 메세지 저장 위한 transaction 콜백 실행");
            var insertSQL = 'insert into chat_history'
                + '(room, message, sender_name, sender_pic, is_sender, created_at) values(?, ?, ?, ?, ?, ?)';
            tr.executeSql(insertSQL, [room, message, senderName, senderPic, false, createdAt], function(tr, rs){
                console.log('채팅 저장 rs.insertId : ' + rs.insertId); 
            }, function(tr, err){ 
                alert('DB오류 : ' + err.message + err.code);
            });    
        }); 
        

        
    });
});



socket.on('disconnect', function(reason){
    console.log('소켓 종료, socket.id : ', socket.id);
    console.log("reason : ", reason)
    // socket.open();

    // socket = io.connect(clientBaseUrl);

    //추가2) emit('participantDisconnect', ...)
    // if(chatOid){
    //     socket.emit('participantDisconnect', {chat_oid:chatOid, user_oid:userOid})
    // }
});
function sendMessage(){
    console.log('sendMessage 버튼 클릭');
    var messageInput = document.getElementById("messageInput").value;
    if(messageInput ==""){
        alert("메세지를 입력해주세요")
    }
    if(socket == undefined){  //socket 객체 쓰는 socket_client.js 로
        alert('소켓에 연결되어 있지 않습니다'); 
        return; 
    }else{
        console.log('소켓 연결상태, 메세지보내기 버튼 클릭 messageInput : ', messageInput);
        
        var output = {
            content:messageInput, room:chatOid, senderName:username, senderOid:userOid
        };
        
        console.log("message emit 바로 위, str??output : " + JSON.stringify(output));
    
        socket.emit('message', output, function(response){
            console.log('message emit cb 실행 - jstr response : ' + JSON.stringify(response));
           
            if(response.is_success == "success"){ 
                var sentAt = new Date();
                var processDate = processMessageDate(sentAt);
                var echoMessage = ""
                echoMessage += "<li class='messageListItem'>"
                    + '<div class="echoMessageBox">'
                    + '<p class="my_message get_message">' + messageInput + '</p>'
                    + '<p class="sent_at">' + processDate + '</p>'
                    + '</div>'
                    + '</li>'
                
                    
                chatlist.insertAdjacentHTML('beforeend', echoMessage);
                
                webDB.transaction(function(tr){
                    console.log("echoMessage 저장 위한 sqldb.transaction 콜백 실행");
                    
                    var insertSQL = 'insert into chat_history(room, message, is_sender, created_at) values(?, ?, ?, ?)';
                    tr.executeSql(insertSQL, [chatOid, messageInput, true, sentAt], function(tr, rs){
                        console.log('3_채팅 저장 rs.insertId : ' + rs.insertId); 
                    }, function(tr, err){ 
                        alert('DB오류 : ' + err.message + err.code);
                    });    
                });
                   


// db.transaction(function (tx) {
//     var stat = 'select * from chat_history';
//     executeSql(insertSQL, [chatOid, messageInput, true, sentAt], function(tr, rs){
//         console.log('3_채팅 저장 rs.insertId : ' + rs.insertId); 
//     }, function(tr, err){ 
//         alert('DB오류 : ' + err.message + err.code);
//     }); 
// });


            }else{
                //전송실패 메세지 삭제 & 재전송 버튼 처리
                console.log('socket emit response 못받음');
            }
        
        });
    } 
}

function processMessageDate(rawDate){
    var dateProcessed = [];
    var day;
    var month = rawDate.getMonth()
    var date = rawDate.getDate()
    var hour = rawDate.getHours()

    var curDate = new Date();
    var curMonth = curDate.getMonth(); 
    var curDate = curDate.getDate();

    if(month == curMonth && date == curDate){
        day = "오늘"
    }else if(month == curMonth && date == (curDate-1) ){
        day = "어제"
    }else{
        day = (month+1) + '월 ' + date + '일';
    }
    if (hour > 12) {
        hour = "오후 " + (hour-12) +"시";
    } else if (hour === 0) {
        hour = "오후 12시";
    }else{
        hour = "오전 " + hour + "시"; 
    }
    var min = rawDate.getMinutes() + "분";    
    
    dateProcessed.push(day, hour, min);
    dateProcessed = dateProcessed.join(" ");   
    return dateProcessed;

}


// 참고 
// https://github.com/moment/moment-timezone/issues/309
// moment(1493092800000).toDate() 
// or moment.utc(1493092800000).toDate(). 
// It's all the same as just new Date(1493092800000).
