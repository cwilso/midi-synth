/* 
 *  copyright 2012 abudaan
 *  code licensed under MIT 
 *  http://abumarkub.net/midibridge/license
 *  
 *  
 *  This version is supported by:
 *   - Firefox 3.5+ Linux | OSX | Windows
 *   - Chrome 4.0+  Linux | OSX | Windows
 *   - Safari 4.0+   ---  | OSX |   ---
 *   - Opera 10.5+  Linux | OSX | Windows
 *   - Internet Explorer 8.0+
 * 
 *  Safari/Windows is not supported because it does not fully support Live Connect
 * 
 *  Note for IE8 users: if you include MidiBridge.js (or preferably the minified version of it: midibridge-latest.min.js) in your html,
 *  the method addEventListener will be added to the window object. In fact this method is just a wrapper around the attachEvent method,
 *  see code at the bottom of this file.
 *  
 */

(function() {
    
    try {
        console.log("");
    } catch (e) {
        console = {
            'log': function(args) {}
        };
    }
    
    var midiBridge = {
        
        //all MIDI commands
        NOTE_OFF : 0x80, //128
        NOTE_ON : 0x90, //144
        POLY_PRESSURE : 0xA0, //160
        CONTROL_CHANGE : 0xB0, //176
        PROGRAM_CHANGE : 0xC0, //192
        CHANNEL_PRESSURE : 0xD0, //208
        PITCH_BEND : 0xE0, //224
        SYSTEM_EXCLUSIVE : 0xF0, //240
        MIDI_TIMECODE : 241,
        SONG_POSITION : 242,
        SONG_SELECT : 243,
        TUNE_REQUEST : 246,
        EOX : 247,
        TIMING_CLOCK : 248,
        START : 250,
        CONTINUE : 251,
        STOP : 252,
        ACTIVE_SENSING : 254,
        SYSTEM_RESET : 255,
        
        //other statics
        NOTE_NAMES_SHARP : "sharp",
        NOTE_NAMES_FLAT : "flat",
        NOTE_NAMES_SOUNDFONT : "soundfont",
        NOTE_NAMES_ENHARMONIC_SHARP : "enh-sharp",
        NOTE_NAMES_ENHARMONIC_FLAT : "enh-flat",
        
        //rest
        version : "0.6.3",
        noteNameModus : "sharp",
        userAgent : ""
    },
    filterCommands = null,//these are the command codes that get filtered; the midibridge will not pass them on to your application
    midiCommands = [],//all existing command codes
    noteNames = {},
    javaDir = "lib",//directory of the applet, relative to the directory of the html file
    debug = false,
    onReady = null,
    onError = null,  
    onSequencerMIDIData = null,
    onSequencerMetaData = null,
    midiInputListeners = {},
    midiBridgeJar = "midiapplet-" + midiBridge.version + ".jar",
    applet = null,
    MIDIAccess = null,
    Sequencer = null,
    sequencerJs = null,
    ua = navigator.userAgent.toLowerCase(),
    userAgent;
    
    
    if(ua.indexOf("firefox") !== -1){
        userAgent = "firefox";
    }else if(ua.indexOf("chrome") !== -1){
        userAgent = "chrome";
    }else if(ua.indexOf("safari") !== -1){
        userAgent = "safari";
    }else if(ua.indexOf("opera") !== -1){
        userAgent = "opera";
    }else if(ua.indexOf("msie 7") !== -1){
        userAgent = "msie7";
    }else if(ua.indexOf("msie 8") !== -1){
        userAgent = "msie8";
    }else if(ua.indexOf("msie 9") !== -1){
        userAgent = "msie9";
    }

    if(ua.indexOf("linux") !== -1){
        userAgent += "/linux";
    }else if(ua.indexOf("macintosh") !== -1){ 
        userAgent += "/osx";
    }else if(ua.indexOf("windows") !== -1){ 
        userAgent += "/win";
    }
    
    midiBridge.userAgent = userAgent;
    //console.log(ua," => ",userAgent);
    
    
    //human readable representation of command byte in MIDI data
    midiCommands[128] = "NOTE OFF";
    midiCommands[144] = "NOTE ON";
    midiCommands[160] = "POLY PRESSURE";//POLYPHONIC AFTERTOUCH
    midiCommands[176] = "CONTROL CHANGE";
    midiCommands[192] = "PROGRAM CHANGE";
    midiCommands[208] = "CHANNEL PRESSURE";//AFTERTOUCH
    midiCommands[224] = "PITCH BEND";
    midiCommands[240] = "SYSTEM EXCLUSIVE";
    midiCommands[241] = "MIDI TIMECODE";
    midiCommands[242] = "SONG POSITION";
    midiCommands[243] = "SONG SELECT";
    midiCommands[244] = "RESERVED 1";
    midiCommands[245] = "RESERVED 2";
    midiCommands[246] = "TUNE REQUEST";
    midiCommands[247] = "EOX";
    midiCommands[248] = "TIMING CLOCK";
    midiCommands[249] = "RESERVED 3";
    midiCommands[250] = "START";
    midiCommands[251] = "CONTINUE";
    midiCommands[252] = "STOP";
    midiCommands[254] = "ACTIVE SENSING";
    midiCommands[255] = "SYSTEM RESET";
        
    
    //notenames in different modi
    noteNames = {
        "sharp" : ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        "flat" : ["C", "D&#9837;", "D", "E&#9837;", "E", "F", "G&#9837;", "G", "A&#9837;", "A", "B&#9837;", "B"],
        "soundfont" : ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
        "enh-sharp" : ["B#", "C#", "C##", "D#", "D##", "E#", "F#", "F##", "G#", "G##", "A#", "A##"],
        "enh-flat" : ["D&#9837;&#9837;", "D&#9837;", "E&#9837;&#9837;", "E&#9837;", "F&#9837;", "G&#9837;&#9837;", "G&#9837;", "A&#9837;&#9837;", "A&#9837;", "B&#9837;&#9837;", "B&#9837;", "C&#9837;"]
    };

    /**
     *  static method called to initialize the MidiBridge
     *  possible arguments:
     *  1) callback [function] callback when the MidiBridge is ready
     *  2) configuration object
     *      - onError : [function] callback in case of an error
     *      - debug : [true,false] midiBridge prints out error messages
     *      - javaDir : [string] the folder where you store the midiapplet.jar on your webserver, defaults to "java"
     *      - passCommands : [array] an array that contains MIDI commands that are send to the application
     *      - filterCommands : [array] an array that contains MIDI commands that are *not* send to the application
     */
    midiBridge.init = function () {
                
        function browserNotSupported(browser,alternatives){
            document.body.style.color = "#f00";
            document.body.style.fontSize = "20px";
            document.body.style.padding = "50px";
            document.body.style.lineHeight = "1.4em";
            document.body.innerHTML = browser + " is not supported.<br/>please use " + alternatives;            
        }
        if(userAgent === "safari/win"){
            browserNotSupported("Safari for Windows", "Internet Explorer 8+, Chrome, Firefox or Opera");
            return;
        }else if(userAgent === "msie7/win"){
            browserNotSupported("Internet Explorer 7", "Internet Explorer 8+, Chrome, Firefox or Opera");
            return;
        }
        
        var args = Array.prototype.slice.call(arguments);
        
        if (args.length >= 1)
            onReady = args[0];
        if (args.length >= 2)
            onError = args[1];
        debug = true;

        //very simple java plugin detection
        //console.log(navigator.javaEnabled())
        if (!navigator.javaEnabled()) {
            if (onError) {
                onError("No java plugin found; install or enable the java plugin");
            } else {
                //console.log("no java plugin found; install or enable the java plugin");
                document.body.style.color = "#f00";
                document.body.style.fontSize = "20px";
                document.body.style.padding = "50px";
                document.body.innerHTML = "No java plugin found; install or enable the java plugin";
            }
            return;
        }
        
        loadJava();
    };
    
    //called by the applet in case of error (i.e. the user doesn't have the right version of the Java plugin)
    midiBridge.error = function(message){
        if(onError){
            onError(message);
        }else if(debug){
            console.log(message);
        }
    }

    //called by the applet when the applet is initialized
    midiBridge.ready = function(){
        var timeout = 25;
        this.__ready = true;
        
        (function getApplet(callback){
            if(debug){
                console.log("applet:",applet === null);
            }
            
            try {
                applet = getObject("midibridge-applet");
                applet.ready();
            } catch(e) {
                if(debug){
                    console.log(e)
                }
                setTimeout(function(){
                    getApplet(callback);
                },timeout);
                return;
            }

            if(!applet){
                if(debug){
                    console.log(applet);
                }
                setTimeout(function(){
                    getApplet(callback);
                },timeout);
            }else{
                callback();
            }
        })(wrapJavaObjects);
    }
        
    function wrapJavaObjects(){

        MIDIAccess = applet.getMIDIAccess();
        Sequencer = applet.getSequencer();


        //wrap the Java Sequencer object
        
        var stripBase64Header = function(data){
            return data.replace(/data:audio\/mid[i]?;base64,/,"");
        }

        sequencerJs = {
            addEventListener:function(eventId,callback,context){
                if(context){//send events via AppletContext
                    Sequencer.addEventListener(eventId);
                    if(eventId === "midimessage"){
                        onSequencerMIDIData = callback;
                    }else if(eventId === "metamessage"){
                        onSequencerMetaData = callback;
                    } 
                }else{//send events via Live Connect
                    Sequencer.addEventListener(eventId,{
                        listener:callback
                    });
                }
            },
            stop:function(){
                Sequencer.stop();
            },
            play:function(){
                Sequencer.play();
            },
            pause:function(){
                Sequencer.pause();
            },
            isPlaying:function(){
                return Sequencer.isRunning();
            },
            loadBase64String:function(data){
                return Sequencer.loadBase64String(stripBase64Header(data));
            },
            playBase64String:function(data){
                return Sequencer.playBase64String(stripBase64Header(data));
            },
            getMicrosecondPosition:function(){
                return Sequencer.getMicrosecondPosition();
            },
            setMicrosecondPosition:function(microseconds){
                Sequencer.setMicrosecondPosition(microseconds);
            },
            setTempoInBPM:function(bpm){
                Sequencer.setTempoInBPM(bpm);
            },
            getTempoFactor:function(){
                return Sequencer.getTempoFactor();
            },
            setTempoFactor:function(factor){
                Sequencer.setTempoFactor(factor);
            },
            getTempoInBPM:function(){
                return Sequencer.getTempoInBPM();
            },
            getTracks:function(){
                return Sequencer.getTracks();
            },
            muteTrack:function(index){
                return Sequencer.muteTrack(index);
            },
            unmuteTrack:function(index){
                return Sequencer.unmuteTrack(index);
            },
            getSequence:function(){
                return Sequencer.getSequence();
            },
            setDirectOutput:function(output){
                return Sequencer.setDirectOutput(output.getDevice());
            },
            removeDirectOutput:function(){
                Sequencer.removeDirectOutput();
            },
            hasDirectOutput:function(){
                return Sequencer.hasDirectOutput();
            }
        };
        
        
        //wrap the Java MIDI input and output devices

        var wrapDevice = function(device){
            if(!device){
                if(debug){
                    console.log("device does not exist");
                    return null;
                }                
                return null;
            }
            try{
                if(device.deviceType == "input"){
                    device = MIDIAccess.getInput(device);
                }else if(device.deviceType == "output"){
                    device = MIDIAccess.getOutput(device);
                }else{
                    if(debug){
                        console.log("error while getting device",device.deviceName);
                        return null;
                    }                
                    return null;
                }
            }catch(e){
                if(debug){
                    console.log("error while getting device",device.deviceName);
                    return null;
                }                
                return null;
            }

            return {
                close:function(){
                    device.close();
                },
                open:function(){
                    if(device.open()){
                        return true;
                    }else{
                        if(debug){
                            console.log("could not open device", device.deviceName);
                        }
                        return false;
                    }
                },
                addEventListener:function(eventId,callback,context){
                    if(context){//send events via AppletContext
                        //passing events from Java to Javascript is faster with AppletContext than with Live Connect!
                        device.addEventListener(eventId);
                        midiInputListeners[device.id] = function(e){
                            console.log("applet context");
                            if(filterCommands && filterCommands[e.command]){
                                if(debug){
                                    console.log("MIDI message intercepted", e.command, e.channel, e.data1, e.data2);
                                }
                            }else{
                                callback(e);
                            }                       
                        }                           
                    }else{//send events via Live Connect
                        device.addEventListener(eventId,{
                            listener:function(e){
                                if(filterCommands && filterCommands[e.command]){
                                    if(debug){
                                        console.log("MIDI message intercepted", e.command, e.channel, e.data1, e.data2);
                                    }
                                }else{
                                    callback(e);
                                }
                            }
                        });
                }
            },
            sendMIDIMessage:function(e){
                if(device.getDevice().isOpen()){
                    //@todo:make this dependent on what send method is selected (AppletContext or Live Connect)
                    //device.sendMIDIMessage(MIDIAccess.createMIDIMessage(e.command,e.channel,e.data1,e.data2,e.timeStamp));
                    //device.sendMIDIMessage(e.command,e.channel,e.data1,e.data2,e.timeStamp);
                    device.sendMIDIMessage(e);
                }
            },
            toString:function(){
                return device.toString();
            },
            getDevice:function(){
                return device;
            },
            setDirectOutput:function(output){
                return device.setDirectOutput(output.getDevice());
            },
            removeDirectOutput:function(){
                device.removeDirectOutput();
            },
            hasDirectOutput:function(){
                return device.hasDirectOutput();
            },
            deviceType:device.deviceType,
            deviceName:device.deviceName,
            deviceManufacturer:device.deviceManufacturer,
            deviceDescription:device.deviceDescription
        }
    };
        
        
    //wrap the Java MIDIAccess object and pass it to the callback of midiBridge.init();
        
    onReady({
        enumerateInputs:function(){
            return MIDIAccess.enumerateInputs();
        },
        enumerateOutputs:function(){
            return MIDIAccess.enumerateOutputs();
        },
        getInput:function(input){
            return wrapDevice(input);                   
        },
        getOutput:function(output){
            return wrapDevice(output);                   
        },
        closeInputs:function(){
            MIDIAccess.closeInputs();
        },
        closeOutputs:function(){
            MIDIAccess.closeOutputs();
        },
        createMIDIMessage : function(command,channel,data1,data2,timeStamp){
            timeStamp = timeStamp || -1;
            //var MIDIMessage = java.lang.Thread.currentThread().getContextClassLoader().loadClass("net.abumarkub.midi.MIDIMessage"); 
            return MIDIAccess.createMIDIMessage(command,channel,data1,data2,timeStamp);
        }
    });
}
        
midiBridge.getSequencer = function(){
        
    if(!sequencerJs){
        if(debug){
            console.log("Sequencer not (yet) available");
            return null;
        }
        return null;
    }
        
    return sequencerJs;
}
    
//if data is sent via AppletContext it arrives here
midiBridge.onMIDIData = function(){
        
    var args = Array.prototype.slice.call(arguments);
        
    midiInputListeners[args[0]]({
        command:args[1],
        channel:args[2],
        data1:args[3],
        data2:args[4],
        timeStamp:args[5],
        toString:function(){
            return args[6];
        }
    });
}

//if data is sent via AppletContext it arrives here
midiBridge.onSequencerMetaData = function(){
        
    var args = Array.prototype.slice.call(arguments);

    if(onSequencerMetaData){
        var msg = {
            type:args[0],
            status:args[1],
            data:[]
        };
        for(var i = 2, maxi = args.length; i < maxi; i++){
            msg.data.push(args[i])
        }
        onSequencerMetaData(msg);
    }
}    
        
//if data is sent via AppletContext it arrives here
midiBridge.onSequencerMIDIData = function(){
        
    var args = Array.prototype.slice.call(arguments);
        
    if(onSequencerMIDIData){
        onSequencerMIDIData({
            command:args[0],
            channel:args[1],
            data1:args[2],
            data2:args[3],
            timeStamp:args[4],
            toString:function(){
                return args[5];
            }
        });
    }
} 
    
midiBridge.getNoteName = function(noteNumber, mode) {
    if(!mode){
        mode = midiBridge.NOTE_NAMES_SHARP;
    }
    var octave = Math.floor(((noteNumber) / 12) - 1),
    noteName = noteNames[mode][noteNumber % 12];
    return noteName + "" + octave;
};

midiBridge.getNoteNumber = function(noteName, octave) {
    var index = -1,
    noteNumber;
    noteName = noteName.toUpperCase();
    for(var key in noteNames) {
        var modus = noteNames[key];
        for(var i = 0, max = modus.length; i < max; i++) {
            if(modus[i] === noteName) {
                index = i;
                break;
            }
        }
    }
    if(index === -1) {
        return "invalid note name";
    }
    noteNumber = (12 + index) + (octave * 12);
    return noteNumber;
};


midiBridge.getCommandVerbose = function(code) {
    return midiCommands[code];
};
    
midiBridge.formatMicroseconds = function(microseconds)
{
    //console.log(microseconds);
    var r = "",     
    t     = (microseconds / 1000 / 1000) >> 0,
    h     = (t / (60 * 60)) >> 0,
    m     = ((t % (60 * 60)) / 60) >> 0,
    s     = t % (60),
    ms    = (((microseconds /1000) - (h * 3600000) - (m * 60000) - (s * 1000)) + 0.5) >> 0;
    
    //console.log(t,h,m,s,ms);
        
    r += h > 0 ?  h + ":" : "";
    r += h > 0 ? m < 10 ? "0" + m : m : m;
    r += ":";
    r += s < 10 ? "0" + s : s;
    r += ":";
    r += ms === 0 ? "000" : ms < 10 ? "00" + ms : ms < 100 ? "0" + ms : ms;
        
    return r;
};

//a div with the applet object is added to the body of your html document
function loadJava(){
    //console.log("loadJava");
    var javaDiv = document.createElement("div"),
    html = "";
        
    //if(userAgent.indexOf("chrome") === -1){
    if(userAgent !== "safari/osx" && userAgent.indexOf("chrome") === -1){
        html += '<object tabindex="0" id="midibridge-applet" type="application/x-java-applet" height="1" width="1">';
        html += '<param name="codebase" value="' + javaDir + '/" />';
        html += '<param name="archive" value="' + midiBridgeJar + '" />';
        html += '<param name="code" value="net.abumarkub.midi.MIDIApplet" />';
        html += '<param name="scriptable" value="true" />';
        html += '<param name="minJavaVersion" value="1.6" />';
        html += 'Your browser needs the Java plugin to use the midibridge. You can download it <a href="http://www.java.com/en/" target="blank" title="abumarkub midibridge download java" rel="abumarkub midibridge download java">here</a>';
        html += '</object>';
    }else{
        html += '<applet id="midibridge-applet" code="net.abumarkub.midi.MIDIApplet.class" archive="' + midiBridgeJar + '" codebase="' + javaDir + '" width="1" height="1" mayscript>';
        html += '<param name="minJavaVersion" value="1.6">';
        html += '</applet>';
    }
                
    javaDiv.setAttribute("id", "midibridge-java");
    javaDiv.innerHTML = html;
    document.body.appendChild(javaDiv);
}

function getObject(objectName) {
    if(userAgent.indexOf("msie") !== -1 || userAgent.indexOf("chrome") !== -1 || userAgent.indexOf("safari") !== -1) {
        return window[objectName];
    } else {
        return document[objectName];
    }
}

        
midiBridge.wrapElement = function(element){
    if(userAgent !== "msie8/win"){
        return;
    }
    element.addEventListener = function(id, callback, bubble){
        element.attachEvent(id, callback);
    }
}
    
//add addEventListener to IE8
if(!window.addEventListener) {
    window.addEventListener = function(id, callback, bubble) {
        window.attachEvent("onload", callback);
    };
}



window.midiBridge = midiBridge;




})(window);






// From this point on: new code for Web MIDI Polyfill.


//init: create plugin
window.addEventListener('load', function() {

  if (!window.navigator.getMIDIAccess)
    window.navigator.getMIDIAccess = _getMIDIAccess;
});

function _getMIDIAccess( successCallback, errorCallback ) {
  new MIDIAccess( successCallback, errorCallback );
  return;
}

function MIDIAccess( successCallback, errorCallback ) {
  this._debug = false;
  if (window.midiBridge) {
    this._successCallback = successCallback;
    window.midiBridge.init( _onReady.bind(this), errorCallback );
  } else {
    if (errorCallback)
      errorCallback();
  }
  return this;
}

function _onReady( methods ) {
    this._enumerateInputs = methods.enumerateInputs;
    this._enumerateOutputs = methods.enumerateOutputs;
    this._getInput = methods.getInput;
    this._getOutput = methods.getOutput;
//    this.closeInputs = methods.closeInputs;
//    this.closeOutputs = methods.closeOutputs;
    this._createMIDIMessage = methods.createMIDIMessage;
/*
        createMIDIMessage : function(command,channel,data1,data2,timeStamp){
            timeStamp = timeStamp || -1;
            //var MIDIMessage = java.lang.Thread.currentThread().getContextClassLoader().loadClass("net.abumarkub.midi.MIDIMessage"); 
            return MIDIAccess.createMIDIMessage(command,channel,data1,data2,timeStamp);
        }
*/ 
  if (this._successCallback)
    this._successCallback( this );
}


MIDIAccess.prototype.enumerateInputs = function(  ) {
  var list=this._enumerateInputs();
  var inputs = new Array( list.length );
  
  for ( var i=0; i<list.length; i++ ) {
      inputs[i] = new MIDIPort( this, list[i], i, "input" );
  }

  return inputs;
}

MIDIAccess.prototype.enumerateOutputs = function(  ) {
  var list=this._enumerateOutputs();
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
  return new MIDIOutput( this, target );
}

MIDIAccess.prototype.createMIDIMessage = function( status, channel, timestamp, data ) {
  var message = new MIDIMessage();
  message.status = status;
  message.channel = channel;
  message.timestamp = timestamp;
  message.data = new Uint8Array(data);
}


function MIDIPort( midi, port, index, type ) {
  this._port = port;
  this._index = index;
  this._midi = midi;
  this.type = type;

  // MIDIBridge problem - need to open/close each one to get the name/manu/version
  var pObj = (type=="input") ? midi._getInput( port ) : midi._getOutput( port );

  this.name = pObj.deviceName;
  this.manufacturer = pObj.deviceManufacturer;
  this.version = "<version not supported>";
  pObj.close();
  this.fingerprint = "" + index + "." + this.name;
}

MIDIPort.prototype.toString = function() {
  return ("type: "+ this.type + "name: '" + this.name + "' manufacturer: '" + 
  this.manufacturer + "' version: " + this.version + " fingerprint: '" + this.fingerprint + "'" );
}

// LIMITATION: no version number
// LIMITATION: MIDIPorts are supposed to have connect and disconnect events.
// LIMITATION: Jazz can only support one input and one output device at a time.
// LIMITATION: Jazz doesn't have sysex (in or out) support.



function MIDIInput( midiAccess, target ) {
  // target can be a MIDIPort or DOMString 
  if ( target instanceof MIDIPort ) {
    this._deviceName = target.name;
    this._index = target._index;
  } else {
    var dot = target.indexOf(".");
    this._index = parseInt( target.slice( 0, dot ) );
    this._deviceName = target.slice( dot + 1 );
  }

  this.onmessage = null;
  this._midiAccess = midiAccess;

  // MIDIBridge can't take a device name for its getInput, so I have to re-enumerate the inputs
  // in order to grab the correct MIDIBridge object from MIDIBridge's enumerateInputs list.
  var inputs = midiAccess._enumerateInputs();
  this._input = midiAccess._getInput( inputs[this._index] );
  this._input.addEventListener( "midimessage", _midiProc.bind(this) );
}

// this is the biggest change in the spec - how MIDI messages are returned to the callback-
// from what MIDIBridge currently sends (which is more short-message-like).
function _midiProc( m ) {
  var status = m.command | m.channel;
  if (this._midiAccess._debug) console.log( "MIDI data received (hex): " + status.toString(16) + " " + m.data1.toString(16) + " " + m.data2.toString(16) );

  var message = new MIDIMessage();
  message.timestamp = parseFloat( m.timeStamp.toString())
  message.data = new Uint8Array(3);
  message.data[0] = m.command | m.channel;
  message.data[1] = m.data1;
  message.data[2] = m.data2;

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
  } else {
    var dot = target.indexOf(".");
    this._index = parseInt( target.slice( 0, dot ) );
    this._deviceName = target.slice( dot + 1 );
  }

  this._midiAccess = midiAccess;

  // MIDIBridge can't take a device name for its getOuput, so I have to re-enumerate the outputs
  // in order to grab the correct MIDIBridge object from MIDIBridge's enumerateOuputs list.
  var outputs = midiAccess._enumerateOutputs();
  this._output = midiAccess._getOutput( outputs[this._index] );
}

MIDIOutput.prototype.sendMessage = function( status, data0, data1 ) {
  var message = this._midiAccess._createMIDIMessage( status & 0xf0, status & 0x0f, /* 0, ?? MIDIBridge doesn't have timestamps either? */ data0, data1 );
  this._output.sendMIDIMessage( message );
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



