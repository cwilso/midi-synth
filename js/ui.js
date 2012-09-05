function createKnob( label, x, y, min, max, currentValue, color, onChange ) {
	var container = document.createElement( "div" );
	container.className = "knobContainer";
	container.style.left = "" + x + "px";
	container.style.top = "" + y + "px";

	var knob = document.createElement( "input" );
	knob.className = "knob";
	knob.value = currentValue;
	knob.setAttribute( "data-min", min );
	knob.setAttribute( "data-max", max );
	knob.setAttribute( "data-width", "100" );
	knob.setAttribute( "data-angleOffset", "-125" );
	knob.setAttribute( "data-angleArc", "250" );
	knob.setAttribute( "data-fgColor", color );
	knob.oninput = onChange;
	container.appendChild( knob );

	var labelText = document.createElement( "div" );
	labelText.className = "knobLabel";
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
	var osc1 = createSection( "OSC1", 10, 10, 240, 160 );	
	osc1.appendChild( createDropdown( "waveform", 10, 15, ["sine","square", "saw", "triangle", "wavetable"], 0, null ))
	osc1.appendChild( createDropdown( "interval", 160, 15, ["32'","16'", "8'"], 0, null ) );
	osc1.appendChild( createKnob( "detune", 10, 65, -1200, 1200, 0, "blue", null ) );
	osc1.appendChild( createKnob( "mix", 130, 65, 0, 100, 75, "blue", null ) );
	synthBox.appendChild( osc1 );

	var osc2 = createSection( "OSC2", 10, 193, 240, 160 );	
	osc2.appendChild( createDropdown( "waveform", 10, 15, ["sine","square", "saw", "triangle", "wavetable"], 0, null ))
	osc2.appendChild( createDropdown( "interval", 160, 15, ["16'","8'", "4'"], 0, null ) );
	osc2.appendChild( createKnob( "detune", 10, 65, -500, 500, 0, "blue", null ) );
	osc2.appendChild( createKnob( "mix", 130, 65, 0, 100, 75, "blue", null ) );
	synthBox.appendChild( osc2 );

	var mod = createSection( "MOD", 282, 10, 100, 342 );	
	mod.appendChild( createDropdown( "waveform", 10, 15, ["sine","square", "saw", "triangle"], 0, null ))
	mod.appendChild( createKnob( "frequency", 10, 60, 0, 20, 2, "blue", null ) );
	mod.appendChild( createKnob( "depth1", 10, 165, 0, 100, 75, "blue", null ) );
	mod.appendChild( createKnob( "depth2", 10, 245, 0, 100, 75, "blue", null ) );
	synthBox.appendChild( mod );

	var filter = createSection( "FILTER", 414, 10, 100, 342 );	
	filter.appendChild( createDropdown( "waveform", 10, 15, ["sine","square", "saw", "triangle"], 0, null ))
	filter.appendChild( createKnob( "frequency", 10, 60, 0, 20, 2, "blue", null ) );
	filter.appendChild( createKnob( "depth1", 10, 165, 0, 100, 75, "blue", null ) );
	filter.appendChild( createKnob( "depth2", 10, 245, 0, 100, 75, "blue", null ) );
	synthBox.appendChild( filter );

	var filterEnv = createSection( "filter envelope", 546, 10, 240, 160 );	
	filterEnv.appendChild( createDropdown( "waveform", 10, 15, ["sine","square", "saw", "triangle", "wavetable"], 0, null ))
	filterEnv.appendChild( createDropdown( "interval", 160, 15, ["32'","16'", "8'"], 0, null ) );
	filterEnv.appendChild( createKnob( "detune", 10, 65, -1200, 1200, 0, "blue", null ) );
	filterEnv.appendChild( createKnob( "mix", 130, 65, 0, 100, 75, "blue", null ) );
	synthBox.appendChild( filterEnv );

	var volumeEnv = createSection( "volume envelope", 546, 193, 240, 160 );	
	volumeEnv.appendChild( createDropdown( "waveform", 10, 15, ["sine","square", "saw", "triangle", "wavetable"], 0, null ))
	volumeEnv.appendChild( createDropdown( "interval", 160, 15, ["16'","8'", "4'"], 0, null ) );
	volumeEnv.appendChild( createKnob( "detune", 10, 65, -500, 500, 0, "blue", null ) );
	volumeEnv.appendChild( createKnob( "mix", 130, 65, 0, 100, 75, "blue", null ) );
	synthBox.appendChild( volumeEnv );


	$(".knob").knob();
} 

/*
        <div class=knobContainer x y>
            <input class="knob" data-width=100 data-angleOffset=-125 data-angleArc=250 
            data-fgColor="#66EE66" value="35">
            <div style="position:absolute; font-weight: bold; left: 0px; top: 85px; width:100px; text-align: center; color: white">frequency</div>
        </div>
*/