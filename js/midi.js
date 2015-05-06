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
  } else if ( cmd == 10 ) {  // poly aftertouch
    polyPressure(noteNumber,velocity/127)
  } else
  console.log( "" + ev.data[0] + " " + ev.data[1] + " " + ev.data[2])
}

var selectMIDI = null;
var midiAccess = null;
var midiIn = null;

function selectMIDIIn( ev ) {
  if (midiIn)
    midiIn.onmidimessage = null;
  var id = ev.target[ev.target.selectedIndex].value;
  if ((typeof(midiAccess.inputs) == "function"))   //Old Skool MIDI inputs() code
    midiIn = midiAccess.inputs()[ev.target.selectedIndex];
  else
    midiIn = midiAccess.inputs.get(id);
  if (midiIn)
    midiIn.onmidimessage = midiMessageReceived;
}

function populateMIDIInSelect() {
  // clear the MIDI input select
  selectMIDI.options.length = 0;
  if (midiIn && midiIn.state=="disconnected")
    midiIn=null;
  var firstInput = null;

  var inputs=midiAccess.inputs.values();
  for ( var input = inputs.next(); input && !input.done; input = inputs.next()){
    input = input.value;
    if (!firstInput)
      firstInput=input;
    var str=input.name.toString();
    var preferred = !midiIn && ((str.indexOf("MPK") != -1)||(str.indexOf("Keyboard") != -1)||(str.indexOf("keyboard") != -1)||(str.indexOf("KEYBOARD") != -1));

    // if we're rebuilding the list, but we already had this port open, reselect it.
    if (midiIn && midiIn==input)
      preferred = true;

    selectMIDI.appendChild(new Option(input.name,input.id,preferred,preferred));
    if (preferred) {
      midiIn = input;
      midiIn.onmidimessage = midiMessageReceived;
    }
  }
  if (!midiIn) {
      midiIn = firstInput;
      if (midiIn)
        midiIn.onmidimessage = midiMessageReceived;
  }
}

function midiConnectionStateChange( e ) {
  console.log("connection: " + e.port.name + " " + e.port.connection + " " + e.port.state );
  populateMIDIInSelect();
}

function onMIDIStarted( midi ) {
  var preferredIndex = 0;

  midiAccess = midi;

  document.getElementById("synthbox").className = "loaded";
  selectMIDI=document.getElementById("midiIn");
  midi.onstatechange = midiConnectionStateChange;
  populateMIDIInSelect();
  selectMIDI.onchange = selectMIDIIn;
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