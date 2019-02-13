/* 
selectPlaceInPosting() 
최근검색에서 선택 시와 텍스트검색 후 선택 시 
공통으로 처리 가능한지 : 

$("#departPlacename").focus( ... )
--> 
1. 최근검색어 선택 시
1) 전역변수에 값 담기
seperator = "depart";
placeSearchWrap = document.getElementById("departSearchWrapInPosting")
listBox = document.getElementById("departResultBoxInPosting");
placeSearchWrap.style.display="block";
2) showRecentSearchList() 실행
3) showRecentSearchList() 함수 안에서 printRecentSearchList() 호출
4) printRecentSearchList() -> 최근검색리스트 출력
    printList += '<li class="recentPlaceItem">';
    printList += '<span class="placenameInList">' + placesHistory[i].placename + '</span>';
    printList +=   "<span class='road_addr' style='display:none'>" + placesHistory[i].road_addr + "</span>"
    printList +=   "<span class='jibun_addr' style='display:none'>" + placesHistory[i].jibun_addr + "</span>"
    printList +=   "<input type='hidden' class='lat' value='" + placesHistory[i].lat + "'>" 
    printList +=   "<input type='hidden' class='lng' value='" + placesHistory[i].lng + "'>"  
    printList +=   '<span class="recentPlaceDate">' + processDate(placesHistory[i].date) + '</span>';
    printList += '</li>';

5) 출발지 목적지 포커스 이벤트핸들러 showRecentSearchList() 호출 구문 아래에 
    장소 선택 이벤트 처리 구문 삽입 후 selectPlaceInPosting(e) 호출
 $(".recentPlaceItem, .recentSearchPlace .recentPlaceDate").bind("click", function(e){
    selectPlaceInPosting(e);
}); 

2. 검색어 입력 후 선택 시 

1) placeSearchInputInPosting. keydown 이벤트 핸들러 안에서
2) placeSearchHandlerInPosting() 함수 실행
3) 키워드 장소검색 리스트 추력
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
// 플레이스네임, lat, lng, road_addr, jibun_addr 변수명은 동일

4)

var targetItem = e.target;
console.log(targetItem);
console.log(e.target.nodeName);
if(e.target.nodeName != "LI"){
    targetItem = targetItem.parentNode;
}
var tg_place = targetItem.getElementsByClassName('place')[0].textContent;
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
$placeSearchWrapInPosting.css("display", "none");
AddRecentSearchItem(tg_place, tg_jbaddr, tg_lat, tg_lng)









*/