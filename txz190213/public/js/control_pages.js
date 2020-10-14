console.log("controll_pages.js 로드 시작");


$("#closeDepartSearch").click(function(e){
    $("#departSearchWrap").css("display", "none");
    history.go(-1)
});

$("#closeArriveSearch").click(function(e){
    $("#arriveSearchWrap").css("display", "none");
    history.go(-1)
});


$("#closeChat").click(function(e){
    console.log("closeChat 클릭 리스너 실행");
    $("#chatWrap").css("display", "none");
    $("#contentsBox").css("display","block"); 
    $("#chatIcon").css("display", "block");
    history.go(-1);    
})

$("#closePosting").click(function(e){
    $("#postingWrap").css("display", "none")
    // $("body").css("display", "hidden"); ?
    history.go(-1);
})


$("#chatIcon").click(function(e){
    console.log("#chatIcon 이벤트 리스터 실행");
    var box = document.getElementById("chatWrap")
    this.style.display="none";
    openPage(box, "chat");
});

$("#postingIcon").click(function(e){
    toPosting();
    var postingBox = document.getElementById("postingWrap");
    openPage(postingBox, "posting");
});

function handleHistoryAfterPosting(){
    history.replaceState({page:"posting/success"}, "", "posting/success");
}



function openPage(box, pagename){
    box.style.display="block"
    switch(pagename){
        case "placesearch" : 
            if(history.state.page!=pagename){
                history.pushState({page:pagename}, "", "/placesearch");
            }
        break;
        case "postlist" : 
            if(!chatOid){
                $("#postingIcon").css("display", "block")
            }
            history.replaceState({page:pagename}, "", "/postlist");
        break;
        case "posting" : 
            history.pushState({page:pagename}, "", "/posting");
        break;
        
        case "chat":
            
            history.pushState({page:pagename}, "", "/chat");
        break;
        case "viewpost":
            history.pushState({page:pagename},"", "viewpost")
        break;
        default:
            alert("openPage  default ")
    }
}

window.onpopstate = function(e){
    console.log('e.state.page : ', e.state.page)
    if(e.state.page == "chat")
    history.replaceState("posting", "", "/posting")
}
window.onpopstate = function(e){
    console.log('onpopstate & page : ' + e.state.page)
    var page = e.state.page;  
    switch(page){
        case "home":
            $(".contentsContainer").css("display", "none");
            $("#postlistBox").css("display", "none");
            showCurPos();
        break;
        case "placesearch":
            $("#departInput").trigger("click");
        break;
 
        case "postlist":
            $(".contentsContainer").css("display", "none");
            $("#postlistBox").css("display", "block");
        break;

        case "posting":
            $(".contentsContainer").css("display", "none")
            $("#postingWrap").css("display", "block")
            // $("#postingIcon").trigger("click")?
        break;

        case "posting/placesearch":
            var sep = history.state.seperator;
            var wrap = $("#"+ sep + "SearchWrapInPosting");
            wrap.css("display", "block");
        break;

        case "chat":
            $(".contentsContainer").css("display", "none")
            $("#chatWrap").css("display", "block")
            $("#chatIcon").css("display", "none");
            
        break;

        case "viewpost":
            $(".contentsContainer").css("display", "none")
            $("#postJoinViewWrap").css("display", "block")
        break;

        case "posting/success":
            history.replaceState("viewpost", "", "/viewpost");
            $(".contentsContainer").css("display", "none")
            $("#postJoinViewWrap").css("display", "block")
        break;
        default:
            alert("page state err")
    }
}

// window.onpopstate = function(e){
//     if(e.state.page ='home'){
//         $(".placeSearchWrap").css("display", "none");
//         $("#postlistBox").css("display", "none");
//         $("#postingWrap").css("display", "none");
//     }
// }
// window.onpopstate = function(e){
//     console.log('onpopstate event - history.length : ' + history.length);
//     if(e.state.page=='login'){   
//         console.log('e.state.page =="login" onpopstate 이벤트');
//         loadLogin();
//     }
//     else if(e.state.page == 'auth_phone'){   
//         if(confirm("인증초기화 ok?")){  //인증초기화 ok를 누르면 e.state.page = auth_phone되게. 윗줄이랑 순서바꾸기?
//             loadAuthPhone();  
//         }
//         else{
//             history.forward();  // 질문 정상적인 방법?
//         }
//         // loadAuthPhone();
//     }
//     else if(e.state.page == 'index'){
//         console.log("e.state.page =='index' 구문 실행");
//         $(".placeSearchWrap").css("display", "none");
//         $("#postingWrap").css("display", "none");
//         // $("#departSearchWrap").css("display", "none");
//         // $("#arriveSearchWrap").css("display", "none");
//         // $("#postingWrap").css("display", "none");
//     }
//     else if(e.state.page == 'posting'){
//         $(".placeSearchWrapInPosting").css("display", "none");
//     }
// }
