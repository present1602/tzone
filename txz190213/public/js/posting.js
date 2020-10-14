// basic.js 의 전역변수들
// var lng = 126.6531160; 
// var lat = 37.4496270;
// var isDepartSelected = false;
// var isArriveSelected = false;
// var seperator;
// var departDataOn = {"placename":"", "roadAddr":"", "jibunAddr":"", "lat":"", "lng":""};
// var arriveDataOn = {"placename":"", "roadAddr":"", "jibunAddr":"", "lat":"", "lng":""};


$("#closeDepartSearchWrapInPosting").click(function(e){
    $("#departSearchWrapInPosting").css("display", "none");
    $("#departSearchInputInPosting").val("")
})
$("#closeArriveSearchWrapInPosting").click(function(e){
    $("#arriveSearchWrapInPosting").css("display", "none");
    $("#arriveSearchInputInPosting").val("")
})

function toPosting(){
    var psWrapInPosting;
    var psListBoxInPosting;
    var seperator;
    console.log("포스팅p - departdataon : " + JSON.stringify(departDataOn));
    console.log("포스팅p - arrivedataon : " + JSON.stringify(arriveDataOn));
    
    //!!메인에서 장소 검색한 데이터 포스팅의 dep arv로 가져오기
    if(isDepartSelected==true){ 
        console.log("postingwrap open isDepartSelected == true");
        $("#departPlacename").val(departDataOn.placename);
        $("#departRoadAddr").val(departDataOn.roadAddr);
        $("#departJibunAddr").val(departDataOn.jibunAddr);
        $("#departLat").val(Number(departDataOn.lat));
        $("#departLng").val(Number(departDataOn.lng));
        console.log('$("#departLat").val(); : ' +  $("#departLat").val());
        console.log('$("#departLng").val() : ' + $("#departLng").val());
    }
    if(isArriveSelected==true){
        console.log("postingwrap open isArriveSelected == true");
        $("#arrivePlacename").val(arriveDataOn.placename);
        $("#arriveRoadAddr").val(arriveDataOn.roadAddr);
        $("#arriveJibunAddr").val(arriveDataOn.jibunAddr);
        $("#arriveLat").val(arriveDataOn.lat);
        $("#arriveLng").val(arriveDataOn.lng);
        console.log("$('#arriveJibunAddr').val() : " + $('#arriveJibunAddr').val());
        console.log("$('#arriveLng').val() : " + $('#arriveLng').val());     
    }

    $("#departPlacename").click(function(){  
        console.log("포스팅 출발지 검색 click");
        $(':focus').blur();        
        seperator = "depart";
        psWrapInPosting = document.getElementById("departSearchWrapInPosting")
        psListBoxInPosting = document.getElementById("departResultBoxInPosting");
        
        showRecentSearchList(psListBoxInPosting);
        $("#postingWrap").css("display", "none");
        psWrapInPosting.style.display = "block"

        $(".recentPlaceItem, .recentSearchPlace .recentPlaceDate").bind("click", function(e){
            selectPlaceInPosting(e, psWrapInPosting, seperator)
        });

    });
    $("#arrivePlacename").click(function(){  
        console.log("포스팅 도착 검색 click");
        $(':focus').blur();
        seperator = "arrive";
        psWrapInPosting = document.getElementById("arriveSearchWrapInPosting")
        psListBoxInPosting = document.getElementById("arriveResultBoxInPosting");

        showRecentSearchList(psListBoxInPosting);
        $("#postingWrap").css("display", "none");
        psWrapInPosting.style.display = "block";

        $(".recentPlaceItem, .recentSearchPlace .recentPlaceDate").bind("click", function(e){
            selectPlaceInPosting(e, psWrapInPosting, seperator)
        });
        
    });
    

    $(".placeSearchInputInPosting").keydown(function(key){  //map api script autoload=false 상태 -> daum.maps.load({}) 메소드 구문 밖이라 script load 안된 상태?
        if(key.keyCode==13){
            console.log("포스팅 출발지 입력 keydown event");
            console.log("$(this).val() : " + $(this).val());
            var keyword = $(this).val();
            placeSearchHandlerInPosting(keyword, psWrapInPosting, psListBoxInPosting, seperator); 
        }
    });
    
    $("#posting_form #posting_submit").click(function(){
        processPosting();    
    });
}


function processPosting(){
    console.log("processPosting() 함수 실행");
    var authToken = localStorage.getItem('x-access-token');
    console.log("authToken : " + authToken);
    $.ajax({
        url:'/posting'
        ,headers:{"x-access-token" :"Bearer " + authToken}
        ,method:'post'
        ,data:$("#postingForm").serializeArray()    
        ,success:function(post){
            console.log("process posting success, insert successPosting ejs ");
            console.log('post.message : ' + post.message);
            console.log('post.dep_placeinfo.placename : ' + post.dep_placeinfo.placename);
            
            $("#postingWrap").css("display", "none");
            var writer = post.writer;  //userObjectId 
            var postObjId = post._id;
            var writerName = post.writer_name;
            var writerGender = post.writer_gender;
            var departPlace = post.dep_placeinfo.placename;
            var arrivePlace = post.arv_placeinfo.placename;
            var departTime = post.depart_time;
            var joinCount = post.participant_count;
            var joinLimit = post.join_restrict;
            var message = post.message;
            //참여중인 포스트 요약 정보 배너
            insertPostSum(departPlace, arrivePlace, joinCount);
            printPostInfoPage(post);

            //============포스팅완료페이지=============
            $postingSuccessWrap = $("#postingSuccessWrap");
            $postingSuccessWrap.css("display", "block");
            var postingSuccess = document.createElement('div');
            postingSuccess.setAttribute("id", "postingSuccessBox");

            var postingSuccessContent ="";
            postingSuccessContent+='<p id="postSuccessMessage">모집글이 등록되었습니다</p>';
            postingSuccessContent+='<div id="postingSuccesInfoBox">'
            postingSuccessContent+=   '<p class="postSuccessItem">출발 : ' + departPlace + '</p>';
            postingSuccessContent+=   '<p class="postSuccessItem">도착 : ' + arrivePlace + '</p>';
            postingSuccessContent+=   '<p class="postSuccessItem">출발시간 : ' + departTime+ '</p>';
            postingSuccessContent+=   '<p class="postSuccessItem">모집인원 : ' + joinLimit + '</p>';
            postingSuccessContent+=   '<p class="postSuccessItem" style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis">메세지 : ' + message + '</p>';
            postingSuccessContent+='</div>'
            postingSuccessContent+='<p id="postingSuccessConfirm">확인</p>';
            postingSuccess.innerHTML= postingSuccessContent; 
            $postingSuccessWrap.append(postingSuccess);
            
            $("#postingSuccessConfirm").click(function(e){
                $postingSuccessWrap.html("");
                $postingSuccessWrap.css("display", "none");
                history.back();
            });

            handleHistoryAfterPosting()

            console.log("1) postObjId : " + postObjId);
            $.ajax({
                url:'/createchat'
                ,method:'post'
                ,data:{'post':postObjId, 'user':writer}  
                ,success:function(chat){  
                    console.log('createchat success - chat.chat_oid  : ' + chat.chat_oid);
                    
                    $("#postingIcon").css("display", "none");
                    $("#chatIcon").css("display", "block");

                    localStorage.setItem("post_oid",postObjId);            
                    localStorage.setItem("chat_on", chat.chat_oid);
                    postOid = localStorage.getItem("post_oid");
                    chatOid = localStorage.getItem("chat_on");
                    
                    
                }
                ,error:function(err){
                    console.log('createchat ajax fail err : ' + JSON.stringify(err));
                }
            });
            
        }
        ,error:function(err){
            console.log('processPosting err : ' + err);
        }
    });
}


function placeSearchHandlerInPosting(keyword, psWrap, listBox,seperator){
    console.log("placeSearchHandlerInPosting() 실행");
    var ps = new daum.maps.services.Places(); 
    ps.keywordSearch(keyword, function(places, status){
        console.log('handlePlaceSearch() 실행');
        if(status === daum.maps.services.Status.OK){
            var printList = "";
            var distance; 
            printList +="<ul>"
            for(var i=0; i<places.length;i++){ 
                distance =   getDistance(lat, lng, places[i].y, places[i].x);
                printList += "<li class='place_item'>";
                printList += "<img class='spreadMapIcon' src='/images/spreaddown.gif'/>" 
                        + "<div class='itemInListInfo'>"
                        +   "<span class='placenameInList'>" + places[i].place_name + "</span><br>"
                        +   "<span class='road_addr' style='display:none'>" + places[i].road_address_name + "</span>"
                        +   "<span class='jibun_addr'>" + places[i].address_name + "</span><br>"
                        +   "<input type='hidden' class='lat' value='" + places[i].y + "'>" 
                        +   "<input type='hidden' class='lng' value='" + places[i].x + "'>"  
                        +   "<span class='distanceInList'>" + distance + "</span>"  //br 필요?
                        + "</div>"
                printList += "</li>"
            };
            printList +="</ul>"
            listBox.innerHTML = printList; 
            togglePlaceSearchMap();
            $(".placenameInList, .jibun_addr").bind("click", function(e){
                console.log("포스팅 장소검색에서 플레이스 항목 선택");
                selectPlaceInPosting(e, psWrap, seperator)
            });
        }else if(status === daum.maps.services.Status.ZERO_RESULT){
            alert('검색결과가 존재하지 않습니다');
            return;
        }else if(status === daum.maps.services.Status.ERROR){
            alert('검색 결과 중 오류가 발생했습니다');
            return;
        }
    });  
}

function selectPlaceInPosting(e, psWrap, seperator){
    console.log("selectPlaceInPosting(e) 함수 실행")
    $("#postingWrap").css("display", "block");

    try{
        var targetItem = e.target;
        console.log("e.target : " + e.target);
        if(e.target.nodeName != "LI"){
            targetItem = targetItem.parentNode;
        }
        var tg_place = targetItem.getElementsByClassName('placenameInList')[0].textContent;
        var tg_jbaddr = targetItem.getElementsByClassName('jibun_addr')[0].textContent;
        var tg_rdaddr = targetItem.getElementsByClassName('road_addr')[0].textContent;
        var tg_lat = targetItem.getElementsByClassName('lat')[0].value;
        var tg_lng = targetItem.getElementsByClassName('lng')[0].value;
        
        if(seperator=="depart"){
            $("#departPlacename").val(tg_place);
            $("#departJibunAddr").val(tg_jbaddr);
            $("#departRoadAddr").val(tg_rdaddr);
            $("#departLat").val(tg_lat);
            $("#departLng").val(tg_lng);
        }else if(seperator=="arrive"){
            $("#arrivePlacename").val(tg_place);
            $("#arriveJibunAddr").val(tg_jbaddr);
            $("#arriveRoadAddr").val(tg_rdaddr);
            $("#arriveLat").val(tg_lat);
            $("#arriveLng").val(tg_lng);
        }
        psWrap.style.display="none";
        addRecentSearchItem(tg_place, tg_jbaddr, tg_lat, tg_lng)

    }catch(err){
        alert("try catch err : " + err);
    }
}

