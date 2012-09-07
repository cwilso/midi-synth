var voices = new Array();
var audioContext = null;

var currentOsc1Waveform = 2; // SAW
var currentOsc1Octave = 1;  // 16'
var currentOsc1Detune = 0;	// 0
var currentOsc1Mix = 50.0;	// 50%

var currentOsc2Waveform = 2; // SAW
var currentOsc2Octave = 1;  // 8'
var currentOsc2Detune = 15;	// slight detune makes pretty analogue-y sound.  :)
var currentOsc2Mix = 50.0;	// 0%

var currentFilterFrequency = 1492.0;
var currentFilterQ = 5.0;
var currentFilterMod = 0;
var currentFilterEnv = 67;

var currentEnvA = 10;
var currentEnvD = 15;
var currentEnvS = 75;
var currentEnvR = 20;

var currentFilterEnvA = 35;
var currentFilterEnvD = 15;
var currentFilterEnvS = 50;
var currentFilterEnvR = 40;

var currentRev = 0;
var currentDrive = 0;
var currentVol = 50;

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
    currentFilterQ = 40 * value;
    $("#fQ").val( currentFilterQ );
    $("#fQ").trigger('change');
    onUpdateFilterQ( currentFilterQ );
  }
}

function onUpdateFilterFrequency( value ) {
	if (value.currentTarget)
		value = value.currentTarget.value;
	currentFilterFrequency = value;
//	console.log("update Filter Freq: " + value);
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
//	console.log("update Filter Q: " + value);
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setFilterQ( value );
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
    waveshaper.setDrive( 0.1 + currentDrive/50.0 );
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
	this.osc1Gain.gain.value = 0.0002 * currentOsc1Mix;
//	this.gain.gain.value = 0.05 + (0.33 * velocity);
	this.osc1.connect( this.osc1Gain );

	// create osc 2
	this.osc2 = audioContext.createOscillator();
	this.updateOsc2Frequency();
	this.osc2.type = currentOsc2Waveform;

	this.osc2Gain = audioContext.createGainNode();
	this.osc2Gain.gain.value = 0.0002 * currentOsc2Mix;
	this.osc2.connect( this.osc2Gain );

	this.filter1 = audioContext.createBiquadFilter();
	this.filter1.type = this.filter1.LOWPASS;
	this.filter1.Q.value = currentFilterQ;
	this.filter2 = audioContext.createBiquadFilter();
	this.filter2.type = this.filter2.LOWPASS;
	this.filter2.Q.value = currentFilterQ;

	this.osc1Gain.connect( this.filter1 );
	this.osc2Gain.connect( this.filter1 );
	this.filter1.connect( this.filter2 );

	this.envelope = audioContext.createGainNode();
	this.filter2.connect( this.envelope );
	this.envelope.connect( effectChain );

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
}

Voice.prototype.setOsc1Waveform = function( value ) {
	this.osc1.type = value;
}

Voice.prototype.updateOsc1Frequency = function( value ) {
	this.osc1.frequency.value = (this.originalFrequency*Math.pow(2,currentOsc1Octave-2));  // -2 because osc1 is 32', 16', 8'
	this.osc1.detune.value = currentOsc1Detune;
}

Voice.prototype.updateOsc1Mix = function( value ) {
	this.osc1Gain.gain.value = 0.0033 * value;
}

Voice.prototype.setOsc2Waveform = function( value ) {
	this.osc2.type = value;
}

Voice.prototype.updateOsc2Frequency = function( value ) {
	this.osc2.frequency.value = (this.originalFrequency*Math.pow(2,currentOsc2Octave-1));
	this.osc2.detune.value = currentOsc2Detune;
}

Voice.prototype.updateOsc2Mix = function( value ) {
	this.osc2Gain.gain.value = 0.0033 * value;
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

Voice.prototype.noteOff = function() {
	var now =  audioContext.currentTime;
	this.envelope.gain.cancelScheduledValues(now);
	this.envelope.gain.setValueAtTime( this.envelope.gain.value, now );
	var release = now + (currentEnvR/100.0);
	this.envelope.gain.linearRampToValueAtTime( 0.0, release );
	this.osc1.noteOff( release );
	this.osc2.noteOff( release );
}

function keyDown( ev ) {
	var note = keys[ev.keyCode];
	if (note)
		noteOn( note, 0.75 );
//	console.log( "key down: " + ev.keyCode );
	return false;
}

function keyUp( ev ) {
	var note = keys[ev.keyCode];
	if (note)
		noteOff( note );
//	console.log( "key up: " + ev.keyCode );
	return false;
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
//    revNode = audioContext.createConvolutionNode();
    volNode = audioContext.createGainNode();
    volNode.gain.value = currentVol;
    waveshaper.output.connect( // revNode );
    //revNode.connect( 
    	volNode );
    volNode.connect( audioContext.destination );

}



	null;

function createShaperCurve() {

}

window.onload=initAudio;
