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
  var preferredIndex = 0;

  midiAccess = midi;

  document.getElementById("synthbox").className = "loaded";

  selectMIDI=document.getElementById("midiIn");
  if ((typeof(midiAccess.inputs) == "function")) {  //Old Skool MIDI inputs() code
  var list=midiAccess.inputs();

  // clear the MIDI input select
  selectMIDI.options.length = 0;

  for (var i=0; (i<list.length)&&(preferredIndex==-1); i++) {
    var str=list[i].name.toString();
    if ((str.indexOf("Keyboard") != -1)||(str.indexOf("keyboard") != -1)||(str.indexOf("KEYBOARD") != -1))
      preferredIndex=i;
  }

  if (list.length) {
    for (var i=0; i<list.length; i++) {
      selectMIDI.appendChild(new Option(list[i].name,list[i].fingerprint,i==preferredIndex,i==preferredIndex));
    }
    midiIn = list[preferredIndex];
    midiIn.onmidimessage = midiMessageReceived;

    selectMIDI.onchange = selectMIDIIn;
  }
  } else {
  // clear the MIDI input select
  selectMIDI.options.length = 0;

  // Check to see if any of the devices have "Keyboard" in the name
  var i=0;
  for (var input of midiAccess.inputs.values()) {
    var str=input.name.toString();
    if (!preferredIndex && ((str.indexOf("Keyboard") != -1)||(str.indexOf("keyboard") != -1)||(str.indexOf("KEYBOARD") != -1)))
      preferredIndex=i;
    i++;
  }

  i=0;
  for (var input of midiAccess.inputs.values()) {
    selectMIDI.appendChild(new Option(input.name,input.fingerprint,i==preferredIndex,i==preferredIndex));
    i++;
    midiIn = input;
    midiIn.onmidimessage = midiMessageReceived;
    selectMIDI.onchange = selectMIDIIn;
  }
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