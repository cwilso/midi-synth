var voices = new Array();
var audioContext = null;

// This is the "initial patch"
var currentModWaveform = 0;	// SINE
var currentModFrequency = 22; // Hz * 10 = 2.2
var currentModOsc1 = 11;
var currentModOsc2 = 0;

var currentOsc1Waveform = 2; // SAW
var currentOsc1Octave = 1;  // 16'
var currentOsc1Detune = 0;	// 0
var currentOsc1Mix = 50.0;	// 50%

var currentOsc2Waveform = 2; // SAW
var currentOsc2Octave = 1;  // 8'
var currentOsc2Detune = 15;	// slight detune makes pretty analogue-y sound.  :)
var currentOsc2Mix = 50.0;	// 0%

var currentFilterFrequency = 1500.0;
var currentFilterQ = 5.0;
var currentFilterMod = 10;
var currentFilterEnv = 67;

var currentEnvA = 10;
var currentEnvD = 15;
var currentEnvS = 75;
var currentEnvR = 20;

var currentFilterEnvA = 35;
var currentFilterEnvD = 15;
var currentFilterEnvS = 50;
var currentFilterEnvR = 40;

var currentDrive = 10;
var currentRev = 25;
var currentVol = 75;
// end initial patch

var keys = new Array( 256 );
keys[65] = 60; // = C4 ("middle C")
keys[87] = 61;
keys[83] = 62;
keys[69] = 63;
keys[68] = 64;
keys[70] = 65; // = F4
keys[84] = 66;
keys[71] = 67;
keys[89] = 68;
keys[72] = 69;
keys[85] = 70;
keys[74] = 71;
keys[75] = 72; // = C5
keys[79] = 73;
keys[76] = 74;
keys[80] = 75;
keys[186] = 76;
keys[222] = 77; // = F5
keys[221] = 78;
keys[13] = 79;
keys[220] = 80;

var effectChain = null;
var waveshaper = null;
var volNode = null;
var revNode = null;
var revGain = null;
var revBypassGain = null;

function frequencyFromNoteNumber( note ) {
	return 440 * Math.pow(2,(note-69)/12);
}

function noteOn( note, velocity ) {
	if (voices[note] == null) {
		// Create a new synth node
		voices[note] = new Voice(note, velocity);
	}
}

function noteOff( note ) {
	if (voices[note] != null) {
		// Shut off the note playing and clear it 
		voices[note].noteOff();
		voices[note] = null;
	}

}

// 'value' is normalized to 0..1.
function controller( number, value ) {
  if (number == 1) {
    currentFilterFrequency = 5000 * value;
    $("#fFreq").val( currentFilterFrequency );
    $("#fFreq").trigger('change');
    onUpdateFilterFrequency( currentFilterFrequency );
    return;
  } else if (number == 2) {
    currentFilterQ = 20 * value;
    $("#fQ").val( currentFilterQ );
    $("#fQ").trigger('change');
    onUpdateFilterQ( currentFilterQ );
  } else if (number == 3) {
    currentDrive = 100 * value;
    $("#drive").val( currentDrive );
    $("#drive").trigger('change');
    onUpdateDrive( currentDrive );
  } else if (number == 4) {
    currentRev = 100 * value;
    $("#reverb").val( currentRev );
    $("#reverb").trigger('change');
    onUpdateReverb( currentRev );
  } else if (number == 5) {
    currentModFrequency = 100 * value;
    $("#mFreq").val( currentModFrequency );
    $("#mFreq").trigger('change');
    onUpdateModFrequency( currentModFrequency );
  } else if (number == 6) {
    currentModOsc1 = 100 * value;
    $("#modOsc1").val( currentModOsc1 );
    $("#modOsc1").trigger('change');
    onUpdateModOsc1( currentModOsc1 );
  } else if (number == 7) {
    currentModOsc2 = 100 * value;
    $("#modOsc2").val( currentModOsc2 );
    $("#modOsc2").trigger('change');
    onUpdateModOsc2( currentModOsc2 );
  } else if (number == 8) {
    currentVol = 100 * value;
    $("#volume").val( currentVol );
    $("#volume").trigger('change');
    onUpdateVolume( currentVol );
  }
}

function onUpdateModWaveform( ev ) {
	currentModWaveform = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setModWaveform( currentModWaveform );
		}
	}
}

function onUpdateModFrequency( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentModFrequency = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateModFrequency( currentModFrequency );
		}
	}
}

function onUpdateModOsc1( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentModOsc1 = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateModOsc1( value );
		}
	}
}

function onUpdateModOsc2( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentModOsc2 = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateModOsc2( value );
		}
	}
}

function onUpdateFilterFrequency( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentFilterFrequency = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setFilterFrequency( value );
		}
	}
}

function onUpdateFilterQ( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentFilterQ = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setFilterQ( value );
		}
	}
}

function onUpdateFilterMod( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentFilterMod = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setFilterMod( value );
		}
	}
}

function onUpdateFilterEnv( value ) {
	currentFilterEnv = value;
}

function onUpdateOsc1Wave( ev ) {
	currentOsc1Waveform = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setOsc1Waveform( currentOsc1Waveform );
		}
	}
}

function onUpdateOsc1Octave( ev ) {
	currentOsc1Octave = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc1Frequency();
		}
	}
}

function onUpdateOsc1Detune( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentOsc1Detune = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc1Frequency();
		}
	}
}

function onUpdateOsc1Mix( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentOsc1Mix = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc1Mix( value );
		}
	}
}

function onUpdateOsc2Wave( ev ) {
	currentOsc2Waveform = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setOsc2Waveform( currentOsc2Waveform );
		}
	}
}

function onUpdateOsc2Octave( ev ) {
	currentOsc2Octave = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc2Frequency();
		}
	}
}

function onUpdateOsc2Detune( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentOsc2Detune = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc2Frequency();
		}
	}
}

function onUpdateOsc2Mix( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentOsc2Mix = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc2Mix( value );
		}
	}
}

function onUpdateEnvA( value ) {
	currentEnvA = value;
}

function onUpdateEnvD( value ) {
	currentEnvD = value;
}

function onUpdateEnvS( value ) {
	currentEnvS = value;
}

function onUpdateEnvR( value ) {
	currentEnvR = value;
}

function onUpdateFilterEnvA( value ) {
	currentFilterEnvA = value;
}

function onUpdateFilterEnvD( value ) {
	currentFilterEnvD = value;
}

function onUpdateFilterEnvS( value ) {
	currentFilterEnvS = value;
}

function onUpdateFilterEnvR( value ) {
	currentFilterEnvR = value;
}

function onUpdateDrive( value ) {
	currentDrive = value;
    waveshaper.setDrive( 0.01 + (currentDrive*currentDrive/500.0) );
}

function onUpdateVolume( value ) {
	volNode.gain.value = value/100.0;
}

function onUpdateReverb( value ) {
	value = value/100;

	// equal-power crossfade
	var gain1 = Math.cos(value * 0.5*Math.PI);
	var gain2 = Math.cos((1.0-value) * 0.5*Math.PI);

	revBypassGain.gain.value = gain1;
	revGain.gain.value = gain2;
}

/*
var FOURIER_SIZE = 4096;
var wave = false;

	if ( wave ) {
		var real = new Float32Array(FOURIER_SIZE);
		var imag = new Float32Array(FOURIER_SIZE);
		real[0] = 0.0;
		imag[0] = 0.0;

		for (var i=1; i<FOURIER_SIZE; i++) {
			real[i]=1.0;
			imag[i]=1.0;
		}

		var wavetable = audioContext.createWaveTable(real, imag);
		oscillatorNode.setWaveTable(wavetable);
	} else {

*/
function Voice( note, velocity ) {
	this.originalFrequency = frequencyFromNoteNumber( note );

	// create osc 1
	this.osc1 = audioContext.createOscillator();
	this.updateOsc1Frequency();
	this.osc1.type = currentOsc1Waveform;

	this.osc1Gain = audioContext.createGainNode();
	this.osc1Gain.gain.value = 0.005 * currentOsc1Mix;
//	this.gain.gain.value = 0.05 + (0.33 * velocity);
	this.osc1.connect( this.osc1Gain );

	// create osc 2
	this.osc2 = audioContext.createOscillator();
	this.updateOsc2Frequency();
	this.osc2.type = currentOsc2Waveform;

	this.osc2Gain = audioContext.createGainNode();
	this.osc2Gain.gain.value = 0.005 * currentOsc2Mix;
	this.osc2.connect( this.osc2Gain );

	// create modulator osc
	this.modOsc = audioContext.createOscillator();
	this.modOsc.type = currentModWaveform;
	this.modOsc.frequency.value = currentModFrequency/10;

	this.modOsc1Gain = audioContext.createGainNode();
	this.modOsc.connect( this.modOsc1Gain );
	this.modOsc1Gain.gain.value = currentModOsc1/10;
	this.modOsc1Gain.connect( this.osc1.frequency );	// tremolo

	this.modOsc2Gain = audioContext.createGainNode();
	this.modOsc.connect( this.modOsc2Gain );
	this.modOsc2Gain.gain.value = currentModOsc2/10;
	this.modOsc2Gain.connect( this.osc2.frequency );	// tremolo

	// create the LP filter
	this.filter1 = audioContext.createBiquadFilter();
	this.filter1.type = this.filter1.LOWPASS;
	this.filter1.Q.value = currentFilterQ;
	this.filter2 = audioContext.createBiquadFilter();
	this.filter2.type = this.filter2.LOWPASS;
	this.filter2.Q.value = currentFilterQ;

	this.osc1Gain.connect( this.filter1 );
	this.osc2Gain.connect( this.filter1 );
	this.filter1.connect( this.filter2 );

	// connect the modulator to the filters
	this.modFilterGain = audioContext.createGainNode();
	this.modOsc.connect( this.modFilterGain );
	this.modFilterGain.gain.value = currentFilterMod*10;
	this.modFilterGain.connect( this.filter1.frequency );	// filter tremolo
	this.modFilterGain.connect( this.filter2.frequency );	// filter tremolo

	// create the volume envelope
	this.envelope = audioContext.createGainNode();
	this.filter2.connect( this.envelope );
	this.envelope.connect( effectChain );

	// set up the volume and filter envelopes
	var now = audioContext.currentTime;
	var envAttackEnd = now + (currentEnvA/100.0);
	var filterAttackEnd = now + (currentFilterEnvA/100.0);
	this.envelope.gain.setValueAtTime( 0, now );
	this.envelope.gain.linearRampToValueAtTime( 1.0, envAttackEnd );
	this.envelope.gain.linearRampToValueAtTime( (currentEnvS/100.0), envAttackEnd + (currentEnvD/100.0) );
	var initFilter = currentFilterFrequency * (1.0-(currentFilterEnv/100.0));
	this.filter1.frequency.setValueAtTime( initFilter, now );
	this.filter1.frequency.linearRampToValueAtTime( currentFilterFrequency, filterAttackEnd );
	this.filter1.frequency.linearRampToValueAtTime( initFilter + (currentFilterFrequency * currentFilterEnv * currentFilterEnvS/10000.0), filterAttackEnd + (currentFilterEnvD/100.0) );
	this.filter2.frequency.setValueAtTime( initFilter, now );
	this.filter2.frequency.linearRampToValueAtTime( currentFilterFrequency, filterAttackEnd );
	this.filter2.frequency.linearRampToValueAtTime( initFilter + (currentFilterFrequency * currentFilterEnv * currentFilterEnvS/10000.0), filterAttackEnd + (currentFilterEnvD/100.0) );

	this.osc1.noteOn(0);
	this.osc2.noteOn(0);
	this.modOsc.noteOn(0);
}


Voice.prototype.setModWaveform = function( value ) {
	this.modOsc.type = value;
}

Voice.prototype.updateModFrequency = function( value ) {
	this.modOsc.frequency.value = value/10;
}

Voice.prototype.updateModOsc1 = function( value ) {
	this.modOsc1Gain.gain.value = value/10;
}

Voice.prototype.updateModOsc2 = function( value ) {
	this.modOsc2Gain.gain.value = value/10;
}

Voice.prototype.setOsc1Waveform = function( value ) {
	this.osc1.type = value;
}

Voice.prototype.updateOsc1Frequency = function( value ) {
	this.osc1.frequency.value = (this.originalFrequency*Math.pow(2,currentOsc1Octave-2));  // -2 because osc1 is 32', 16', 8'
	this.osc1.detune.value = currentOsc1Detune;
}

Voice.prototype.updateOsc1Mix = function( value ) {
	this.osc1Gain.gain.value = 0.005 * value;
}

Voice.prototype.setOsc2Waveform = function( value ) {
	this.osc2.type = value;
}

Voice.prototype.updateOsc2Frequency = function( value ) {
	this.osc2.frequency.value = (this.originalFrequency*Math.pow(2,currentOsc2Octave-1));
	this.osc2.detune.value = currentOsc2Detune;
}

Voice.prototype.updateOsc2Mix = function( value ) {
	this.osc2Gain.gain.value = 0.005 * value;
}

Voice.prototype.setFilterFrequency = function( value ) {
	var now =  audioContext.currentTime;
	this.filter1.frequency.cancelScheduledValues( now );
	this.filter1.frequency.setValueAtTime(value, now );
	this.filter2.frequency.cancelScheduledValues( now );
	this.filter2.frequency.setValueAtTime(value, now );
//	this.filter.frequency.value = value;
}

Voice.prototype.setFilterQ = function( value ) {
//	this.filter.Q.setTargetValueAtTime( value, audioContext.currentTime, 0.1 );
	this.filter1.Q.value = value;
	this.filter2.Q.value = value;
}

Voice.prototype.setFilterMod = function( value ) {
	this.modFilterGain.gain.value = currentFilterMod*10;
}

Voice.prototype.noteOff = function() {
	var now =  audioContext.currentTime;
	this.envelope.gain.cancelScheduledValues(now);
	this.envelope.gain.setValueAtTime( this.envelope.gain.value, now );
	var release = now + (currentEnvR/100.0);
	this.envelope.gain.linearRampToValueAtTime( 0.0, release );
	this.osc1.noteOff( release );
	this.osc2.noteOff( release );
}

var currentOctave = 3;

function keyDown( ev ) {
	var note = keys[ev.keyCode];
	if (note)
		noteOn( note + 12*(3-currentOctave), 0.75 );
//	console.log( "key down: " + ev.keyCode );
	return false;
}

function keyUp( ev ) {
	var note = keys[ev.keyCode];
	if (note)
		noteOff( note + 12*(3-currentOctave) );
//	console.log( "key up: " + ev.keyCode );
	return false;
}

function onChangeOctave( ev ) {
	currentOctave = ev.target.selectedIndex;
}


function initAudio() {
	try {
    	audioContext = new webkitAudioContext();
  	}
  	catch(e) {
    	alert('Web Audio API is not supported in this browser');
  	}

	window.addEventListener('keydown', keyDown, false);
	window.addEventListener('keyup', keyUp, false);
	setupSynthUI();

	// set up the master effects chain for all voices to connect to.
	effectChain = audioContext.createGainNode();
	waveshaper = new WaveShaper( audioContext );
    effectChain.connect( waveshaper.input );
    onUpdateDrive( currentDrive );
    revNode = audioContext.createConvolver();
	revGain = audioContext.createGainNode();
	revBypassGain = audioContext.createGainNode();

    volNode = audioContext.createGainNode();
    volNode.gain.value = currentVol;
    waveshaper.output.connect( revNode );
    waveshaper.output.connect( revBypassGain );
    revNode.connect( revGain );
    revGain.connect( volNode );
    revBypassGain.connect( volNode );
    onUpdateReverb( currentRev );

    volNode.connect( audioContext.destination );
    onUpdateVolume( currentVol );

  	var irRRequest = new XMLHttpRequest();
	irRRequest.open("GET", "sounds/irRoom.wav", true);
	irRRequest.responseType = "arraybuffer";
	irRRequest.onload = function() {
  		audioContext.decodeAudioData( irRRequest.response, 
  			function(buffer) { if (revNode) revNode.buffer = buffer; else console.log("no revNode ready!")} );
	}
	irRRequest.send();


}

window.onload=initAudio;
