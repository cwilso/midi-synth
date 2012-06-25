var IE = false;
if(navigator.appName=='Microsoft Internet Explorer')
	var IE=true;
var Jazz;
var active_element;
var current_in;
var msg;
var sel;
var lastNote = -1;

function midiProc(t,a,b,c) {
  var cmd = a >> 4;
  var channel = a & 0xf;

  var noteNumber = b;

  if ( cmd==8 || ((cmd==9)&&(c==0)) ) { // with MIDI, note on with velocity zero is the same as note off
    // note off
    noteOff(b);
  } else if (cmd == 9) {
    // note on
    noteOn(b, c/127);
  } else if (cmd == 11) {
    controller(b, c/127);
  }
}

function midiString(a,b,c){
 var cmd=Math.floor(a/16);
 var note=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][b%12]+Math.floor(b/12);
 a=a.toString(16);
 b=(b<16?'0':'')+b.toString(16);
 c=(c<16?'0':'')+c.toString(16);
 var str=a+" "+b+" "+c+"    ";
 if(cmd==8){
  str+="Note Off   "+note;
 }
 else if(cmd==9){
  str+="Note On    "+note;
 }
 else if(cmd==10){
  str+="Aftertouch "+note;
 }
 else if(cmd==11){
  str+="Control    "+b;
 }
 else if(cmd==12){
  str+="Program    "+b;
 }
 else if(cmd==13){
  str+="Aftertouch";
 }
 else if(cmd==14){
  str+="Pitch Wheel";
 }
 return str;
}

//// Listbox
function changeMidi(){
 try{
  if(sel.selectedIndex){
   current_in=Jazz.MidiInOpen(sel.options[sel.selectedIndex].value,midiProc);
  } else {
   Jazz.MidiInClose(); current_in='';
  }
  for(var i=0;i<sel.length;i++){
   if(sel[i].value==current_in) sel[i].selected=1;
  }
 }
 catch(err){}
}

//// Connect/disconnect
function connectMidiIn(){
 try{
  var str=Jazz.MidiInOpen(current_in,midiProc);
  for(var i=0;i<sel.length;i++){
   if(sel[i].value==str) sel[i].selected=1;
  }
 }
 catch(err){}
}
function disconnectMidiIn(){
 try{
  Jazz.MidiInClose(); sel[0].selected=1;
 }
 catch(err){}
}
function onFocusIE(){
 active_element=document.activeElement;
 connectMidiIn();
}
function onBlurIE(){
 if(active_element!=document.activeElement){ active_element=document.activeElement; return;}
 disconnectMidiIn();
}

//init: create plugin
window.addEventListener('load', function() {   
  var Jazz = document.createElement("object");
  Jazz.style.position="absolute";
  Jazz.style.visibility="hidden";

  if (IE) {
    Jazz.classid = "CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90";
  } else {
    Jazz.type="audio/x-jazz";
  }

  var fallback = document.createElement("a");
  fallback.style.visibility="visible";
  fallback.style.background="white";
  fallback.style.font="20px Arial,sans-serif";
  fallback.style.padding="20px";
  fallback.style.position="relative";
  fallback.style.top="20px";
  fallback.style.zIndex="100";
  fallback.style.border="2px solid red";
  fallback.style.borderRadius="5px";
  fallback.appendChild(document.createTextNode("This page requires the Jazz MIDI Plugin."));
  fallback.href = "http://jazz-soft.net/";
  Jazz.appendChild(fallback);

  document.body.insertBefore(Jazz,document.body.firstChild);

  sel=document.getElementById("midiIn");
  try{
   current_in=Jazz.MidiInOpen(0,midiProc);
   var list=Jazz.MidiInList();
   for(var i in list){
    sel[sel.options.length]=new Option(list[i],list[i],list[i]==current_in,list[i]==current_in);
   }
  }
  catch(err){}

  if(navigator.appName=='Microsoft Internet Explorer'){ document.onfocusin=onFocusIE; document.onfocusout=onBlurIE;}
  else{ window.onfocus=connectMidiIn; window.onblur=disconnectMidiIn;}
});