var wsUri = "ws://ws.blockchain.info/inv"; 
//
//wss://bitcoin.toshi.io
var output;  
var width=window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth||0,
    height=window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight||0,
    max_circles=250,
    max_r=600,
    max_amount=500,
    nodes = [],
    node;
height-=100;
width-=20;




function init() { 
output = document.getElementById("output"); 
startSocket(); 
}  

function startSocket() { 
websocket = new WebSocket(wsUri); 
try{
  websocket.onopen = function(evt) { onOpen(evt) }; 
  websocket.onerror = function(evt) { onError(evt) }; 
  websocket.onmessage = function(evt) { onMessage(evt) };
  websocket.onclose = function(evt) { onClose(evt) }; 
}
catch(e){
  console.log("error")
}
/*setTimeout(function(){
  websocket.send("Hello");
},1000)*/
}  

function onOpen(evt) { 
doSend('{"op":"unconfirmed_sub"}'); 
}  

function onMessage(evt) { 
writeToScreen(evt.data); 
}  

function onError(evt) { 
writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data); 
}  

function doSend(message) { 
websocket.send(message); 
}  

function hex_dec(hex){
return parseInt(hex, 16);
}

function onClose(evt) { 
writeToScreen('<span style="color: red;">DISCONNECT:</span> ' + evt.data); 
} 

function timeConverter(UNIX_timestamp){
 var a = new Date(UNIX_timestamp*1000);
 var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
     var year = a.getFullYear();
     var month = months[a.getMonth()];
     var date = a.getDate();
     var hour = a.getHours();
     var min = a.getMinutes();
     var sec = a.getSeconds();
     var time = date+' '+month+' '+year+' '+hour+':'+min+':'+sec ;
     return time;
 }

function do_push(size_block,color,info,hash){

  

  // Add a new random shape.
  nodes.push({
    type: d3.svg.symbolTypes[0],
    size: size_block,
    rel:info,
    id:hash
  });

  // Restart the layout.

  force.start();

  if(nodes.length>=max_circles){
      nodes.shift();
        vis.selectAll("path")
      .data(nodes,function (d) {
         //console.log(d)
         return d.id;
       }).exit().remove();
  }
  maxlength=nodes.length
  vis.selectAll("path")
      .data(nodes,function (d) {
        //console.log(d.id)
         return d.id;
       })
      .enter().append("path")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("d", d3.svg.symbol()
        .size(function(d) { return d.size; })
        .type(function(d) { return d.type; }))
      .style("fill", "#"+color)
      .style("stroke", "black")
     /* .style("opacity",function(d){
        console.log(d.index/maxlength)
        return d.index/maxlength
      })*/
      .attr("rel",amount)
      .style("stroke-width", "1.5px")
      .on('mouseover', function(d){
          var nodeSelection = d3.select(this).style({opacity:'0.2'});
          document.getElementById("info").innerHTML=d.rel;
      })
      .on('mouseout', function(d){
          var nodeSelection = d3.select(this).style({opacity:'1.0'});
          nodeSelection.select("text").style({opacity:'0'});
      })
      .on('click', function(d){
          window.open("https://www.blockchain.info/tx/"+hash);
      })
      .call(force.charge(function(d) { return -d.size/3; }) );
};

function writeToScreen(message) { 
    data = JSON.parse(message);
    //console.log(data.x.inputs[0].prev_out.value)
    hash = data.x.hash;
    //console.log(data)
    amount=0;
    amount_data=data.x.out;
    for(i=0;i<amount_data.length;i++){
        amount+=amount_data[i].value;
    }
    amount*=1e-8;

    amount_in=0;
    for(i=0;i<data.x.inputs.length;i++){
        amount_in+=data.x.inputs[i].prev_out.value;
    }
    amount_in*=1e-8;
    fee=amount_in-amount


    //end
    var output = [],
        sNumber = hash,
        nns = [];

    ns=[];
    color = sNumber.charAt(0)+sNumber.charAt(1)+sNumber.charAt(2)+sNumber.charAt(3)+sNumber.charAt(4)+sNumber.charAt(5);
    for (var i = 6, len = sNumber.length; i < len; i += 1) {
        ns.push(sNumber.charAt(i));
        if(i%2==1){
            if(ns.length==2)
                nns.push(ns);
            ns=[];
        }
    }

    //draw
    size = Math.pow(amount/max_amount,1/2)*max_r;
    size=Math.max(size,50)
    myip=data.x.relayed_by
    info="Amount: "+(Math.round(amount*1e8)/1e8)+"BTC<br>Fee: "+fee+"BTC<br>Time: "+timeConverter(data.x.time)+"<br>Relayed by: "+myip+"<br><br>Click to view on blockchain.info";
        
    detailInfo="Amount: "+(Math.round(amount*1e8)/1e8)+"BTC<br>Fee: "+fee+"BTC<br>Time: "+timeConverter(data.x.time)+"<br>Relayed by: "+myip;
    document.getElementById("detial").innerHTML=detailInfo;
    //alert(myip)
    $.getJSON('http://www.ipaddressapi.com/l/7962e4095a7d1d4f17742908b081d84625cb8e7e0d24?h='+myip, function(ipData){
      console.log("11111111111111")
      console.log(myip)
      console.log(ipData)
      //alert(ipData)
      
      //console.log(ipData.lat)
      //console.log(ipData.lon)
    })
    do_push(size,color,info,hash);
}  

window.onload=function(){

}
window.addEventListener("load", init, false);  