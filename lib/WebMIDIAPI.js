var _Jazz = null;

//init: create plugin
window.addEventListener('load', function() {

    if (!window.navigator.getMIDIAccess)
        window.navigator.getMIDIAccess = _getMIDIAccess;

    // load the Jazz plugin
    var o1 = document.createElement("object");
    o1.id = "_Jazz1";
    o1.classid = "CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90";

    var o2 = document.createElement("object");
    o2.id = "_Jazz2"; 
    o2.type="audio/x-jazz";
    o1.appendChild(o2);

    var e = document.createElement("p");
    e.appendChild(document.createTextNode("This page requires the "));

    var a = document.createElement("a");
    a.appendChild(document.createTextNode("Jazz plugin"));
    a.href = "http://jazz-soft.net/";

    e.appendChild(a);
    e.appendChild(document.createTextNode("."));
    o2.appendChild(e);

    var insertionPoint = document.getElementById("MIDIPlugin");
    if (!insertionPoint)
        insertionPoint = document.body;
    insertionPoint.appendChild(o1);
});

function _getMIDIAccess( successCallback, errorCallback ) {
    new MIDIAccess( successCallback, errorCallback );
    return;
}

function MIDIAccess( successCallback, errorCallback ) {
    this._debug = false;
    this.Jazz=document.getElementById("_Jazz1"); 
    if(!this.Jazz || !this.Jazz.isJazz) 
        this.Jazz = document.getElementById("_Jazz2");
    if (this.Jazz) {
        this._successCallback = successCallback;
        window.setTimeout( _onReady.bind(this), 3 );
    } else {
        if (errorCallback)
            errorCallback();
    }
    return this;
}

function _onReady() {
    if (this._successCallback)
        this._successCallback( this );
}


MIDIAccess.prototype.enumerateInputs = function(  ) {
    if (!this.Jazz)
        return null;
    var list=this.Jazz.MidiInList();
    var inputs = new Array( list.length );
  
    for ( var i=0; i<list.length; i++ ) {
        inputs[i] = new MIDIPort( this, list[i], i, "input" );
    }
    return inputs;
}

MIDIAccess.prototype.enumerateOutputs = function(  ) {
    if (!this.Jazz)
        return null;
    var list=this.Jazz.MidiOutList();
    var outputs = new Array( list.length );
  
    for ( var i=0; i<list.length; i++ ) {
        outputs[i] = new MIDIPort( this, list[i], i, "output" );
    }
    return outputs;
}

MIDIAccess.prototype.getInput = function( target ) {
    if (target==null)
        return null;
    return new MIDIInput( this, target );
}

MIDIAccess.prototype.getOutput = function( target ) {
    if (target==null)
        return null;
    return new MIDIOutput( this, target );
}

function MIDIPort( midi, port, index, type ) {
    this._index = index;
    this._midi = midi;
    this.type = type;

    // Can't get manu/version from Jazz
    this.name = port;
    this.manufacturer = "<manufacturer unknown>";
    this.version = "<version not supported>";
    this.fingerprint = "" + index + "." + this.name;
}

MIDIPort.prototype.toString = function() {
    return ("type: "+ this.type + "name: '" + this.name + "' manufacturer: '" + 
    this.manufacturer + "' version: " + this.version + " fingerprint: '" + this.fingerprint + "'" );
}

// LIMITATION: no version number/manufacturer
// LIMITATION: Jazz can only support one input and one output device at a time.
// LIMITATION: Jazz doesn't have sysex (in or out) support.



function MIDIInput( midiAccess, target ) {
  // target can be a MIDIPort or DOMString 
  if ( target instanceof MIDIPort ) {
    this._deviceName = target.name;
    this._index = target._index;
  } else if ( target.isString() ) { // fingerprint 
    var dot = target.indexOf(".");
    this._index = parseInt( target.slice( 0, dot ) );
    this._deviceName = target.slice( dot + 1 );
  } else { // target is numerical index
    this._index = target;
    var list=this.Jazz.MidiInList();
    this._deviceName = list[target];
  }

  this.onmessage = null;
  this._midiAccess = midiAccess;

  this._input = midiAccess.Jazz.MidiInOpen( this._index, _midiProc.bind(this) );
}

// this is the biggest change in the spec - how MIDI messages are returned to the callback-
// from what MIDIBridge currently sends (which is more short-message-like).
function _midiProc( timestamp, status, data0, data1 ) {
  if (this._midiAccess._debug) 
    console.log( "MIDI data received (hex): " + status.toString(16) + " " + m.data1.toString(16) + " " + m.data2.toString(16) );

  var message = new MIDIMessage();
  message.timestamp = parseFloat( timestamp.toString());
  message.data = new Uint8Array(3);
  message.data[0] = status;
  message.data[1] = data0;
  message.data[2] = data1;

  var messages = new Array( message );

  if (this.onmessage)
    this.onmessage( messages );
  // TODO: need to correctly fire onmessage as an event dispatch

}

function MIDIOutput( midiAccess, target ) {
  // target can be a MIDIPort or DOMString 
  if ( target instanceof MIDIPort ) {
    this._deviceName = target.name;
    this._index = target._index;
  } else if ( target.isString() ) { // fingerprint 
    var dot = target.indexOf(".");
    this._index = parseInt( target.slice( 0, dot ) );
    this._deviceName = target.slice( dot + 1 );
  } else { // target is numerical index
    this._index = target;
    var list=this.Jazz.MidiOutList();
    this._deviceName = list[target];
  }

  this._midiAccess = midiAccess;
  this._output = midiAccess.Jazz.MidiOutOpen(this._deviceName);
}

MIDIOutput.prototype.sendMessage = function( status, data0, data1 ) {
  var message = this._midiAccess.Jazz.MidiOut( status, data0, data1 );
  return true;
}

function MIDIMessage() {
  this.timestamp = null;
//  this.status = null;
//  this.channel = null;
  this.data = null;
}




// from this point on, not done.
MIDIOutput.prototype.sendMIDIMessage = function( message ) {
  // TODO: send a MIDIMessage.  Can't do this with MIDIBridge if it's sysex.
  return false;
}





// ISSUE: MIDIOutput - "returns a boolean signifying whether the operation was successful" is untenable
// ISSUE: MIDIOutput - need a send with no timestamp.  Suggest getting rid of timestamp on simple send.
// ISSUE: not even all short messages have channel (e.g. realtime messages).  Should recombine to status(+channel),data,data
// ISSUE: Long messages may not have channel either - MIDIMessage create should not have status byte separate, either.



