

function showRecentSearchList(listBox){

    var getHistoryRecent = localStorage.getItem('searchHistory');
    var placesHistory = JSON.parse(getHistoryRecent);
    var placesHistoryLen = placesHistory.length;
    if(placesHistoryLen==0){
        var printMessage = "<p style='text-align:center;font-size:13px; font-weight:bold; margin:30px 0;'>최근검색 기록이 없습니다</p>"
        listBox.innerHTML= printMessage;
    }
    else{
        //최근장소검색리스트 
        var printList = printRecentSearchList(getHistoryRecent);
        listBox.innerHTML = printList;
        
    }
} 

function printRecentSearchList(getHistoryRecent){
    var placesHistory = JSON.parse(getHistoryRecent);
    var placesHistoryLen = placesHistory.length;
    var printList="";  
    printList += "<ul>"

    for(var i=0; i<placesHistoryLen; i++){
        printList += '<li class="recentPlaceItem">';
        printList += '<span class="placenameInList">' + placesHistory[i].placename + '</span>';
        printList +=   "<span class='road_addr' style='display:none'>" + placesHistory[i].road_addr + "</span>"
        printList +=   "<span class='jibun_addr' style='display:none'>" + placesHistory[i].jibun_addr + "</span>"
        printList +=   "<input type='hidden' class='lat' value='" + placesHistory[i].lat + "'>" 
        printList +=   "<input type='hidden' class='lng' value='" + placesHistory[i].lng + "'>"  
        printList +=   '<span class="recentPlaceDate">' + processDateRecentSearch(placesHistory[i].date) + '</span>';
        printList += '</li>';
    }
    printList += '</ul>';
    return printList;
}

/* AddRecentSearchItem() : 메인페이지의 검색과 포스팅 시의 검색에서 사용 */  
function addRecentSearchItem(tg_place, tg_jbaddr, tg_lat, tg_lng){ 
    var listStr = localStorage.getItem("searchHistory");        
    var list =JSON.parse(listStr); //Array 객체로 변환
    
    var newItem = { 
        "placename":tg_place, "jibun_addr":tg_jbaddr, "road_addr":""
        ,"lat":tg_lat, "lng":tg_lng, "date":Date.now()
    };
    var idx = list.findIndex(function(item){
        return item.placename == tg_place
    })
    
    if(idx>=0){
        list = [newItem, ...list.slice(0, idx), ...list.slice(idx+1, list.length)]
    }else{  // else if(idx==-1|| list.length ==0)z 
        list.unshift(newItem)
    }
    localStorage.setItem("searchHistory", JSON.stringify(list));
    
}


function processDateRecentSearch(prDate){
    var dateProcessed ="";   
    var theDate = new Date(prDate);
    var month = (theDate.getMonth());
    var date = theDate.getDate();
    var dateNow = new Date(); 
    var curMonth = dateNow.getMonth(); 
    var curDate = dateNow.getDate();
    
    if(month == curMonth && date == curDate){
        dateProcessed = "오늘";
    }else if(month == curMonth && date == (curDate-1) ){     //가능?
        dateProcessed = "어제";
    }else{
        dateProcessed = (month+1) + '월 ' + date + '일';
    }
    return dateProcessed;
}