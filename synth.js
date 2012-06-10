var notes = new Array();
var envelopes = new Array();
var audioContext = null;
var FOURIER_SIZE = 4096;
var wave = false;
var ATTACKTIME = 0.5;
var RELEASETIME = 1;

function frequencyFromNoteNumber( note ) {
	return 440 * Math.pow(2,(note-69)/12);
}

function noteOn( note ) {
	if (notes[note] == null) {
		// Create a new synth node
		var oscillatorNode = audioContext.createOscillator();
		oscillatorNode.frequency.value = frequencyFromNoteNumber( note );
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
			oscillatorNode.type=oscillatorNode.SINE;
		}

		var envelope = audioContext.createGainNode();
		oscillatorNode.connect( envelope );
		envelope.connect( audioContext.destination );
		envelope.gain.setValueAtTime(0,0);
		oscillatorNode.noteOn(0);
		envelope.gain.linearRampToValueAtTime( 1.0, audioContext.currentTime + ATTACKTIME );

		notes[note] = oscillatorNode;
		envelopes[note] = envelope;
	}
}

function noteOff( note ) {
	if (notes[note] != null) {
		// Shut off the note playing and clear it 
		var end =  audioContext.currentTime + RELEASETIME;
		envelopes[note].gain.linearRampToValueAtTime( 0.0, end );
		notes[note].noteOff( end );
		notes[note] = null;
		envelopes[note] = null;
	}

}

function controller( number, value ) {

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
