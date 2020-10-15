var fs = require('fs'); 
var passport = require('passport');
var jwt = require('jsonwebtoken');
var LocalStrategy = require('passport-local').Strategy; 
var bcrypt = require('bcrypt');
var User = {};

var init = function(model){
    User = model;
}


var login = function (req, res, next) {   //next 필요?
    passport.authenticate('local-login', {session:false}, function(err, user){   //{session:false} 적용되는 방식
       
        if (err){
            throw next(err);
        }else if(!user){
            throw next(new Error("등록된 계정을 찾을 수 없음")); //질문 ??
        }
        req.logIn(user, {session: false}, function(err){ 
            // passport 내장메소드 reqin을 req에 붙인 거? login logIn {session:false} 적용되는 방식
            if (err) {
                res.send(err);
            }
            var token = jwt.sign({user_oid:req.user._id}, 'abc123');
            console.log('패스포트 로그인 처리 - user.name : ' + user.name);
            res.send({token:token, username:user.name});
        });
    })(req,res);
};



// passport.use('local-signup', new LocalStrategy({   //new Local..{} 인증방식을 정의한 객체
//     usernameField : 'phone'
//     ,passwordField:'password'
//     ,passReqToCallback:true
//     }, function(req,phone,password,done){
//         User.findOne({'phone':phone}, function(err, user){
//             if(err) { return done(err);}
//             if(user){
//                 return done(null, false);
//             }
//             var phone = req.body.phone;
//             var password = req.body.password;
//             var name = req.body.username;
//             var gender = req.body.gender;
//             var email = req.body.email;
//             var profileImage = req.files[0];           
// // usermodel :
// // ,proflie_image: {data: Buffer, path:String, filename:String, contentType: String} 
//             var user = new User({'phone':phone, 'hashed_password':password, 'name':name, 'gender':gender, 'email':email});
            
//             if(profileImage){
//                 user.proflie_image.data = fs.readFileSync(profileImage.path); //추가 
//                 user.proflie_image.contentType= profileImage.mimetype;
//                 user.proflie_image.path = profileImage.path;
//                 user.proflie_image.filename = profileImage.filename;
//             }

//             user.save(function(err){
//                 if(err){throw err};
//                 return done(null, user);  
//             });
            
//         });
//     })
// );


passport.use('local-login',  new LocalStrategy({
    usernameField : 'phone',
    passwordField : 'password',
    
}, function(phone, password, done) {  //콜백함수 필요?
    console.log('passport의 local-login 호출됨 : ' + phone);
    //process.nextTick(function(){..})으로 묶을 수 있음. User.findOne이 blocking되므로 aync방식으로 변경할 수도 있음?
    User.findOne({ 'phone' :  phone }, function(err, user) {
        if (err) { return done(err); }    
        if (!user) {
            console.log('계정이 일치하지 않음.');
            return done(null, false);
        }
        else if(user){
            console.log('사용자 일치하는 계정 확인');
            console.log('user : ' + user);
            
            console.log('user.hashed_password : ' + user.hashed_password);
            var hashed_password = user.hashed_password;
          
            bcrypt.compare(password, hashed_password, function(err,res) {
                if(err) {console.log('err : ' + err)};
                console.log('res : ' + res);
                if(res == true){
                    console.log('계정과 비밀번호가 일치함.');
                    return done(null, user);  
                }else{
                    console.log('비밀번호 일치하지 않음.');
                    return done(null, false);   
                }
            });       
        }   
    });
}));


module.exports.init = init;
module.exports.login = login;

