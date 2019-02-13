var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
// var jwt = require('jsonwebtoken');
// var JwtStrategy = require('passport-jwt').Strategy;
// var ExtractJwt = require('passport-jwt').ExtractJwt;

var userSchema = mongoose.Schema({
    phone:{type:String, unique:true}
    ,hashed_password:{type:String}
    ,name:{type:String}
    ,gender:{type:String}
    ,email:{type:String}
    ,signup_date:{type:Date, index:{unique:false}, 'default':Date.now}
    ,proflie_image: {data: Buffer, path:String, filename:String, contentType: String} 
});
// userSchema.methods.generateHash = function(password){
//     return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);   //null???
// };

userSchema.pre("save", function (next){
    var user = this;  //user = this 써줘야 하는 이유?
    // if(!user.isModified("password")){ // 3-1
    //     return next();
    // } else {
        console.log("this : " + this);
        console.log("user : " + JSON.stringify(user));
        console.log("before encrypt : user.hashed_password : " + user.hashed_password);
        user.hashed_password = bcrypt.hashSync(user.hashed_password, bcrypt.genSaltSync(8)); // bcrypt문서에 async가 recommended로 나옴 수정하기.
        console.log("after encrypt : user.hashed_password : " + user.hashed_password);
        return next();
    // }
});



module.exports = mongoose.model('txu4', userSchema); 

