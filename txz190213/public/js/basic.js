console.log('load basic.js 시작');

var clientBaseUrl = '';


var lng = 126.6531160; //위치 못가져오는 경우 초기 맵 띄위기 변수
var lat = 37.4496270;
var isDepartSelected = false;
var isArriveSelected = false;

var departDataOn = { "placename": "", "roadAddr": "", "jibunAddr": "", "lat": "", "lng": "" };
var arriveDataOn = { "placename": "", "roadAddr": "", "jibunAddr": "", "lat": "", "lng": "" };

var placeInput, latForSearch, lngForSearch; //출발지 목적지 정보 담기 위한 임시변수로 사용 
var searchHistory; //로컬스토리지의 최근검색리스트 담는 변수 

var userOid = localStorage.getItem("user_oid");
var chatOid = localStorage.getItem("chat_on");
var postOid = localStorage.getItem("post_oid");
var username = localStorage.getItem("username");

var webDB = window.openDatabase('webDB', '1.0', '채팅DB', 1024 * 1024);

if (!localStorage.getItem("searchHistory")) {
    localStorage.setItem("searchHistory", "[]");
}
else {
    console.log("searchHistory 로컬스토리지에 존재");
}

if (chatOid && postOid) {
    console.log("if(chatOid) && postOid -> true 구문 실행");

    $.ajax({
        url: '/loadpost'
        , type: "post"
        , data: { "post": postOid }
        , success: function (post) {
            $("#postJoinSum").remove();
            console.log('loadpost success - postOid : ' + postOid);
            var departPlace = post.dep_placeinfo.placename;
            var arrivePlace = post.arv_placeinfo.placename;
            var joinCount = post.participant_count;
            insertPostSum(departPlace, arrivePlace, joinCount);
            printPostInfoPage(post)
        }
        , error: function (err) {
            console.log('loadpost fail - postOid : ' + postOid);
            console.log(JSON.stringify(err));
        }
    })
}

var menubarIcon = document.getElementById("menubarIcon")
var logoutBox = document.getElementById("logoutBox")
menubarIcon.addEventListener("click", function (e) {
    if (logoutBox.style.display == "block") {
        logoutBox.style.display = "none"
    } else {
        logoutBox.style.display = "block"
    }
})

function logout() {
    alert("로그아웃하였습니다");
    // if(localStorage.getItem('chat_on')){
    //     console.log('localStorage.getItem("chat_oid") true 참여중인 방 있음 로그아웃 불가 return ');
    //     console.log('chatOnId : ' + chatOnId + ', postOnId : ' + postOnId);
    //     return;
    // }

    localStorage.removeItem('x-access-token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_oid');
    localStorage.removeItem('post_oid');
    localStorage.removeItem('chat_on');
    loadLogin();
}

// insertPostSum 호출 : postlist.ejs 방 조인 시, posting.js파일, socket_client.js 소켓 재접속 시
$.getScript(   //onpopstate login 변경 시 현재위치와 맵 리로드 없다면 현재위치 새로고침 버튼 필요 -> 
    "//dapi.kakao.com/v2/maps/sdk.js?appkey=85097723654db6cd517aed007a5a1371&libraries=services&autoload=false"
)
    .done(function () {
        daum.maps.load(function () {
            console.log("daum.maps.load 콜백");
            showCurPos();
            addEvents();
        });
    })

    .fail(function () {
        alert('get map api script failed');
    });

function addEvents() {
    var psWrap;
    var listBox;
    var seperator;
    $("#departInput").click(function () {   //focus -> click으로? posting 페이지 부분도 생각
        $(':focus').blur();
        seperator = "depart";
        psWrap = document.getElementById("departSearchWrap")
        placeInput = document.getElementById("departInput");
        latForSearch = document.getElementById("departLatInMain");
        lngForSearch = document.getElementById("departLngInMain");
        listBox = document.getElementById("departResultBox");

        var departVal = this.value  //질문 e.target.value는 안되나?
        $("#departSearchInput").val(departVal);   //???
        openPage(psWrap, 'placesearch');

        showRecentSearchList(listBox);

        $(".recentPlaceItem, .recentSearchPlace .recentPlaceDate").bind("click", function (e) {
            selectPlace(e, psWrap, seperator);
        });
    });

    $("#arriveInput").click(function () {
        $(':focus').blur();
        seperator = "arrive";
        psWrap = document.getElementById("arriveSearchWrap")
        placeInput = document.getElementById("arriveInput");
        latForSearch = document.getElementById("arriveLatInMain");
        lngForSearch = document.getElementById("arriveLngInMain");
        listBox = document.getElementById("arriveResultBox");

        psWrap.style.display = "block"

        /*메인 searchForm에 출발지, 도착지가 입력되 경우 그 값을 장소입력페이지 장소입력 창으로 전달 */
        var arriveVal = this.value
        $("#arriveSearchInput").val(arriveVal);

        if (history.state.page != "placesearch") {
            openPage(psWrap, "placesearch")  //pushstate 출발지 도착지 두번 push됨. 수정?
        }
        showRecentSearchList(listBox);
        $(".recentPlaceItem, .recentSearchPlace .recentPlaceDate").bind("click", function (e) {
            selectPlace(e, psWrap, seperator);
        });
    });

    $(".placeSearchInput").keydown(function (key) {  //map api script autoload=false 상태 -> daum.maps.load({}) 메소드 구문 밖이라 script load 안된 상태?
        if (key.keyCode == 13) {
            var keyword = $(this).val();
            placeSearchHandler(keyword, psWrap, listBox, seperator);
        }
    });
}

function showCurPos() {
    var mapContainer;
    var map;
    var mapOption;

    mapContainer = document.getElementById('map') // 지도를 표시할 div 
    mapOption = {
        center: new daum.maps.LatLng(37.455868, 126.7023086), // 지도의 중심좌표
        level: 3// 지도의 확대 레벨
    };
    map = new daum.maps.Map(mapContainer, mapOption);

    function error(err) {
        console.warn('ERROR(' + err.code + '): ' + err.message);
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (pos) {
            console.log('nav geo 접근')
            console.log('pos : ' + JSON.stringify(pos));  //질문 빈객체로 나옴 아래는 출력됨
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            mapContainer = document.getElementById('map') // 지도를 표시할 div 
            console.log("lat : " + lat + ", lng : " + lng);

            
            mapOption = {
                center: new daum.maps.LatLng(lat, lng), // 지도의 중심좌표
                level: 6// 지도의 확대 레벨
            };
            map = new daum.maps.Map(mapContainer, mapOption);
            var markerPosition = new daum.maps.LatLng(lat, lng);
            var marker = new daum.maps.Marker({
                position: markerPosition
            });
            marker.setMap(map);
            var geocoder = new daum.maps.services.Geocoder();
            geocoder.coord2Address(lng, lat, function (result, status) {
                if (status === daum.maps.services.Status.OK) {
                    var curPosAddr = result[0].address.address_name;
                    $("#departInput").val(curPosAddr);
                    $("#departLatInMain").val(lat)
                    $("#departLngInMain").val(lng)
                    departDataOn.placename = curPosAddr;
                    departDataOn.jibunAddr = curPosAddr
                    departDataOn.lat = lat;
                    departDataOn.lng = lng;
                    isDepartSelected = true;
                } else {
                    console.log("geocoder.coord2Address status err ");
                    console.log("status : ", status)
                    console.log("daum.maps.services.Status.OK : ", daum.maps.services.Status.OK)
                }

            });
            infowindow = new daum.maps.InfoWindow({ zindex: 1 }); // 클릭한 위치에 대한 주소를 표시할 인포윈도우입니다
            // clickMap(marker, geocoder);
            daum.maps.event.addListener(map, 'click', function (mouseEvent) {
                console.log('mouseEvent.latLng.getLat() : ' + mouseEvent.latLng.getLat());
                var coords = mouseEvent.latLng;
                var clickPointLat = coords.getLat();
                var clickPointLng = coords.getLng();
                geocoder.coord2Address(clickPointLng, clickPointLat, function (result, status) {
                    if (status === daum.maps.services.Status.OK) {
                        var detailAddr = !!result[0].road_address ?
                            '<div class="addrItem">도로명주소 : '
                            + result[0].road_address.address_name
                            + '</div>' : '';
                        detailAddr += '<div class="addrItem">지번 주소 : '
                            + result[0].address.address_name
                            + '</div>';
                        console.log(result[0]);
                        var content =
                            '<div class="infoWindowBox">'
                            + '<span class="title">법정동 주소정보</span>'
                            + detailAddr
                            + '</div>';
                        marker.setPosition(mouseEvent.latLng);
                        marker.setMap(map);

                        // 인포윈도우에 클릭한 위치에 대한 법정동 상세 주소정보를 표시합니다
                        infowindow.setContent(content);
                        infowindow.open(map, marker);


                        $("#latitude").val(clickPointLat);
                        $("#longitude").val(clickPointLng);
                        $("#addr").val(result[0].address.address_name);
                        if (result[0].road_address) {
                            $("#road_addr").val(result[0].road_address.address_name);
                        } else {
                            $("#road_addr").val("");
                        }
                    }
                });
            });
        }, 
        error,
        { maximumAge: 3000, timeout: 5000, enableHighAccuracy: true }
        );


    }
}




function placeSearchHandler(keyword, psWrap, listBox, seperator) {
    console.log("(handleplacesearch) seperator : " + seperator);

    var ps = new daum.maps.services.Places();
    ps.keywordSearch(keyword, function (places, status /*, pagination*/) {
        console.log('ps.keywordSearch() 실행');
        if (status === daum.maps.services.Status.OK) {
            var printList = "";
            var distance;
            printList += "<ul>"
            for (var i = 0; i < places.length; i++) {
                distance = getDistance(lat, lng, places[i].y, places[i].x);
                printList += "<li class='place_item'>";
                printList += "<img class='spreadMapIcon' src='/images/spreaddown.gif'/>"
                    + "<div class='itemInListInfo'>"
                    + "<span class='placenameInList'>" + places[i].place_name + "</span><br>"
                    + "<span class='road_addr' style='display:none'>" + places[i].road_address_name + "</span>"
                    + "<span class='jibun_addr'>" + places[i].address_name + "</span><br>"
                    + "<input type='hidden' class='lat' value='" + places[i].y + "'>"
                    + "<input type='hidden' class='lng' value='" + places[i].x + "'>"
                    + "<span class='distanceInList'>" + distance + "</span>"  //br 필요?
                    + "</div>"
                printList += "</li>"

            };
            printList += "</ul>"
            listBox.innerHTML = printList;
            togglePlaceSearchMap();
            $(".placenameInList, .jibun_addr").bind("click", function (e) {
                console.log("플레이스 항목 선택");
                selectPlace(e, psWrap, seperator)
                console.log("json str e.target : " + JSON.stringify(e.target));
            });

        } else if (status === daum.maps.services.Status.ZERO_RESULT) {
            alert('검색결과가 존재하지 않습니다');
            return;
        } else if (status === daum.maps.services.Status.ERROR) {
            alert('검색 결과 중 오류가 발생했습니다');
            return;
        } else {
            console.log('ps.keywordSear 중 뭔가 에러 발생');
        }
    });
}



function selectPlace(e, psWrap, seperator) {
    console.log(" func selectPlace(e)  실행")
    var targetItem = e.target;
    if (e.target.nodeName != "LI") {
        targetItem = targetItem.parentNode;
    }
    var tg_place = targetItem.getElementsByClassName('placenameInList')[0].textContent;
    var tg_jbaddr = targetItem.getElementsByClassName('jibun_addr')[0].textContent;
    var tg_rdaddr = targetItem.getElementsByClassName('road_addr')[0].textContent;
    var tg_lat = targetItem.getElementsByClassName('lat')[0].value;
    var tg_lng = targetItem.getElementsByClassName('lng')[0].value;

    psWrap.style.display = "none";

    if (seperator == "depart") {
        //departDataon = {tg_place, tg_jbaddr, tg_rdaddr, tg_lat, tg_lng} 한번에 처리?
        console.log("if seperator = depart 실행");
        departDataOn.placename = tg_place;
        departDataOn.jibunAddr = tg_jbaddr;
        // departDataOn.roadAddr = tg_rdaddr;
        departDataOn.lat = tg_lat;
        departDataOn.lng = tg_lng;
        console.log(JSON.stringify(departDataOn));
        isDepartSelected = true;
    } else if (seperator == "arrive") {
        console.log("if seperator = arrive 실행");
        arriveDataOn.placename = tg_place;
        arriveDataOn.jibunAddr = tg_jbaddr;
        // arriveDataOn.roadAddr = tg_rdaddr;
        arriveDataOn.lat = tg_lat;
        arriveDataOn.lng = tg_lng;
        console.log(JSON.stringify(arriveDataOn));
        isArriveSelected = true;
    }
    placeInput.value = tg_place;
    latForSearch.value = tg_lat;
    lngForSearch.value = tg_lng;
    if (isDepartSelected == true && isArriveSelected == false) {
        console.log("if문 실행 isDepartSelected == false && isArriveSelected == false");
        // $("#arriveSearchWrap").css("display", "block");
        $("#arriveInput").click();

    } else if (isDepartSelected == true && isArriveSelected == true) {
        console.log("if문 실행 isDepartSelected == true && isArriveSelected == true");
        console.log("SEPERATOR : " + seperator);
        processShowPosts();
        if (!chatOid) {
            $("#postingIcon").css("display", "block");
        } else {
            console.log("ChatOid 존재, postisngIcon 버튼 disp block 코드 스킵");
        }
    }
    addRecentSearchItem(tg_place, tg_jbaddr, tg_lat, tg_lng)
}

/* getDistance() : 메인페이지의 검색과 포스팅 시의 검색에서 사용 */
function getDistance(lat1, lng1, lat2, lng2) {
    function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }
    var R = 6378137; // Radius of the earth in km
    var dLat = (lat2 - lat1) * (Math.PI / 180);  // deg2rad below
    var dLng = (lng2 - lng1) * (Math.PI / 180);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var calcToKm = R * c / (1000); // Distance in km
    var dVal = calcToKm.toFixed(1);
    if (dVal < 1) {
        dVal = (dVal * 1000) + 'm'
    } else {
        dVal = dVal + 'km'
    }
    return dVal;
}
/* togglePlaceSearchMap() : 메인페이지의 검색과 포스팅 시의 검색에서 사용 */
function togglePlaceSearchMap() {
    $(".place_item .spreadMapIcon").on('click', function (e) {
        var eventItem = e.target;
        var targetLI = eventItem.parentNode;
        if ($(targetLI).hasClass("map_active")) {
            var item = targetLI.getElementsByClassName('map')[0];
            targetLI.removeChild(item);
            targetLI.classList.remove("map_active");

        } else {
            var printLocationInfo = "<div class='map' style='width:100%;height:250px;position:relative;'>";
            printLocationInfo += "<div class='inMap'>";
            printLocationInfo += "</div></div>";
            $(targetLI).append(printLocationInfo);
            var targetLat = $(targetLI).find('.lat').val();
            var targetLng = $(targetLI).find('.lng').val();

            targetLat = Number(targetLat);
            targetLng = Number(targetLng);
            console.log('targetLat : ' + targetLat + 'targetLng : ' + targetLng)

            var mapContainer = targetLI.getElementsByClassName('map')[0];
            var mapOptions = {
                center: new daum.maps.LatLng(targetLat, targetLng)
                , level: 3
            }
            var map = new daum.maps.Map(mapContainer, mapOptions);
            var marker = new daum.maps.Marker()
            marker.setPosition(new daum.maps.LatLng(targetLat, targetLng));
            marker.setMap(map);
            targetLI.className += " map_active"
        }
    });
}



function processShowPosts() {
    console.log('processShowPosts 호출');

    $.ajax({
        url: "/showposts"
        , method: 'POST'
        , data: $("#mainSearchForm").serializeArray()
        // ,dataType:
        , success: function (postlistEjs) {

            console.log('ajax POST /showposts success cb 실행');
            var listbox = document.getElementById("postlistBox");
            openPage(listbox, "postlist")
            listbox.innerHTML = postlistEjs
        }
        , error: function (err) {
            console.log("/postlist form 처리 중 에러 발생 err : " + JSON.stringify(err));
        }
    });
}

//     //1) mainform과 contents 박스 사이 참여중 배너
//     //2) NumOfCurrentParticipants value +1
//     //3) joinButton text 참여하기 -> 참여중
//     //4) 참여중 배너 클릭 -> 포스팅 상세페이지 팝업
//     //2), 4) -> sibling 으로 가능, 1)도 sibling으로 가능
//     //sibling, parentNode 사용 어떤 게 나은가?


function insertPostSum(departPlace, arrivePlace, joinCount) {

    var postJoinSum = document.createElement('div'); //ok
    postJoinSum.setAttribute("id", "postJoinSum"); //ok
    var postSumContent = '<span id="postJoinMarker">참여중</span>'
    postSumContent += '<p id="postSumFromTo">'
    postSumContent += '<span class="placenameInPostJoinSum">' + departPlace + "</span> -> "
    postSumContent += '<span class="placenameInPostJoinSum">' + arrivePlace + "</span>"
    postSumContent += '</p>'
    postSumContent += '<span id="participantNumberInJoinSummary">'
    postSumContent += '<span id="memberCount">' + joinCount + '</span>'
    postSumContent += '명</span>'
    postJoinSum.innerHTML = postSumContent;
    $("#wrap").prepend(postJoinSum);

    $("#postJoinSum").click(function (e) {
        var postWrap = document.getElementById("postJoinViewWrap");
        openPage(postWrap, "viewpost")

    });

};

function printPostInfoPage(post) {
    console.log("2. printPostInfoPage 실행");
    // var writerName = post.writer_name;
    // var writerGender = post.writer_gender;
    var departPlace = post.dep_placeinfo.placename;
    var arrivePlace = post.arv_placeinfo.placename;
    var departTime = post.depart_time;
    var joinCount = post.participant_count;
    var joinLimit = post.join_restrict;
    var message = post.message;

    var postJoinView = document.createElement('div');
    postJoinView.setAttribute("id", "postJoinView");
    postJoinContent = "";
    postJoinContent += '<div class="subWrapHeader" ><img id="postViewClose" class="backIcon" src="/images/back.gif"></div>';
    postJoinContent += '<p class="postJoinViewItem"><span class="postItemName">출발</span>' + departPlace + '</p>';
    postJoinContent += '<p class="postJoinViewItem"><span class="postItemName">도착</span>  ' + arrivePlace + '</p>';
    postJoinContent += '<p class="postJoinViewItem"><span class="postItemName">출발시간</span>  ' + departTime + '</p>';
    postJoinContent += '<p class="postJoinViewItem"><span class="postItemName">모집인원</span>  ' + joinLimit + '</p>';
    postJoinContent += '<p class="postJoinViewItem"><span class="postItemName">메세지</span>' + message + '</p>';
    postJoinContent += '<p id="cancel" onclick="userLeave()">참여취소</p>';  //userLeave() : socket_client.js

    postJoinView.innerHTML = postJoinContent;
    $("#postJoinViewWrap").append(postJoinView);

    $("#postViewClose").click(function (e) {
        $("#postJoinViewWrap").css("display", "none");
        history.go(-1);
    });


    $("#chatIcon").css("display", "block");
}

function join(e) {
    // $(".joinButton").click(function(e){
    if (!socket) {
        socket.open();
    }
    console.log("==========조인버튼 클릭 콘솔 확인 ==========");
    var targetContentNode = e.target.parentNode;
    // if(!(postOid==null || undefined))   
    var targetPost = targetContentNode.getElementsByClassName('post_oid')[0].value;


    console.log("1) postOid : " + postOid);
    if (postOid == targetPost) {
        alert("이미 참여중인 방입니다");
        return;
    } else if (postOid != null) {
        alert("이미 참여중인 방이 존재합니다");

    } else {
        var partiCountNode = targetContentNode.getElementsByClassName('partiCount')[0];
        partiCountNode.value = Number(partiCountNode.value) + 1;

        $.ajax({
            url: '/postlist/join'
            , type: 'GET'
            , data: {
                'post_oid': targetPost, 'user_oid': userOid || localStorage.getItem("user_oid"),
            } //data add user? 
            , success: function (post) {  //post로 받나
                console.log('3) 포스트리스트 조인 에이젝스 성공');
                var departPlace = post.dep_placeinfo.placename;
                var arrivePlace = post.arv_placeinfo.placename;
                // var departTime = post.depart_time;
                var joinCount = post.participant_count;
                // var joinLimit = post.join_restrict;
                // var message = post.message;


                insertPostSum(departPlace, arrivePlace, joinCount); //참여중인 포스트 요약 정보 배너
                printPostInfoPage(post) //포스팅 상세페이지 삽입

                var chatId = post.linkedchat;
                console.log('postlist에서 방 소켓 join emit 전 post.linkedchat 확인  : ' + post.linkedchat);
                socket.emit('join', { "linkedchat": chatId, "username": localStorage.getItem('username'), "linkedpost": targetPost });

                console.log('소켓 포스트 join 이벤트');

                localStorage.setItem("post_oid", post._id);
                localStorage.setItem("chat_on", chatId);
                postOid = localStorage.getItem("post_oid")
                chatOid = localStorage.getItem("chat_on")

                $("#postingIcon").css("display", "none");
                $("#chatIcon").css("display", "block");

            }
            , error: function (err) {
                console.log('joinButton 클릭 ajax 처리 /postlist/join 중 err : ') + err
            }
        });
    }
}
