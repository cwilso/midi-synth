function createKnob( id, label, width, x, y, min, max, currentValue, color, onChange ) {
	var container = document.createElement( "div" );
	container.className = "knobContainer";
	container.style.left = "" + x + "px";
	container.style.top = "" + y + "px";

	var knob = document.createElement( "input" );
	knob.className = "knob";
	knob.id = id;
	knob.value = currentValue;
	knob.setAttribute( "data-min", min );
	knob.setAttribute( "data-max", max );
	knob.setAttribute( "data-width", width );
	knob.setAttribute( "data-angleOffset", "-125" );
	knob.setAttribute( "data-angleArc", "250" );
	knob.setAttribute( "data-fgColor", color );

	container.appendChild( knob );

	var labelText = document.createElement( "div" );
	labelText.className = "knobLabel";
	labelText.style.top = "" + (width* 0.85) + "px";
	labelText.style.width = "" + width + "px";
	labelText.appendChild( document.createTextNode( label ) );

	container.appendChild( labelText );

	$( knob ).knob({ 'change' : onChange });

	return container;
}

function createDropdown( label, x, y, values, selectedIndex, onChange ) {
	var container = document.createElement( "div" );
	container.className = "dropdownContainer";
	container.style.left = "" + x + "px";
	container.style.top = "" + y + "px";

	var labelText = document.createElement( "div" );
	labelText.className = "dropdownLabel";
	labelText.appendChild( document.createTextNode( label ) );
	container.appendChild( labelText );

	var select = document.createElement( "select" );
	select.className = "dropdownSelect"
	for (var i=0; i<values.length; i++)
		select.options[i] = new Option(values[i]);
	select.selectedIndex = selectedIndex;
	select.onchange = onChange;
	container.appendChild( select );

	return container;
}

function createSection( label, x, y, width, height ) {
	var container = document.createElement( "fieldset" );
	container.className = "section";
	container.style.left = "" + x + "px";
	container.style.top = "" + y + "px";
	container.style.width = "" + width + "px";
	container.style.height = "" + height + "px";

	var labelText = document.createElement( "legend" );
	labelText.className = "sectionLabel";
	labelText.appendChild( document.createTextNode( label ) );

	container.appendChild( labelText );
	return container;
}

function setupSynthUI() {
	var mod = createSection( "mod", 10, 10, 87, 342 );
	mod.style.borderColor = "#444";	
	mod.appendChild( createDropdown( "shape", 12, 15, ["sine","square", "saw", "triangle"], 0, null ))
	mod.appendChild( createKnob( "mFreq", "freq", 80, 12, 65, 0, 20, 2, "#c10087", null ) );
	mod.appendChild( createKnob( "mDepth1", "depth1", 80, 12, 160, 0, 100, 75, "#c10087", null ) );
	mod.appendChild( createKnob( "mDepth2", "depth2", 80, 12, 255, 0, 100, 75, "#c10087", null ) );
	synthBox.appendChild( mod );

	var osc1 = createSection( "OSC1", 130, 10, 240, 160 );	
	osc1.appendChild( createDropdown( "waveform", 10, 15, ["sine","square", "saw", "triangle", "wavetable"], 0, onUpdateOsc1Wave ))
	osc1.appendChild( createDropdown( "interval", 160, 15, ["32'","16'", "8'"], 0, null ) );
	osc1.appendChild( createKnob( "osc1detune", "detune", 100, 10, 65, -1200, 1200, 0, "blue", null ) );
	osc1.appendChild( createKnob( "osc1mix", "mix", 100, 130, 65, 0, 100, 75, "blue", null ) );
	synthBox.appendChild( osc1 );

	var osc2 = createSection( "OSC2", 130, 192, 240, 160 );	
	osc2.appendChild( createDropdown( "waveform", 10, 15, ["sine","square", "saw", "triangle", "wavetable"], 0, null ))
	osc2.appendChild( createDropdown( "interval", 160, 15, ["16'","8'", "4'"], 0, null ) );
	osc2.appendChild( createKnob( "osc2detune", "detune", 100, 10, 65, -500, 500, 0, "blue", null ) );
	osc2.appendChild( createKnob( "osc2mix", "mix", 100, 130, 65, 0, 100, 0, "blue", null ) );
	synthBox.appendChild( osc2 );

	var filter = createSection( "filter", 404, 10, 100, 342 );	
	filter.appendChild( createKnob( "fFreq", "freq", 85, 12, 65, 0, 5000, currentFilterFrequency, "#ffaa00", onUpdateFilterFrequency ) );
	filter.appendChild( createKnob( "fQ", "q", 85, 12, 160, 0, 40, currentFilterQ, "#ffaa00", onUpdateFilterQ ) );
	filter.appendChild( createKnob( "fMod", "mod", 85, 12, 255, 0, 100, 75, "#ffaa00", null ) );
	synthBox.appendChild( filter );

	var filterEnv = createSection( "filter envelope", 538, 10, 355, 100 );	
	filterEnv.appendChild( createKnob( "fA", "attack",  80,   10, 20, 0, 100, 50, "#bf8f30", null ) );
	filterEnv.appendChild( createKnob( "fD", "decay",   80,  100, 20, 0, 100, 50, "#bf8f30", null ) );
	filterEnv.appendChild( createKnob( "fS", "sustain", 80,  190, 20, 0, 100, 50, "#bf8f30", null ) );
	filterEnv.appendChild( createKnob( "fR", "release", 80,  280, 20, 0, 100, 50, "#bf8f30", null ) );
	synthBox.appendChild( filterEnv );

	var volumeEnv = createSection( "volume envelope", 538, 135, 355, 100 );	
	volumeEnv.appendChild( createKnob( "vA", "attack",  80,   10, 20, 0, 100, 5, "#00b358", null ) );
	volumeEnv.appendChild( createKnob( "vD", "decay",   80,  100, 20, 0, 100, 5, "#00b358", null ) );
	volumeEnv.appendChild( createKnob( "vS", "sustain", 80,  190, 20, 0, 100, 75, "#00b358", null ) );
	volumeEnv.appendChild( createKnob( "vR", "release", 80,  280, 20, 0, 100, 10, "#00b358", null ) );
	synthBox.appendChild( volumeEnv );

} 
