function midiMessageReceived( ev ) {
  var cmd = ev.data[0] >> 4;
  var channel = ev.data[0] & 0xf;
  var noteNumber = ev.data[1];
  var velocity = ev.data[2];

  if (channel == 9)
    return
  if ( cmd==8 || ((cmd==9)&&(velocity==0)) ) { // with MIDI, note on with velocity zero is the same as note off
    // note off
    noteOff( noteNumber );
  } else if (cmd == 9) {
    // note on
    noteOn( noteNumber, velocity/127.0);
  } else if (cmd == 11) {
    controller( noteNumber, velocity/127.0);
  } else if (cmd == 14) {
    // pitch wheel
    pitchWheel( ((velocity * 128.0 + noteNumber)-8192)/8192.0 );
  }  
}

var selectMIDI = null;
var midiAccess = null;
var midiIn = null;

function selectMIDIIn( ev ) {
  midiIn = midiAccess.inputs()[selectMIDI.selectedIndex];
  midiIn.onmidimessage = midiMessageReceived;
}

function onMIDIStarted( midi ) {
  var preferredIndex = -1;

  midiAccess = midi;

  document.getElementById("synthbox").className = "loaded";

  selectMIDI=document.getElementById("midiIn");
  var list=midiAccess.inputs();

  // clear the MIDI input select
  selectMIDI.options.length = 0;

  for (var i=0; (i<list.length)&&(preferredIndex==-1); i++) {
    var str=list[i].name.toString();
    if ((str.indexOf("Keyboard") != -1)||(str.indexOf("keyboard") != -1)||(str.indexOf("KEYBOARD") != -1))
      preferredIndex=i;
  }
  if (preferredIndex==-1)
    preferredIndex=0;

  if (list.length) {
    for (var i=0; i<list.length; i++) {
      selectMIDI.appendChild(new Option(list[i].name,list[i].fingerprint,i==preferredIndex,i==preferredIndex));
    }
    midiIn = list[preferredIndex];
    midiIn.onmidimessage = midiMessageReceived;

    selectMIDI.onchange = selectMIDIIn;
  }
}

function onMIDISystemError( err ) {
  document.getElementById("synthbox").className = "error";
  console.log( "MIDI not initialized - error encountered:" + err.code );
}

//init: start up MIDI
window.addEventListener('load', function() {   
  if (navigator.requestMIDIAccess)
    navigator.requestMIDIAccess().then( onMIDIStarted, onMIDISystemError );

});