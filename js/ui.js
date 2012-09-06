function createKnob( label, width, x, y, min, max, currentValue, color, onChange ) {
	var container = document.createElement( "div" );
	container.className = "knobContainer";
	container.style.left = "" + x + "px";
	container.style.top = "" + y + "px";

	var knob = document.createElement( "input" );
	knob.className = "knob";
	knob.value = currentValue;
	knob.setAttribute( "data-min", min );
	knob.setAttribute( "data-max", max );
	knob.setAttribute( "data-width", width );
	knob.setAttribute( "data-angleOffset", "-125" );
	knob.setAttribute( "data-angleArc", "250" );
	knob.setAttribute( "data-fgColor", color );
	knob.onchange = onChange;

	container.appendChild( knob );

	var labelText = document.createElement( "div" );
	labelText.className = "knobLabel";
	labelText.style.top = "" + (width* 0.85) + "px";
	labelText.style.width = "" + width + "px";
	labelText.appendChild( document.createTextNode( label ) );

	container.appendChild( labelText );

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
	select.oninput = onChange;
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
	var osc1 = createSection( "OSC1", 130, 10, 240, 160 );	
	osc1.appendChild( createDropdown( "waveform", 10, 15, ["sine","square", "saw", "triangle", "wavetable"], 0, null ))
	osc1.appendChild( createDropdown( "interval", 160, 15, ["32'","16'", "8'"], 0, null ) );
	osc1.appendChild( createKnob( "detune", 100, 10, 65, -1200, 1200, 0, "blue", null ) );
	osc1.appendChild( createKnob( "mix", 100, 130, 65, 0, 100, 75, "blue", null ) );
	synthBox.appendChild( osc1 );

	var osc2 = createSection( "OSC2", 130, 192, 240, 160 );	
	osc2.appendChild( createDropdown( "waveform", 10, 15, ["sine","square", "saw", "triangle", "wavetable"], 0, null ))
	osc2.appendChild( createDropdown( "interval", 160, 15, ["16'","8'", "4'"], 0, null ) );
	osc2.appendChild( createKnob( "detune", 100, 10, 65, -500, 500, 0, "blue", null ) );
	osc2.appendChild( createKnob( "mix", 100, 130, 65, 0, 100, 75, "blue", null ) );
	synthBox.appendChild( osc2 );

	var mod = createSection( "freq mod", 10, 10, 87, 342 );	
	mod.appendChild( createDropdown( "shape", 12, 15, ["sine","square", "saw", "triangle"], 0, null ))
	mod.appendChild( createKnob( "freq", 80, 12, 65, 0, 20, 2, "blue", null ) );
	mod.appendChild( createKnob( "depth1", 80, 12, 160, 0, 100, 75, "blue", null ) );
	mod.appendChild( createKnob( "depth2", 80, 12, 255, 0, 100, 75, "blue", null ) );
	synthBox.appendChild( mod );

	var filter = createSection( "filter", 404, 10, 100, 342 );	
	var filterFreqKnob = createKnob( "freq", 85, 12, 65, 0, 5000, 1000, "blue", onUpdateFilterFrequency );
	filterFreqKnob.id="ffreq";

	filter.appendChild( filterFreqKnob );
	filter.appendChild( createKnob( "q", 85, 12, 160, 0, 100, 75, "blue", null ) );
	filter.appendChild( createKnob( "mod", 85, 12, 255, 0, 100, 75, "blue", null ) );
	synthBox.appendChild( filter );
//	$( filterFreqKnob ).knob({ 'change' : onUpdateFilterFrequency });

	var filterEnv = createSection( "filter envelope", 538, 10, 355, 100 );	
	filterEnv.appendChild( createKnob( "attack",  80,   10, 20, 0, 100, 50, "blue", null ) );
	filterEnv.appendChild( createKnob( "decay",   80,  100, 20, 0, 100, 50, "blue", null ) );
	filterEnv.appendChild( createKnob( "sustain", 80,  190, 20, 0, 100, 50, "blue", null ) );
	filterEnv.appendChild( createKnob( "release", 80,  280, 20, 0, 100, 50, "blue", null ) );
	synthBox.appendChild( filterEnv );

	var volumeEnv = createSection( "volume envelope", 538, 135, 355, 100 );	
	volumeEnv.appendChild( createKnob( "attack",  80,   10, 20, 0, 100, 50, "blue", null ) );
	volumeEnv.appendChild( createKnob( "decay",   80,  100, 20, 0, 100, 50, "blue", null ) );
	volumeEnv.appendChild( createKnob( "sustain", 80,  190, 20, 0, 100, 50, "blue", null ) );
	volumeEnv.appendChild( createKnob( "release", 80,  280, 20, 0, 100, 50, "blue", null ) );
	synthBox.appendChild( volumeEnv );


	$(".knob").knob({
                    change : function (value) {
//                        console.log("change : " + value);
                        var e = this.$[0];
                        if (e.onchange)
                        	e.onchange(value);
                    } });
} 
