//init이 필요한가? 그냥 post, user넘겨도 되나?

var Post={};
var User={};
var Chat={};
var jwt = require('jsonwebtoken');

var init = function(post, user, chat){
    console.log('post.js init호출됨');
    Post = post;
    User = user;
    Chat = chat;
}

var loadpost = function(req,res){
    console.log("POST /loadpost 실행, req.body.post : ", req.body.post)
    var postOid = req.body.post;
    Post.findOne({"_id":postOid}, function(err, post){
        if(err) throw err;
        if(post){
            console.log('loadpost post 조회 ');
            res.send(post);
        }
    });
}
var posting = function(req,res,next){    //(req,res,next에서 ) next 지움
    console.log('POST /posting  호출');
    // console.log('req.body : ' + JSON.stringify(req.body));
    
    var accessToken = req.headers['x-access-token'];
    console.log('accessToken : ' + accessToken);
    if(!accessToken || !(accessToken.search('Bearer ')===0)){   
        // return next(new Error('401 Missing x-access-token'));  
        console.log('401 Missing x-access-token'); return;
        //next함수로 넘어가는게 아니라 에러를 강제 발생시켜서 프로그램 종료하고 콘솔에만 출력?  //질문
    }
    var token = accessToken.split(' ')[1];
    // console.log('token : ' + token);
    if(!token){
        // return next(new Error('401 Missing Bearer Token'));
        console.log('401 Missing x-access-token'); return;
    }
    
    var decoded = jwt.decode(token, 'abc123');
    console.log('jstr decoded : ' + JSON.stringify(decoded));
    var userOid = decoded.user_oid;
    console.log('userOid : ' + userOid);
    User.findOne({_id:userOid}, function(err, user){   
    //useroid accessToken에서 가져오면 User.finOne구문 불필요? 
    //그래도 안정성 생각하면 이렇게 해야 함? //에러 처리로 대체?
    //localstorage에 필요한 user정보들(이름, 성별 등) 따로 저장해서 ajax /posting 호출 시 데이터로 넘기는 방식? 더 가볍나?

    //질문 이거 필요한건지, User에 profile img 있으면 속도 느려짐 확인
        if(err) throw err;
        if(!user){
            throw new Error("checked x-access-token but failed to find user");
        }
        console.log('UserModel - get user record success');
        // console.log(user._doc.phone);
        console.log("user._doc.phone : " + user._doc.phone);
        var writerObjectId = user._doc._id;
        var writerName = user._doc.name; 
        var writerGender = user._doc.gender; 
        var departTime = req.body.departTime;
        var numLimit = req.body.numLimit;
        var message = req.body.message;

        var departPlacename = req.body.departPlacename; 
        var departRoadAddr = req.body.departRoadAddr;
        var departJibunAddr = req.body.departJibunAddr;
        var departLng = req.body.departLng;
        var departLat = req.body.departLat;

        var arrivePlacename = req.body.arrivePlacename;
        var arriveRoadAddr = req.body.arriveRoadAddr;
        var arriveJibunAddr = req.body.arriveJibunAddr;
        var arriveLng = req.body.arriveLng;
        var arriveLat = req.body.arriveLat;
       
        var post = new Post({
            "writer":writerObjectId  //writerOjbectId 필요한가? 여기에 이름이랑 성별도 저장하는데?
            ,"writer_gender":writerGender, "writer_name":writerName
            ,"depart_time":departTime
            ,"join_restrict":numLimit, "participant_count":1, "message":message
            ,"dep_placeinfo":{'placename' : departPlacename, 'road_addr':departRoadAddr, 'jb_addr':departJibunAddr}
            ,"dep_geometry":{type:'Point', coordinates:[departLng, departLat]}
            ,"arv_placeinfo":{'placename' : arrivePlacename, 'road_addr':arriveRoadAddr, 'jb_addr':arriveJibunAddr}
            ,"arv_geometry":{type:'Point', coordinates:[arriveLng, arriveLat]}
        });
        post.save(function(err){
            if(err){ throw err; }
            console.log("post.save() cb");  
            console.log("post._id : " + post._id);
            
            res.send(post);

            console.log('=====server posting method end==========');

        });
    });
}


var showposts = function(req,res){
    console.log('post.js showposts 호출');
    console.log(req.body); //str json?
    //좌표로만 검색? depPlace, arvPlace 필요 없음?

    var depPlace = req.body.departInput;
    var arvPlace = req.body.arriveInput;
    var departLng = req.body.departLngInMain;
    var departLat = req.body.departLatInMain;
    var arriveLng = req.body.arriveLngInMain;
    var arriveLat = req.body.arriveLatInMain;
    var joinChatOid = req.body.joinChatOid;
    console.log("depPlace : " + depPlace);
    console.log("arvPlace : " + arvPlace);
    
    console.log("joinChatOid : ", joinChatOid);
    
    
    if( joinChatOid != undefined ){
        var ObjectId = require('mongodb').ObjectId; 
        Chat.findOne(new ObjectId(joinChatOid)).select("linkedpost").exec(function(err, result) {
            if(err) throw err;
            if(result && result.linkedpost){
                console.log('linkedpost Object result : ', result);
                var query = Post.find({"_id": {$ne : result.linkedpost} });
                query.where('dep_geometry').within({ center: [parseFloat(departLng), parseFloat(departLat)]
                    ,radius: 500/6371   //1/6371 : 1km    //,unique : true, spherical : true?
                }).limit(8);
                query.where('arv_geometry').within({ center: [parseFloat(arriveLng), parseFloat(arriveLat)]
                    ,radius: 500/6371
                }); 
                query.limit(6).exec(function(err, results) {
                    if(err) throw err;
                    if(results){
                        console.log('출발지 도착지로 포스트 검색 검색결과문서들 가져옴 - results.length : ' + results.length);
                        res.render('postlist', {posts:results});    
                    }
                });
            }
            // Post.find({"joinChatOid": {$elemMatch: {}} }).populate('writer', 'name gender'); 
            // User.find({ "userLog": {$elemMatch: { logflag: true}}})
        });
    
    }else{
        var query = Post.find({});
        query.where('dep_geometry').within({ center: [parseFloat(departLng), parseFloat(departLat)]
            ,radius: 2000/6371   //1/6371 : 1km    //,unique : true, spherical : true?
        }).limit(8);
        query.where('arv_geometry').within({ center: [parseFloat(arriveLng), parseFloat(arriveLat)]
            ,radius: 500/6371
        }); 
        query.limit(6).exec(function(err, results) {
            if(err) throw err;
            if(results){
                console.log('출발지 도착지로 포스트 검색 검색결과문서들 가져옴 - results.length : ' + results.length);
                res.render('postlist', {posts:results});    
            }
        });
    }



    // var query = Post.find();
    // query.where('dep_geometry').near(
    //     {center:{type:'Point', coordinates:[parseFloat(departLng), parseFloat(departLat)]}} 
    // ).limit(4);
    // query.where('arv_geometry').near(
    //     {center:{type:'Point', coordinates:[parseFloat(arriveLng), parseFloat(arriveLat)]}} 
    // ).limit(2);
    // query.exec(function(err, results){
    //     if(err){ throw err };
    //     if(results){
    //         res.render('postlist', {posts:results});
    //     }     
    // });

    // var r = 10/6371;
    // var area1 = { center: address1.loc.coordinates, radius: r, unique: true }
    // var area2 = { center: address2.loc.coordinates, radius: r, unique: true }

    // MySchema
    //     .where('address1.loc').
    //     .within()
    //     .circle(area1)
    //     .where('address2.loc').
    //     .within()
    //     .circle(area2)
    //     .exec(function(err, objects) {

    //         if(err) return eachCallback(err);

    //         return eachCallback();
    //     });

    // ,list: function(callback){
    //     //var criteria = options.criteria || {};
    //     this.find({})
    //         .populate('writer', 'name id gender pic')
    //         .exec(callback);
    // }


};

module.exports.init = init;
module.exports.loadpost = loadpost;
module.exports.posting = posting;
module.exports.showposts = showposts;

