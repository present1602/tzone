// var curUrl = document.location.href;
// console.log('curUrl : ' + curUrl);
// var urlArr = curUrl.split('/');
// var curEndPath = urlArr[urlArr.length-1];
// console.log('curEndPath : ' + curEndPath);

// window.history.pushState({page:'login'}, "");
// console.log("init state : " + history.state.page);
// var pageOn = history.state.page;

// //signup에서 back 버튼 클릭 -> 

// window.onpopstate = function(e){
//     if(e.state.page=='index'){
//         $.ajax({
//             url:"/index"
//             ,success:function(data){
//                 $("body").html(data);   
//                 window.history.pushState({page:'index'}, '', '/index');
//                 pageOn = 'index';
//             }
//         });
//     }else if(e.state.page=='posting'){
//         // var authToken = localStorage.getItem('access_token');
//         $.ajax({
//             url:'/posting'
//             // ,headers : {"x-access-token" : "Bearer " + authToken} 
//             ,success:function(data){
//                 $("#container").html(containerTemp);  
               
//             }
//         });
       
//     }else if(e.state.page=='posting' && e.state.prestate =='searchplace'){
//         // var authToken = localStorage.getItem('access_token');
//         $.ajax({
//             url:'/posting'
//             // ,headers : {"x-access-token" : "Bearer " + authToken} 
//             ,success:function(data){
//                 $("#container").html(data);  
//                 console.log("AFTER (e.state.page=='posting') & pushstate(page : 'posting') history.length: " + history.length);
//             }
//         });
       
//     }
// }