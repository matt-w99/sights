var ip = window.location.hostname;

var tempChartCanvas = document.getElementById("tempChart").getContext('2d');
var distChartCanvas = document.getElementById("distChart").getContext('2d');

console.log("Starting sensor receiver");

var camColors = [0x480F,
0x400F,0x400F,0x400F,0x4010,0x3810,0x3810,0x3810,0x3810,0x3010,0x3010,
0x3010,0x2810,0x2810,0x2810,0x2810,0x2010,0x2010,0x2010,0x1810,0x1810,
0x1811,0x1811,0x1011,0x1011,0x1011,0x0811,0x0811,0x0811,0x0011,0x0011,
0x0011,0x0011,0x0011,0x0031,0x0031,0x0051,0x0072,0x0072,0x0092,0x00B2,
0x00B2,0x00D2,0x00F2,0x00F2,0x0112,0x0132,0x0152,0x0152,0x0172,0x0192,
0x0192,0x01B2,0x01D2,0x01F3,0x01F3,0x0213,0x0233,0x0253,0x0253,0x0273,
0x0293,0x02B3,0x02D3,0x02D3,0x02F3,0x0313,0x0333,0x0333,0x0353,0x0373,
0x0394,0x03B4,0x03D4,0x03D4,0x03F4,0x0414,0x0434,0x0454,0x0474,0x0474,
0x0494,0x04B4,0x04D4,0x04F4,0x0514,0x0534,0x0534,0x0554,0x0554,0x0574,
0x0574,0x0573,0x0573,0x0573,0x0572,0x0572,0x0572,0x0571,0x0591,0x0591,
0x0590,0x0590,0x058F,0x058F,0x058F,0x058E,0x05AE,0x05AE,0x05AD,0x05AD,
0x05AD,0x05AC,0x05AC,0x05AB,0x05CB,0x05CB,0x05CA,0x05CA,0x05CA,0x05C9,
0x05C9,0x05C8,0x05E8,0x05E8,0x05E7,0x05E7,0x05E6,0x05E6,0x05E6,0x05E5,
0x05E5,0x0604,0x0604,0x0604,0x0603,0x0603,0x0602,0x0602,0x0601,0x0621,
0x0621,0x0620,0x0620,0x0620,0x0620,0x0E20,0x0E20,0x0E40,0x1640,0x1640,
0x1E40,0x1E40,0x2640,0x2640,0x2E40,0x2E60,0x3660,0x3660,0x3E60,0x3E60,
0x3E60,0x4660,0x4660,0x4E60,0x4E80,0x5680,0x5680,0x5E80,0x5E80,0x6680,
0x6680,0x6E80,0x6EA0,0x76A0,0x76A0,0x7EA0,0x7EA0,0x86A0,0x86A0,0x8EA0,
0x8EC0,0x96C0,0x96C0,0x9EC0,0x9EC0,0xA6C0,0xAEC0,0xAEC0,0xB6E0,0xB6E0,
0xBEE0,0xBEE0,0xC6E0,0xC6E0,0xCEE0,0xCEE0,0xD6E0,0xD700,0xDF00,0xDEE0,
0xDEC0,0xDEA0,0xDE80,0xDE80,0xE660,0xE640,0xE620,0xE600,0xE5E0,0xE5C0,
0xE5A0,0xE580,0xE560,0xE540,0xE520,0xE500,0xE4E0,0xE4C0,0xE4A0,0xE480,
0xE460,0xEC40,0xEC20,0xEC00,0xEBE0,0xEBC0,0xEBA0,0xEB80,0xEB60,0xEB40,
0xEB20,0xEB00,0xEAE0,0xEAC0,0xEAA0,0xEA80,0xEA60,0xEA40,0xF220,0xF200,
0xF1E0,0xF1C0,0xF1A0,0xF180,0xF160,0xF140,0xF100,0xF0E0,0xF0C0,0xF0A0,
0xF080,0xF060,0xF040,0xF020,0xF800];

// Rainbow
function rainbow(n) {
	return 'hsl(' + n * 15 + ',100%,50%)';
}

// CHARTS
var distChartData = {
	labels: ['Front', 'Right', 'Back', 'Left'],
	datasets: [{
		data: [0,0,0,0],
		backgroundColor: [
		"rgba(0, 255, 0, 0.8)",
		"rgba(0, 255, 200, 0.8)",
		"rgba(0, 255, 200, 0.8)",
		"rgba(0, 255, 200, 0.8)"
		],
		borderColor: "rgba(0, 0, 0, 0.5)"
	}]
};

var distChartOptions = {
	startAngle: 5 * Math.PI / 4,
	legend: {
		position: 'left',
		display: false
	},
	animation: {
		animateRotate: false
	},
	scale: {
		ticks: {
			max: 1200,
			min: 0,
			stepSize: 100
		}
	}
};

var distChart = new Chart(distChartCanvas, {
	type: 'polarArea',
	data: distChartData,
	options: distChartOptions
});

var tempChartData =  {
	labels: [-13, -12, -11, 10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0],
	datasets: [{
		label: 'Front',
		data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		borderColor: [
			'rgba(128, 0, 0, 1)'
		]
	},
	{
		label: 'Left',
		data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		borderColor: [
			'rgba(0, 128, 0, 1)'
		]
	},
	{
		label: 'Right',
		data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		borderColor: [
			'rgba(0, 0, 128, 1)'
		]
	},
	{
		label: 'Back',
		data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		borderColor: [
			'rgba(128, 128, 0, 1)'
		]
	}]
}

var tempChart = new Chart(tempChartCanvas, {
	type: 'line',
	data: tempChartData,
	options: {
		responsive: true,
		title: {
			display: false,
			text: 'Temperature'
		},
		tooltips: {
			mode: 'index',
			intersect: false,
		},
		hover: {
			mode: 'nearest',
			intersect: true
		},
		scales: {
			xAxes: [{
				display: true,
				scaleLabel: {
					display: true,
					labelString: 'Time'
				}
			}],
			yAxes: [{
				display: true,
				scaleLabel: {
					display: true,
					labelString: 'Temperature (°C)'
				}
			}]
		}
	}
});


var sensorSocket = new WebSocket("ws://" + ip + ":5556");

sensorSocket.onmessage = function(event) {
	var str = event.data;
    var obj = JSON.parse(str);

	// Get distance data and create radial graph
	if ("distance" in obj) {
		// Update distance chart
		var dist_data = [];
    	// Unfortunately the graph has directions clockwise (front, right, back, left) in the array. We have them front, left, right, back
		dist_data[0] = obj["distance"][0];
		dist_data[1] = obj["distance"][2];
		dist_data[2] = obj["distance"][3];
		dist_data[3] = obj["distance"][1];
		// Change chart dataset to use new data
		distChartData.datasets[0].data = dist_data;
    	// Reload chart with new data
		distChart.update();
	}
	
	// Get thermal camera and create pixel grid
	if ("thermal_camera" in obj) {
		var thermal_camera_data = obj["thermal_camera"];
		
		// Iterate through pixels
		for (i = 0; i < 8; i++) {
			for (j = 0; j < 8; j++) {
				var offset = i * 8 + j;
				// Get pixel color from color table
				var pixel = Math.round(thermal_camera_data[offset]);
				// Apply colour to the appropriate HTML element 
				document.getElementById("p" + (offset + 1)).style = "background:" + rainbow(pixel);
			}
		}
	}
	
	// Get CO2 levels
	if ("co2" in obj) {
		var co2 = obj["co2"];
		// Update graph
		document.getElementById("co2_level").innerHTML = co2 + "<span style='font-size: 10px'> ppm</span>";
		document.getElementById("co2_graph").className = "c100 med orange p" + Math.round(co2 / 100);
	}
	
	// Get TVOC levels
	if ("tvoc" in obj) {
		var tvoc = obj["tvoc"];
		// Update graph
		document.getElementById("tvoc_level").innerHTML = tvoc + "<span style='font-size: 10px'> ppb</span>";
		document.getElementById("tvoc_graph").className = "c100 med orange p" + Math.round(tvoc / 100);
	}
	
	// Get temperature data for line graph
	if ("temp" in obj) {
		var temp_data = obj["temp"];
		for (i = 0; i < 4; i++) {
			// Remove oldest element
			tempChartData.datasets[i].data.shift()
			// Push new element
			tempChartData.datasets[i].data.push(temp_data[i]);
		}
		tempChart.update();
	}
	
	// Get charge level
	if ("charge" in obj) {
		var charge_data = obj["charge"];
		// Update graph
		document.getElementById("charge_level").innerHTML = charge_data + "%";
		document.getElementById("charge_graph").className = "c100 med orange p" + charge_data;
	}
	
	// Highest CPU core temperature
	var cpu_temp = Math.round(obj.cpu_temp);
	document.getElementById("cputemp_level").innerHTML = cpu_temp + "&degC";
	document.getElementById("cputemp_graph").className = "c100 med orange p" + cpu_temp;


}

