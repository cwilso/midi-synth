var active_element;
var current_in;
var msg;
var sel;

function midiMessageReceived( msgs ) {
  for (i=0; i<msgs.length; i++) {
    var cmd = msgs[i].data[0] >> 4;
    var channel = msgs[i].data[0] & 0xf;
    var noteNumber = msgs[i].data[1];
    var velocity = msgs[i].data[2];

    if ( cmd==8 || ((cmd==9)&&(velocity==0)) ) { // with MIDI, note on with velocity zero is the same as note off
      // note off
      noteOff( noteNumber );
    } else if (cmd == 9) {
      // note on
      noteOn( noteNumber, velocity/127.0);
    } else if (cmd == 11) {
      controller( noteNumber, velocity/127.0);
    }
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

var selectMIDI = null;
var midiAccess = null;
var midiIn = null;

function changeMIDIPort() {
  var list=midiAccess.enumerateInputs();
  midiIn = midi.getInput( list[ selectMIDI.selectedIndex ] );
  midiIn.onmessage = midiMessageReceived;
}

function onMIDIStarted( midi ) {
  midiAccess = midi;

  document.getElementById("synthbox").className = "loaded";

  selectMIDI=document.getElementById("midiIn");
  var list=midi.enumerateInputs();

  // clear the MIDI input select
  selectMIDI.options.length = 0;

  if (list.length) {
    for (var i=0; i<list.length; i++) {
      selectMIDI.options[i]=new Option(list[i].name,list[i].fingerprint,i==0,i==0);
    }
    midiIn = midi.getInput( list[0] );
    midiIn.onmessage = midiMessageReceived;
  }
}

function onMIDISystemError( msg ) {
  document.getElementById("synthbox").className = "error";
  console.log( "Error encountered:" + msg );
}
//init: start up MIDI
window.addEventListener('load', function() {   
  navigator.getMIDIAccess( onMIDIStarted, onMIDISystemError );

});