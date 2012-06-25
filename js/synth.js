var voices = new Array();
var audioContext = null;
var FOURIER_SIZE = 4096;
var wave = false;
var ATTACKTIME = 0.01;
var RELEASETIME = 1;

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

function controller( number, value ) {
	for (var i=0; i<255; i++) {
		if (voices[i] != null) {
			if (number == 1)
				voices[i].setFilterFrequency(value);
			else if (number == 2)
				voices[i].setFilterQ(value);
		}
	}
}

/*
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
	this.osc = audioContext.createOscillator();
	this.osc.frequency.value = frequencyFromNoteNumber( note );
	this.osc.type = this.osc.TRIANGLE;
	this.envelope = audioContext.createGainNode();
	this.gain = audioContext.createGainNode();
	this.gain.gain.value = 0.25;
	this.osc.connect( this.gain );
	this.filter = audioContext.createBiquadFilter();
	this.filter.type = this.filter.LOWPASS;
	this.filter.frequency.value = 2000 * velocity;
	this.filter.Q.value = velocity * 20;
	this.gain.connect( this.filter );
	this.filter.connect( this.envelope );
	this.envelope.connect( audioContext.destination );
	this.envelope.gain.setValueAtTime(0,0);
	var now = audioContext.currentTime;
	this.envelope.gain.setValueAtTime( 0, now );
	this.envelope.gain.linearRampToValueAtTime( 1.0, now + ATTACKTIME );
	this.osc.noteOn(0);
}

Voice.prototype.setFilterFrequency = function( value ) {
	// value is 0-1; scale to 0-1000.

//	this.filter.frequency.setTargetValueAtTime( value * 1000, audioContext.currentTime, 0.1 );
	this.filter.frequency.value = value * 5000;
}

Voice.prototype.setFilterQ = function( value ) {
	// value is 0-1; scale to 0-50.

//	this.filter.Q.setTargetValueAtTime( value * 50, audioContext.currentTime, 0.1 );
	this.filter.Q.value = value * 50;
}

Voice.prototype.noteOff = function() {
	var now =  audioContext.currentTime;
	this.envelope.gain.setValueAtTime( this.envelope.gain.value, now );
	this.envelope.gain.linearRampToValueAtTime( 0.0, now + RELEASETIME );
	this.osc.noteOff( now + RELEASETIME );
}

function initAudio() {
	try {
    	audioContext = new webkitAudioContext();
  	}
  	catch(e) {
    	alert('Web Audio API is not supported in this browser');
  	}
}

window.onload=initAudio;
