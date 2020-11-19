var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var multer = require('multer');
var bodyParser = require('body-parser');
var static = require('serve-static');
var fs = require('fs');
var morgan = require('morgan');
var jwt = require('jsonwebtoken');
var app = express();
var passport = require('passport');
var jwt = require('jsonwebtoken');
var LocalStrategy = require('passport-local').Strategy;
var socketio = require('socket.io');
const AWS = require('aws-sdk');

const { v4: uuidv4 } = require('uuid');
const configData = require('./config');
require('dotenv/config')

process.env.NODE_ENV = process.env.NODE_ENV && (process.env.NODE_ENV == 'production') ? 'production' : 'development';

// const multerS3 = require('multer-s3');
// region: 'ap-northeast-2'

// AWS.config.update({
// 	accessKeyId : process.env.AWS_ID,
//     secretAccessKey : process.env.AWS_SECRET,
// });

// console.log("process.env.AWS_ID : ", process.env.AWS_ID);
// console.log("process.env.AWS_SECRET : ", process.env.AWS_SECRET);
// console.log("process.env.AWS_BUCKET_NAME : ", process.env.AWS_BUCKET_NAME);


AWS.config.loadFromPath('./awsconfig.json');
var s3 = new AWS.S3(); 

// console.log("s3 init : ", s3)

function getServerIp() {

    var os = require('os');
    var ifaces = os.networkInterfaces();
    var values = Object.keys(ifaces).map(function (name) {
        return ifaces[name];
    });
    values = [].concat.apply([], values).filter(function (val) {
        return val.family == 'IPv4' && val.internal == false;
    });

    return values.length ? values[0].address : '0.0.0.0';
}

const localIp = getServerIp()
console.log("localIp : ", localIp);


app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));
app.use(passport.initialize());

/* 
이미지 로컬 upload 시
var storage = multer.memoryStorage({
    destination : function(req, file, callback){
        callback(null, 'public/uploads')
    },
    filename : function(req, file, callback){
        callback(null, Date.now()+file.originalname )  //date.now 앞으로 뺌 이미지확장자가 뒤로 와야될것 같아서
    }
});
*/

var storage = multer.memoryStorage({
    destination: function (req, file, callback) {
        callback(null, '')
    },
});
var upload = multer({
    storage: storage
});

/* 
multerS3 모듈 사용 시 
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME, // 버킷 이름
        contentType: multerS3.AUTO_CONTENT_TYPE, // 자동을 콘텐츠 타입 세팅
        acl: 'public-read-write', // 클라이언트에서 자유롭게 가용하기 위함
        key: (req, file, cb) => {
            console.log(file);
            cb(null, file.originalname)
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 용량 제한
});
*/






/*
const upload = multer(
    { dest: 'uploads/', 
     limits: { fileSize: 5 * 1024 * 1024 } 
    }
);

var upload = multer({
    storage : multer.diskStorage({
        destination : function(req, file, callback){
            callback(null, 'public/uploads')
        },
        filename : function(req, file, callback){
            callback(null, Date.now()+file.originalname )  //date.now 앞으로 뺌 이미지확장자가 뒤로 와야될것 같아서
        }
    })
})
*/

/*
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });
문제: uploads 폴더에 뭔가 생성이 되긴 하는데 이름도 ce243370b74107493fea0743d249a176처럼 이상하게 바뀌어있고 확장자도 붙어 있지 않음
보안상 의도된 것이지만 지금은 불편
이름이 원래대로 나오게 해보겠습니다. 
dest 속성 대신 storage 속성을 사용해 upload 변수에 넣어주면 됩니다.

S3같은 곳에 업로드하는 방법은 두가지,
디스크에 있는 파일을 업로드하거나 / 파일 버퍼(메모리에 저장)를 업로드
파일을 S3에 업로드한 후에는 남아있는 파일을 지워줘야 하는데 이게 번거로움
그래서 처음부터 메모리에 파일을 버퍼 형식으로 저장하고, 그것을 업로드

const upload = multer({
  storage: multer.memoryStorage(),
});

메모리스토리지를 쓸 경우 
req.file이나 req.files 안의 파일 데이터(객체)에, 
디스크스토리지 전용 속성인 destination, filename, path 대신 
buffer라는 속성이 새로 생기고 그 값으로 버퍼들이 저장됩
이 버퍼를 사용해서 S3에 버퍼로 업로드하면 됨
이 방식의 단점은 파일이 여러 개고, 용량이 너무 크면 메모리를 초과해서 서버가 멈춰버릴 수도 있음
이러한 문제가 걱정되고, 버퍼를 다루는 게 어렵다면 
multer-s3 패키지를 고려해보세요

https://www.zerocho.com/category/NodeJS/post/5950a6c4f7934c001894ea83
*/


var User = require('./models/usermodel');
var Post = require('./models/postmodel');
var Chat = require('./models/chatmodel');

var routeUser = require('./router/user');
var routePost = require('./router/post');


function connectDB() {

    console.log("process.env.NODE_ENV : ", process.env.NODE_ENV);
    console.log("process.env.PORT : ", process.env.PORT);


    var databaseUrl = `mongodb://${configData.dbuser}:${configData.dbpw}@${configData.mlab_db}`;
    mongoose.Promise = global.Promise;
    mongoose.connect(databaseUrl, { useNewUrlParser: true, useUnifiedTopology: true });

    database = mongoose.connection;

    database.on('error', console.error.bind(console, 'mongoose connection error.'));
    database.on('open', function () {
        console.log('데이터베이스에 연결되었습니다 ');

        routeUser.init(User);
        routePost.init(Post, User);

        socketEvents();

    });
    database.on('disconnected', function () {
        console.log('연결이 끊어졌습니다 ');
    });
}


app.get('/favicon.ico', (req, res) => res.sendStatus(204));

app.post('/loadpost', routePost.loadpost);
app.post('/posting', routePost.posting);

app.get('/auth_phone', function (req, res) {
    res.render('auth_phone');
});

app.post('/auth_phone', function (req, res) {
    res.render('signup')
    // var phone = req.body.phone_input;
    // var authNum = req.body.phone_auth_num;
    // if(authNum=='1234'){
    //     res.render('signup', {data:phone});
    // }else{
    //     res.send("<h3>인증번호가 틀렸습니다</h3>");
    // }
});

app.get('/signup', function (req, res) {
    res.render('signup')
});
app.get('/posting', isAuthenticated, function (req, res) {
    res.render('posting');
});

app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', routeUser.login);
app.post('/signup', upload.array('profile_image', 1), function (req, res) {
    console.log("post /signup")

    passport.authenticate('local-signup', { session: false }, function (err, user) {
        if (err) throw err;
        if (user) {
            console.log("user : ", user);
            res.render('login');
        }
    })(req, res);
});

app.get('/index', isAuthenticated, function (req, res) {
    res.render('index');
});

// app.post('/showposts', routePost.showposts);
app.post('/showposts', routePost.showposts);

app.get('/postlist/join', function (req, res) {
    // var postOid = req.params.id;
    var postOid = req.query.post_oid;
    var userObjId = req.query.user_oid;
    console.log("GET /postlist/join,  req.query.post : " + req.query.post);

    Post.findOne({ "_id": postOid }, function (err, post) {
        if (err) throw err;
        if (post) {
            console.log('participant_count 변경 위한 포스트 문서 조회 성공');
            console.log('post.participant_count : ' + post.participant_count);
            var dbCount = post.participant_count;   //post.
            dbCount = dbCount + 1;
            post.participant_count = dbCount;
            Chat.find({ "linkedpost": postOid }, function (err, chatResult) {
                console.log("chatResult.length : " + chatResult.length);
                // console.log("chatResult[0]._doc.message : " + chatResult[0]._doc.message); //undefined
                console.log("dir chatResult[0]._doc");
                // console.dir(chatResult[0]._doc);  // 출력됨

                if (err) throw err;
                chatResult[0].participants.push({ "user": userObjId });
                chatResult[0].save();
            });

            post.save(function (err) {

                console.log(post);
                if (err) throw err;

                res.send(post);
                // res.send({"post":post, "chat":chat}) 둘다 보내기?
                // chat doc에 linkedpost:postobject아이디 저장. 
                //반대로 post에 push로 linkedchat:chatobjectId 저장해버림?
            });
        } else {
            console.log("post objectId로 조회한 결과문서 없음")
        }
    });
});



function isAuthenticated(req, res, next) {   //질문 req.isAuthenticated() 정의 안해도 사용 가능 -> 세션 false로 한 경우에도?
    console.log('isAuthenticated 실행');

    var accessToken = req.headers['x-access-token'];
    if (!accessToken || !(accessToken.search('Bearer ') === 0)) {
        // return next(new Error('401 Missing x-access-token'));   //next함수로 넘어가는게 아니라 에러를 강제 발생시켜서 프로그램 종료하고 콘솔에만 출력?  //질문
        throw next(new Error("Missing x-access-token")); //질문 ??
        res.redirect('/login');
    }
    var token = accessToken.split(' ')[1];
    if (!token) {
        return next(new Error('401 Missing Bearer Token'));
        // console.log('401 Missing Bearer Token');
        // res.redirect('/login');
    }

    var authenticated = jwt.verify(token, 'abc123');
    if (authenticated) {
        console.log('authenticated OK');
        return next();
    }
}

passport.use('local-signup', new LocalStrategy(
    {   //new Local..{} 인증방식을 정의한 객체
        usernameField: 'phone'
        , passwordField: 'password'
        , passReqToCallback: true
    },
    function (req, phone, password, done) {
        console.log("LocalStrategy 내 function 실행");


        User.findOne({ 'phone': phone }, function (err, user) {
            if (err) { return done(err); }
            if (user) {
                console.log('계정 이미 있음');
                return done(null, false);
            }


            console.log("req.files[0] : ", req.files[0]);

            var phone = req.body.phone;
            var password = req.body.password;
            var name = req.body.username;
            var gender = req.body.gender;
            var email = req.body.email;
            var user = new User({
                'phone': phone, 'hashed_password': password,
                'name': name, 'gender': gender, 'email': email
            });
            var profileFile = req.files[0];

            if (profileFile) {
                // var filename = email.substr(0, 4) + phone.substr(phone.length-4, phone.length) +".png";

                let myFile = profileFile.originalname.split(".")
                const fileType = myFile[myFile.length - 1]
                const getFilename = phone.substr(3, phone.length);
                const filename = `${getFilename}-${uuidv4().substring(0, 4)}.${fileType}`;
                user.proflie_image.filename = filename

                console.log("filename : ", filename)
                user.proflie_image.filename = filename;
                // console.log("process.env.AWS_BUCKET_NAME : ", process.env.AWS_BUCKET_NAME)


                // console.log("s3 below : ", s3);
                // s3.config.region = 'a--1';

                const params = {
                    'Bucket': process.env.AWS_BUCKET_NAME,
                    'Key': filename,
                    'ACL': 'public-read',
                    'Body': req.files[0].buffer,
                    'ContentType': `image/${fileType}`
                }
                // region: 'ap-northeast-2'
                s3.upload(params, (err, data) => {
                    if (err) {
                        console.log("err while s3 upload, err : ", err);
                    }
                    console.log("image file s3 upload success, data : ", data);
                })
            }

            user.save(function (err) {
                if (err) { throw err };
                console.log("사용자 데이터 추가함.");
                return done(null, user);
            });


            // originalname, fieldname(input name val), encoding(7bit), mimeType(image/name.png), buffer, size

            /* 
            var phone = req.body.phone;
            var password = req.body.password;
            var name = req.body.username;
            var gender = req.body.gender;
            var email = req.body.email;
            // var profileImage = req.files[0];

            // req.body.profileImageData.value='' = canvas.toDataURL("image/png")
            var profileImageData = req.body.profileImageData;  
            var user = new User({'phone':phone, 'hashed_password':password, 
                'name':name, 'gender':gender, 'email':email});
            if(profileImageData){
                var filename = email.substr(0, 4) + phone.substr(phone.length-4, phone.length) +".png";
                console.log("filename : ", filename)
                var imageBuffer = decodeBase64Image(profileImageData);
                var filepath = "public/uploads/" + filename ;
    
                fs.writeFileSync(filepath, imageBuffer.data);

                user.proflie_image.data =  fs.readFileSync(filepath);
                user.proflie_image.contentType= imageBuffer.type;
                user.proflie_image.path = filepath;
                user.proflie_image.filename = filename; 
            }
            user.save(function(err){
                if(err){throw err};
                console.log("사용자 데이터 추가함.");
                return done(null, user);  
            });
            function decodeBase64Image(dataString) {
                console.log("typeof dataString  String?");
                console.log(typeof dataString);  
            
                var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                var response = {};
                if (matches.length !== 3) {
                    return new Error('Invalid input string');
                }
                response.type = matches[1];
                response.data = new Buffer(matches[2], 'base64');
                return response;
            }
            */
        });
    })
);

var server = app.listen(3000, function () {
    console.log('Server Run....3000');
    connectDB();
});

var io = socketio.listen(server);


function socketEvents() {
    io.sockets.on('connection', function (socket) {
        socket.remoteAddress = socket.request.connection._peername.address;
        socket.remotePort = socket.request.connection._peername.port;

        socket.on('disconnect', function (reason) {
            console.log("(server) socket disconnect event, socket.id : ", socket.id)
        })
        console.log('socket.id :', socket.id, ', connection info :', socket.request.connection._peername);
        // 소켓 객체에 클라이언트 Host, Port 정보 속성으로 추가 
        // Client : socket.emit('participantDisconnect', {chat_oid:chatOid, user_oid:userOid})
        socket.on("participantDisconnect", function (data) {
            console.log("(server) 소켓 on participantDisconnect 이벤트")

        })

        app.post('/createchat', function (req, res) { // ajax 호출 - data:{'post':postObjId, 'user':writer}
            console.log('(app.js)POST /createchat 함수 실행');
            console.log('json str req.body : ' + JSON.stringify(req.body));
            var user = req.body.user;
            var post = req.body.post;
            var newChat = new Chat({ "linkedpost": post });
            newChat.participants.push({ "user": user, "is_writer": true });

            newChat.save(function (err) {
                console.log('db에 채팅방 저장');
                if (err) throw err;
                var chat_oid = newChat._id;
                Post.findOne({ "_id": post }, function (err, post) {
                    if (err) throw err;
                    post.linkedchat = chat_oid;
                    post.save(function (err) {
                        if (err) throw err;
                        console.log("before /createchat - socket.join room ");
                        console.log("socket.id : " + socket.id);
                        console.log("[console.dir] - io.sockets.adapter.rooms :  ");
                        console.dir(io.sockets.adapter.rooms);

                        socket.join(chat_oid);

                        console.log("after /createchat - socket.join room ");
                        console.log("[console.dir] - io.sockets.adapter.rooms :  ");
                        console.dir(io.sockets.adapter.rooms);
                        console.log("[console.dir] - io.sockets.adapter.rooms[newChat._id] :  ");
                        console.dir(io.sockets.adapter.rooms[newChat._id]);
                        //그 다음??
                    });
                });

                res.send({ "chat_oid": chat_oid });
            });
        });

        socket.on('participantConnedted', function (data) {
            // data from client : {"user_oid":userOid, "chat_oid":chatOid}
            console.log('(server) participantConnedted socket E - 채팅방 참여중인 사용자 socket 끊어진 후 재접속');
            // console.dir(data);
            console.log('(server) before command JOIN dir io.sockets.adapter.rooms : ')
            console.log('socket.id : ' + socket.id);
            socket.join(data.chat_oid);

            console.log('after command JOIN dir io.sockets.adapter.rooms : ')
            console.dir(io.sockets.adapter.rooms);
        });

        socket.on('message', function (data, callback) {
            // content:messageInput, room:chatOnId, senderName:username, senderOid:userObjId
            console.log("(server) message 이벤트 on jstr data : " + JSON.stringify(data));
            var responseData = data;
            responseData.createdAt = Date.now();

            User.findOne({ _id: responseData.senderOid }, function (err, user) {   //룸 아이디 client emit('message' 시 넘겨 받기
                if (err) throw err;
                responseData.senderPicFilename = user.proflie_image.filename;
                socket.to(responseData.room).emit('message', responseData);

                Chat.findOne({ _id: data.room }, function (err, chatroom) {
                    if (err) throw err;
                    chatroom.contents.push({
                        sender: data.senderOid, text: data.content
                    });

                    chatroom.save();
                });
                console.log("(server) after msg send, [console.dir] - io.sockets.adapter.rooms :  ");
                console.dir(io.sockets.adapter.rooms);

                callback({ "is_success": "success" });
            });
        });



        // Client : socket.emit('join', {"linkedchat":chatId, "username":localStorage.getItem('username')}); 
        socket.on('join', function (data) {
            console.log('(server) 클라이언트로부터 join 이벤트 받음');
            console.log('jstr data : ' + JSON.stringify(data));
            console.log('before join dir io.sockets.adapter.rooms : ')
            console.dir(io.sockets.adapter.rooms);
            socket.join(data.linkedchat);
            socket.to(data.linkedchat).emit('member_join', data);
            console.log('after join dir io.sockets.adapter.rooms : ')
            console.dir(io.sockets.adapter.rooms);
        });

        socket.on('leave', function (data, callback) {

            //(From client) var data = {"user_oid":uoid, "username":uname, "post_oid":poid, "chat_oid":coid};
            console.log('(server) get socket leave event, data : ', data)
            socket.to(data.chat_oid).emit('member_leave', data)

            // Post.findOneAndUpdate({"_id": data.post_oid}, {$set:{name:"Naomi"}}, {new: true}, (err, doc) => {
            //     if (err) {
            //         console.log("Something wrong when updating data!");
            //     }
            
            //     console.log(doc);
            // });

            Post.findOne({ "_id": data.post_oid }).select("participant_count").exec(function (err, post) {
                if (err) throw err;
                var partiCount = post.participant_count

                console.log("member leave - partiCount : " + partiCount)
                if (partiCount > 1) {
                    console.log("member leave - partiCount > 1 ")

                    partiCount = partiCount - 1;
                    Post.findOneAndUpdate({ "_id": data.post_oid}, {$set:{participant_count:partiCount}}, (err, doc) => {
                        if (err) {
                            console.log("participant count update err ", err);
                        }
                        console.log("findAndUpdate doc : ", doc);         
                    })
                    
                } else if (partiCount == 1) {
                    Post.findOne({ "_id": data.post_oid }).remove().exec();
                }
                console.log("member leave - updated partiCount : " + partiCount)
            })
            Chat.findOne({ "_id": data.chat_oid }).select("participants").exec(function (err, chat) {
                if (err) throw err;
                console.log('before chat.participants : ', chat.participants)
                var getIdx = chat.participants.findIndex(function (participant) {
                    return participant.user == data.user_oid;
                })

                console.log("getIdx : ", getIdx);
                chat.participants.splice(getIdx, 1);
                console.log('after chat.participants : ', chat.participants)
                chat.save()
            })
            Chat.update({ "_id": data.chat_oid }, { $pull: { participants: data.user_oid } })

            callback({ "is_success": "success" })
            // });
        });
    }); //io.sockets.on('connect' {} ) 끝

}

//         // 1) 
//         // Post.find( { "_id": data.post_oid }  
//         //      ,{ participants: {$elemMatch: {user: data.user_oid }} } 
//         //      ,function(err, doc){   //callback 가능? 
//         //         if(doc)  //여기서 doc은 post 문서? elemMatch로 조회한 participants[i] ??
//         //     }
//         // );

//         // from mongood offitial doc  findOne으로 쿼리 후 두번째 파라미터에서 가져오는 필드 값 지정 
//         // Person.findOne({ 'name.last': 'Ghost' }, 'name occupation', function (err, person) {
//         //     if (err) return handleError(err);
//         //     console.log('%s %s is a %s.', person.name.first, person.name.last,
//         //     person.occupation);
//         // });



//         // var data = {"user_oid":uoid, "username":uname, "post_oid":poid, "chat_oid":coid};
//         // socket.leave(data.chat_oid); //chat_oid -> post에서 가져올 수도 있음 //postoid chat doc에서 가져올 수도 있음
// //         console.log('나가기 버튼 클릭, socket.on leave event 발생');
// //         console.log('jstr data : ' + JSON.stringify(data));
// // //data : {"user_oid":"5b7..93e" ,"username":"uname11", "post_oid":"5b7f..3ca08","chat_oid":"5b7..3ca09"}  
// //         //1)socket room reave
// //         console.log('before join dir io.sockets.adapter.rooms : ')
// //         console.dir(io.sockets.adapter.rooms);
// //         socket.leave(data.chat_oid);  //socket leave - callback? 가능?
// //         socket.to(data.chat_oid).emit('user_leave', {"username":data.username} );

// //         console.log('after join dir io.sockets.adapter.rooms : ')
// //         console.dir(io.sockets.adapter.rooms);

//         //2)chat doc participants-user삭제  
//     });


//     // socket.emit('join', {data:writer, chat_oid:chat.chat_oid});
//     // socket.on('join', function(data){
//     //     socket.join(data.chat_oid);
//     //     var curRoom = io.sockets.adapter.rooms[data.chat_oid];
//     //     curRoom.users = [];
//     //     curRoom.users.push(data.writer);

