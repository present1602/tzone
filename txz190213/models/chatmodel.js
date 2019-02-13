var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate')(mongoose)
var Schema = mongoose.Schema;

var MsgSchema = new Schema({
    text:{type:String, required:true}
    ,sender:{ type:Schema.Types.ObjectId, ref:'txu4' }
    ,created_at:{type:Date, index:{unique:false}, 'default':Date.now}
});

var ChatRoomSchema = new Schema({
    participants:[{
        user:{ type:Schema.Types.ObjectId, ref:'txu4' } //user_oid or userid 선택
        ,join_at : {type:Date, 'default':Date.now}
        ,is_writer:{type:Boolean, 'default':false} 
    }]
    ,contents:[MsgSchema]
    ,linkedpost : {type:Schema.Types.ObjectId, ref:'txpost1'} 
    ,created_at :{type:Date, 'default':Date.now} 
});
ChatRoomSchema.plugin(deepPopulate);
module.exports = mongoose.model('txconversation', ChatRoomSchema);