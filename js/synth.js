var voices = new Array();
var audioContext = null;
var isMobile = false;	// we have to disable the convolver on mobile for performance reasons.

// This is the "initial patch"
var currentModWaveform = 0;	// SINE
var currentModFrequency = 2.1; // Hz * 10 = 2.1
var currentModOsc1 = 15;
var currentModOsc2 = 17;

var currentOsc1Waveform = 2; // SAW
var currentOsc1Octave = 0;  // 32'
var currentOsc1Detune = 0;	// 0
var currentOsc1Mix = 50.0;	// 50%

var currentOsc2Waveform = 2; // SAW
var currentOsc2Octave = 0;  // 16'
var currentOsc2Detune = -25;	// fat detune makes pretty analogue-y sound.  :)
var currentOsc2Mix = 50.0;	// 0%

var currentFilterCutoff = 19.0;
var currentFilterQ = 7.0;
var currentFilterMod = 21;
var currentFilterEnv = 56;

var currentEnvA = 2;
var currentEnvD = 15;
var currentEnvS = 68;
var currentEnvR = 5;

var currentFilterEnvA = 5;
var currentFilterEnvD = 6;
var currentFilterEnvS = 5;
var currentFilterEnvR = 7;

var currentDrive = 38;
var currentRev = 32;
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
		var e = document.getElementById( "k" + note );
		if (e)
			e.classList.add("pressed");
	}
}

function noteOff( note ) {
	if (voices[note] != null) {
		// Shut off the note playing and clear it 
		voices[note].noteOff();
		voices[note] = null;
		var e = document.getElementById( "k" + note );
		if (e)
			e.classList.remove("pressed");
	}

}

function $(id) {
	return document.getElementById(id);
}

// 'value' is normalized to 0..1.
function controller( number, value ) {
	switch(number) {
	case 7:
		$("fFreq").setValue(100*value);
		onUpdateFilterCutoff( 100*value );
		return;
	case 0x0a:
	case 2:
		$("fQ").setValue(20*value);
		onUpdateFilterQ( 20*value );
		return;
	case 1:
		$("fMod").setValue(100*value);
		onUpdateFilterMod(100*value);	
		return;
	case 0x49:
	case 5:
	    $("drive").setValue(100 * value);
	    onUpdateDrive( 100 * value );
	    return;
	case 0x48:
	case 6:
	    $("reverb").setValue(100 * value);
	    onUpdateReverb( 100 * value );
	    return;
	case 0x4a:
	    $("modOsc1").setValue(100 * value);
	    onUpdateModOsc1( 100 * value );
	    return;
	case 0x47:
	    $("modOsc2").setValue(100 * value);
	    onUpdateModOsc2( 100 * value );
	    return;
	case 4:
	    $("mFreq").setValue(10 * value);
	    onUpdateModFrequency( 10 * value );
	    return;
	case 0x5b:
	    $("volume").setValue(100 * value);
	    onUpdateVolume( 100 * value );
	    return;
	case 33: // "x1" button
	case 51:
		moDouble = (value > 0);
		changeModMultiplier();
	    return;
	case 34: // "x2" button
	case 52:
		moQuadruple = (value > 0);
		changeModMultiplier();
	    return;
	}
}

var currentPitchWheel = 0.0;
// 'value' is normalized to [-1,1]
function pitchWheel( value ) {
	var i;

	currentPitchWheel = value;
	for (var i=0; i<255; i++) {
		if (voices[i]) {
			if (voices[i].osc1)
				voices[i].osc1.detune.value = currentOsc1Detune + currentPitchWheel * 500;	// value in cents - detune major fifth.
			if (voices[i].osc2)
				voices[i].osc2.detune.value = currentOsc2Detune + currentPitchWheel * 500;	// value in cents - detune major fifth.
		}
	}
}

var waveforms = ["sine","square","sawtooth","triangle"];

function onUpdateModWaveform( ev ) {
	currentModWaveform = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setModWaveform( waveforms[currentModWaveform] );
		}
	}
}

function onUpdateModFrequency( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentModFrequency = value;
	var oscFreq = currentModFrequency * modOscFreqMultiplier;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateModFrequency( oscFreq );
		}
	}
}

function onUpdateModOsc1( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentModOsc1 = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateModOsc1( currentModOsc1 );
		}
	}
}

function onUpdateModOsc2( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentModOsc2 = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateModOsc2( currentModOsc2 );
		}
	}
}

function onUpdateFilterCutoff( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentFilterCutoff = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setFilterCutoff( value );
		}
	}
}

function onUpdateFilterQ( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentFilterQ = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setFilterQ( value );
		}
	}
}

function onUpdateFilterMod( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentFilterMod = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setFilterMod( value );
		}
	}
}

function onUpdateFilterEnv( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
	currentFilterEnv = value;
}

function onUpdateOsc1Wave( ev ) {
	currentOsc1Waveform = ev.target.selectedIndex;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].setOsc1Waveform( waveforms[currentOsc1Waveform] );
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

function onUpdateOsc1Detune( ev ) {
	var value = ev.currentTarget.value;
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
			voices[i].setOsc2Waveform( waveforms[currentOsc2Waveform] );
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

function onUpdateOsc2Detune( ev ) {
	var value = ev.currentTarget.value;
	currentOsc2Detune = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc2Frequency();
		}
	}
}

function onUpdateOsc2Mix( ev ) {
	var value = ev.currentTarget.value;
	currentOsc2Mix = value;
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			voices[i].updateOsc2Mix( value );
		}
	}
}

function onUpdateEnvA( ev ) {
	currentEnvA = ev.currentTarget.value;
}

function onUpdateEnvD( ev ) {
	currentEnvD = ev.currentTarget.value;
}

function onUpdateEnvS( ev ) {
	currentEnvS = ev.currentTarget.value;
}

function onUpdateEnvR( ev ) {
	currentEnvR = ev.currentTarget.value;
}

function onUpdateFilterEnvA( ev ) {
	currentFilterEnvA = ev.currentTarget.value;
}

function onUpdateFilterEnvD( ev ) {
	currentFilterEnvD = ev.currentTarget.value;
}

function onUpdateFilterEnvS( ev ) {
	currentFilterEnvS = ev.currentTarget.value;
}

function onUpdateFilterEnvR( ev ) {
	currentFilterEnvR = ev.currentTarget.value;
}

function onUpdateDrive( value ) {
	currentDrive = value;
    waveshaper.setDrive( 0.01 + (currentDrive*currentDrive/500.0) );
}

function onUpdateVolume( ev ) {
	volNode.gain.value = (ev.currentTarget ? ev.currentTarget.value : ev)/100;
}

function onUpdateReverb( ev ) {
	var value = ev.currentTarget ? ev.currentTarget.value : ev;
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

function filterFrequencyFromCutoff( pitch, cutoff ) {
    var nyquist = 0.5 * audioContext.sampleRate;

    var filterFrequency = Math.pow(2, (9 * cutoff) - 1) * pitch;
    if (filterFrequency > nyquist)
        filterFrequency = nyquist;
	return filterFrequency;
}

function Voice( note, velocity ) {
	this.originalFrequency = frequencyFromNoteNumber( note );

	// create osc 1
	this.osc1 = audioContext.createOscillator();
	this.updateOsc1Frequency();
	this.osc1.type = waveforms[currentOsc1Waveform];

	this.osc1Gain = audioContext.createGain();
	this.osc1Gain.gain.value = 0.005 * currentOsc1Mix;
//	this.gain.gain.value = 0.05 + (0.33 * velocity);
	this.osc1.connect( this.osc1Gain );

	// create osc 2
	this.osc2 = audioContext.createOscillator();
	this.updateOsc2Frequency();
	this.osc2.type = waveforms[currentOsc2Waveform];

	this.osc2Gain = audioContext.createGain();
	this.osc2Gain.gain.value = 0.005 * currentOsc2Mix;
	this.osc2.connect( this.osc2Gain );

	// create modulator osc
	this.modOsc = audioContext.createOscillator();
	this.modOsc.type = 	waveforms[currentModWaveform];
	this.modOsc.frequency.value = currentModFrequency * modOscFreqMultiplier;

	this.modOsc1Gain = audioContext.createGain();
	this.modOsc.connect( this.modOsc1Gain );
	this.modOsc1Gain.gain.value = currentModOsc1/10;
	this.modOsc1Gain.connect( this.osc1.frequency );	// tremolo

	this.modOsc2Gain = audioContext.createGain();
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
	this.modFilterGain = audioContext.createGain();
	this.modOsc.connect( this.modFilterGain );
	this.modFilterGain.gain.value = currentFilterMod*24;
	this.modFilterGain.connect( this.filter1.detune );	// filter tremolo
	this.modFilterGain.connect( this.filter2.detune );	// filter tremolo

	// create the volume envelope
	this.envelope = audioContext.createGain();
	this.filter2.connect( this.envelope );
	this.envelope.connect( effectChain );

	// set up the volume and filter envelopes
	var now = audioContext.currentTime;
	var envAttackEnd = now + (currentEnvA/20.0);

	this.envelope.gain.value = 0.0;
	this.envelope.gain.setValueAtTime( 0.0, now );
	this.envelope.gain.linearRampToValueAtTime( 1.0, envAttackEnd );
	this.envelope.gain.setTargetAtTime( (currentEnvS/100.0), envAttackEnd, (currentEnvD/100.0)+0.001 );

    var pitchFrequency = this.originalFrequency;
    var filterInitLevel = filterFrequencyFromCutoff( pitchFrequency, currentFilterCutoff/100 );
	var filterAttackLevel = filterFrequencyFromCutoff( pitchFrequency, currentFilterCutoff/100 + 
		(currentFilterEnv/120) );
	var filterSustainLevel = filterFrequencyFromCutoff( pitchFrequency, currentFilterCutoff/100 + 
		((currentFilterEnv/120) * (currentFilterEnvS/100.0)) );
	var filterAttackEnd = now + (currentFilterEnvA/20.0);

/*
	console.log( "pitchFrequency: " + pitchFrequency + " filterInitLevel: " + filterInitLevel + 
				 " filterAttackLevel: " + filterAttackLevel + " filterSustainLevel: " + filterSustainLevel );
*/	this.filter1.frequency.value = filterInitLevel;
	this.filter1.frequency.setValueAtTime( filterInitLevel, now );
	this.filter1.frequency.linearRampToValueAtTime( filterAttackLevel, filterAttackEnd );
	this.filter1.frequency.setTargetAtTime( filterSustainLevel, filterAttackEnd, (currentFilterEnvD/100.0) );
	this.filter2.frequency.value = filterInitLevel;
	this.filter2.frequency.setValueAtTime( filterInitLevel, now );
	this.filter2.frequency.linearRampToValueAtTime( filterAttackLevel, filterAttackEnd );
	this.filter2.frequency.setTargetAtTime( filterSustainLevel, filterAttackEnd, (currentFilterEnvD/100.0) );

	this.osc1.start(0);
	this.osc2.start(0);
	this.modOsc.start(0);
}


Voice.prototype.setModWaveform = function( value ) {
	this.modOsc.type = value;
}

Voice.prototype.updateModFrequency = function( value ) {
	this.modOsc.frequency.value = value;
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
	this.osc1.detune.value = currentOsc1Detune + currentPitchWheel * 500;	// value in cents - detune major fifth.
}

Voice.prototype.updateOsc1Mix = function( value ) {
	this.osc1Gain.gain.value = 0.005 * value;
}

Voice.prototype.setOsc2Waveform = function( value ) {
	this.osc2.type = value;
}

Voice.prototype.updateOsc2Frequency = function( value ) {
	this.osc2.frequency.value = (this.originalFrequency*Math.pow(2,currentOsc2Octave-1));
	this.osc2.detune.value = currentOsc2Detune + currentPitchWheel * 500;	// value in cents - detune major fifth.
}

Voice.prototype.updateOsc2Mix = function( value ) {
	this.osc2Gain.gain.value = 0.005 * value;
}

Voice.prototype.setFilterCutoff = function( value ) {
	var now =  audioContext.currentTime;
	var filterFrequency = filterFrequencyFromCutoff( this.originalFrequency, value/100 );
	this.filter1.frequency.cancelScheduledValues( now );
	this.filter1.frequency.setValueAtTime( filterFrequency, now );
	this.filter2.frequency.cancelScheduledValues( now );
	this.filter2.frequency.setValueAtTime( filterFrequency, now );
}

Voice.prototype.setFilterQ = function( value ) {
	this.filter1.Q.value = value;
	this.filter2.Q.value = value;
}

Voice.prototype.setFilterMod = function( value ) {
	this.modFilterGain.gain.value = currentFilterMod*24;
}

Voice.prototype.noteOff = function() {
	var now =  audioContext.currentTime;
	var release = now + (currentEnvR/10.0);	
    var initFilter = filterFrequencyFromCutoff( this.originalFrequency, currentFilterCutoff/100 * (1.0-(currentFilterEnv/100.0)) );

//    console.log("noteoff: now: " + now + " val: " + this.filter1.frequency.value + " initF: " + initFilter + " fR: " + currentFilterEnvR/100 );
	this.envelope.gain.cancelScheduledValues(now);
	this.envelope.gain.setValueAtTime( this.envelope.gain.value, now );  // this is necessary because of the linear ramp
	this.envelope.gain.setTargetAtTime(0.0, now, (currentEnvR/100));
	this.filter1.frequency.cancelScheduledValues(now);
	this.filter1.frequency.setValueAtTime( this.filter1.frequency.value, now );  // this is necessary because of the linear ramp
	this.filter1.frequency.setTargetAtTime( initFilter, now, (currentFilterEnvR/100.0) );
	this.filter2.frequency.cancelScheduledValues(now);
	this.filter2.frequency.setValueAtTime( this.filter2.frequency.value, now );  // this is necessary because of the linear ramp
	this.filter2.frequency.setTargetAtTime( initFilter, now, (currentFilterEnvR/100.0) );

	this.osc1.stop( release );
	this.osc2.stop( release );
}

var currentOctave = 3;
var modOscFreqMultiplier = 1;
var moDouble = false;
var moQuadruple = false;

function changeModMultiplier() {
	modOscFreqMultiplier = (moDouble?2:1)*(moQuadruple?4:1);
	onUpdateModFrequency( currentModFrequency );
}

function keyDown( ev ) {
	if ((ev.keyCode==49)||(ev.keyCode==50)) {
		if (ev.keyCode==49)
			moDouble = true;
		else if (ev.keyCode==50)
			moQuadruple = true;
		changeModMultiplier();
	}

	var note = keys[ev.keyCode];
	if (note)
		noteOn( note + 12*(3-currentOctave), 0.75 );
//	console.log( "key down: " + ev.keyCode );

	return false;
}

function keyUp( ev ) {
	if ((ev.keyCode==49)||(ev.keyCode==50)) {
		if (ev.keyCode==49)
			moDouble = false;
		else if (ev.keyCode==50)
			moQuadruple = false;
		changeModMultiplier();
	}

	var note = keys[ev.keyCode];
	if (note)
		noteOff( note + 12*(3-currentOctave) );
//	console.log( "key up: " + ev.keyCode );

	return false;
}
var pointers=[];

function touchstart( ev ) {
	for (var i=0; i<ev.targetTouches.length; i++) {
	    var touch = ev.targetTouches[0];
		var element = touch.target;

		var note = parseInt( element.id.substring( 1 ) );
		console.log( "touchstart: id: " + element.id + "identifier: " + touch.identifier + " note:" + note );
		if (!isNaN(note)) {
			noteOn( note + 12*(3-currentOctave), 0.75 );
			var keybox = document.getElementById("keybox")
			pointers[touch.identifier]=note;
		}
	}
	ev.preventDefault();
}

function touchmove( ev ) {
	for (var i=0; i<ev.targetTouches.length; i++) {
	    var touch = ev.targetTouches[0];
		var element = touch.target;

		var note = parseInt( element.id.substring( 1 ) );
		console.log( "touchmove: id: " + element.id + "identifier: " + touch.identifier + " note:" + note );
		if (!isNaN(note) && pointers[touch.identifier] && pointers[touch.identifier]!=note) {
			noteOff(pointers[touch.identifier] + 12*(3-currentOctave));
			noteOn( note + 12*(3-currentOctave), 0.75 );
			var keybox = document.getElementById("keybox")
			pointers[touch.identifier]=note;
		}
	}
	ev.preventDefault();
}

function touchend( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	console.log( "touchend: id: " + ev.target.id + " note:" + note );
	if (note != NaN)
		noteOff( note + 12*(3-currentOctave) );
	pointers[ev.pointerId]=null;
	var keybox = document.getElementById("keybox")
	ev.preventDefault();
}

function touchcancel( ev ) {
	console.log( "touchcancel" );
	ev.preventDefault();
}

function pointerDown( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointer down: id: " + ev.pointerId
			+ " target: " + ev.target.id + " note:" + note );
	if (!isNaN(note)) {
		noteOn( note + 12*(3-currentOctave), 0.75 );
		var keybox = document.getElementById("keybox")
		pointers[ev.pointerId]=note;
	}
	ev.preventDefault();
}

function pointerMove( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointer move: id: " + ev.pointerId 
			+ " target: " + ev.target.id + " note:" + note );
	if (!isNaN(note) && pointers[ev.pointerId] && pointers[ev.pointerId]!=note) {
		if (pointers[ev.pointerId])
			noteOff(pointers[ev.pointerId] + 12*(3-currentOctave));
		noteOn( note + 12*(3-currentOctave), 0.75 );
		pointers[ev.pointerId]=note;
	}
	ev.preventDefault();
}

function pointerUp( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointer up: id: " + ev.pointerId + " note:" + note );
	if (note != NaN)
		noteOff( note + 12*(3-currentOctave) );
	pointers[ev.pointerId]=null;
	var keybox = document.getElementById("keybox")
	ev.preventDefault();
}

function pointerOver( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointerover: id: " + ev.pointerId + " note:" + note );
	ev.preventDefault();
}
function pointerOut( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointerout: id: " + ev.pointerId + " note:" + note );
	ev.preventDefault();
}
function pointerEnter( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointerenter: id: " + ev.pointerId + " note:" + note );
	ev.preventDefault();
}
function pointerLeave( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointerleave: id: " + ev.pointerId + " note:" + note );
	ev.preventDefault();
}
function pointerCancel( ev ) {
	var note = parseInt( ev.target.id.substring( 1 ) );
	if (pointerDebugging)
		console.log( "pointercancel: id: " + ev.pointerId + " note:" + note );
	ev.preventDefault();
}

function onChangeOctave( ev ) {
	currentOctave = ev.target.selectedIndex;
}


function initAudio() {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	try {
    	audioContext = new AudioContext();
  	}
  	catch(e) {
    	alert('The Web Audio API is apparently not supported in this browser.');
  	}

	window.addEventListener('keydown', keyDown, false);
	window.addEventListener('keyup', keyUp, false);
	setupSynthUI();

	isMobile = (navigator.userAgent.indexOf("Android")!=-1)||(navigator.userAgent.indexOf("iPad")!=-1)||(navigator.userAgent.indexOf("iPhone")!=-1);

	// set up the master effects chain for all voices to connect to.
	effectChain = audioContext.createGain();
	waveshaper = new WaveShaper( audioContext );
    effectChain.connect( waveshaper.input );
    onUpdateDrive( currentDrive );

    if (!isMobile)
    	revNode = audioContext.createConvolver();
    else
    	revNode = audioContext.createGain();
	revGain = audioContext.createGain();
	revBypassGain = audioContext.createGain();

    volNode = audioContext.createGain();
    volNode.gain.value = currentVol;
    waveshaper.output.connect( revNode );
    waveshaper.output.connect( revBypassGain );
    revNode.connect( revGain );
    revGain.connect( volNode );
    revBypassGain.connect( volNode );
    onUpdateReverb( {currentTarget:{value:currentRev}} );

    volNode.connect( audioContext.destination );
    onUpdateVolume( {currentTarget:{value:currentVol}} );

    if (!isMobile) {
	  	var irRRequest = new XMLHttpRequest();
		irRRequest.open("GET", "sounds/irRoom.wav", true);
		irRRequest.responseType = "arraybuffer";
		irRRequest.onload = function() {
	  		audioContext.decodeAudioData( irRRequest.response, 
	  			function(buffer) { if (revNode) revNode.buffer = buffer; else console.log("no revNode ready!")} );
		}
		irRRequest.send();
	}

}

window.onload=initAudio;
