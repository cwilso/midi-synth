var active_element;
var current_in;
var msg;
var sel;

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

function onMIDIStarted( midi ) {
  document.getElementById("synthbox").className = "loaded";
}

function onMIDISystemError( msg ) {
  document.getElementById("synthbox").className = "error";
  console.log( "Error encountered:" + msg );
}
//init: start up MIDI
window.addEventListener('load', function() {   
  navigator.getMIDIAccess( onMIDIStarted, onMIDISystemError );

});