var mongoose = require('mongoose');

var postSchema = mongoose.Schema({
    writer:{type:mongoose.Schema.ObjectId, ref:'txu4'}
    ,writer_name:{type:String}
    ,writer_gender:{type:String}
    ,depart_time:{type:String}
    ,participant_count:{type:Number, 'default': 1}
    ,join_restrict:{type:Number}
    ,message:{type:String}
    ,dep_placeinfo:{
        'placename':{type:String, 'default': ''}
        ,'road_addr':{type:String, 'default':''}
        ,'jb_addr':{type:String, 'default':''}
    }
    ,dep_geometry :{
        'type': {type: String, 'default': "Point"}
        ,coordinates : [{type:"Number"}]
    }
    ,arv_placeinfo : {
        'placename':{type:String, 'default': ''}
        ,'road_addr':{type:String, 'default':''}
        ,'jb_addr':{type:String, 'default':''}
    }
    ,arv_geometry :{
        'type': {type: String, 'default': "Point"}
        ,coordinates : [{type:"Number"}]
    }
    ,linkedchat : {type:mongoose.Schema.ObjectId, ref:'txconversation'}
});
postSchema.index({dep_geometry:'2dsphere'});
postSchema.index({arv_geometry:'2dsphere'});
module.exports = mongoose.model('txpost1', postSchema);  //질문

