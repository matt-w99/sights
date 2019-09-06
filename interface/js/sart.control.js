/*
	Created by the Semi-Autonomous Rescue Team
	Licensed under GNU General Public License 3.0
	
*/

// WebSocket used for controller data
var controlSocket;
var currentGamepad = 0;
var last_axis_state = {
	"RIGHT_BOTTOM_SHOULDER": 0.0,
	"LEFT_BOTTOM_SHOULDER": 0.0
}

//Log to the console the result of the socket connection attempt. Useful for troubleshooting.
function socketState() {
	var state = controlSocket.readyState
	switch (state) {
		case 0:
			return "Connecting (The connection is not yet open)";
		case 1:
			return "Open (The connection is open and ready to communicate)";
		case 2:
			return "Closing (The connection is in the process of closing)";
		case 3:
			return "Closed (The connection is closed or couldn't be opened)";
	}
}

// Checks if socket is open, then converts data to JSON and sends it
function safeSend(data) {
	logControl(data);
	if (controlSocket != undefined && controlSocket.readyState == 1)
		controlSocket.send(JSON.stringify(data));
}

function logControl(e) {

	value = ('value' in e) ? e["value"] : "MESSAGE SENT"

	$('#gamepad-log-pre').prepend("<li>" + new Date().toLocaleTimeString() + " - " + e['type'] + " " + e['control'] + " " + value + "</li>");
}

function createKeyBind(keys, ctrl) {
	// Create keyboard bindings using KeyboardJS
	keyboardJS.bind(keys, function (e) {
		// Key down event
		e.preventRepeat();
		var c_event = {
			type: "keyboard",
			control: ctrl,
			value: "DOWN"
		};
		safeSend(c_event);
		logControl(c_event.control, c_event.value);
	}, function (e) {
		// Key up event
		var c_event = {
			type: "keyboard",
			control: ctrl,
			value: "UP"
		};
		safeSend(c_event);
		logControl(c_event.control, c_event.value);
	});
}

$(document).ready(function () {
	$("#controller-status-connected").hide();

	console.log("Attempting to connect to the websocket server");

	try {
		controlSocket = new WebSocket("ws://" + ip + ":5555");
		console.log("Attempt result: " + socketState());
	} catch (err) {
		console.log("Not connected to controller socket");
	}

	// Attach it to the window so it can be inspected at the console.
	window.gamepad = new Gamepad();

	$('#gamepadSelect').on('change', function (e) {
		//var device = gamepad.gamepads[this.value];
		currentGamepad = this.value;
		//$('#gamepad-monitor-pre').html(JSON.stringify(device.state, null, "\t"));
	});

	// Create keyboard bindings
	createKeyBind('w', "FORWARD");
	createKeyBind('a', "LEFT");
	createKeyBind('s', "BACKWARDS");
	createKeyBind('d', "RIGHT");

	// Handle shutdown and reboot buttons
	$("#shutdownButton").click(function () {
		var c_event = {
			type: "SYSTEM",
			control: "SHUTDOWN"
		};
		safeSend(c_event);
		bootoast.toast({
			"message": "Shutting down",
			"type": "warning",
			"icon": "power-off",
			"position": "left-bottom"
		});
	});
	$("#rebootButton").click(function () {
		var c_event = {
			type: "SYSTEM",
			control: "REBOOT"
		};
		safeSend(c_event);
		logControl("system", "reboot");
		bootoast.toast({
			"message": "Rebooting",
			"type": "warning",
			"icon": "undo",
			"position": "left-bottom"
		});
	});

	gamepad.bind(Gamepad.Event.CONNECTED, function (device) {
		console.log('Controller connected:', device.id);

		$("#controller-status-connected").show();
		$("#controller-status-disconnected").hide();

		bootoast.toast({
			"message": "Controller connected",
			"type": "success",
			"icon": "gamepad",
			"position": "left-bottom"
		});

		$('#gamepadSelect').append('<option value="' + device.index + '" id="gamepad-' + device.index + '">' + device.id.replace(/ *\([^)]*\) */g, "") + '</option>');
		$('#gamepadSelect').val(device.index);
		$('#gamepadSelect').trigger('change');
	});

	gamepad.bind(Gamepad.Event.DISCONNECTED, function (device) {
		console.log('Controller disconnected', device.id);

		$('#gamepad-' + device.index).remove();

		if (gamepad.count() == 0) {
			$("#controller-status-connected").hide();
			$("#controller-status-disconnected").show();
		}
		bootoast.toast({
			"message": "Controller disconnected",
			"type": "danger",
			"icon": "gamepad",
			"position": "left-bottom"
		});
	});

	gamepad.bind(Gamepad.Event.BUTTON_DOWN, function (e) {
		if (e.gamepad.index == currentGamepad) {
			if (e.control == "RIGHT_BOTTOM_SHOULDER" || e.control == "LEFT_BOTTOM_SHOULDER") {
				return;
			}
			var c_event = {
				type: "BUTTON",
				control: e.control,
				value: "DOWN"
			};
			safeSend(c_event);
		}
	});

	gamepad.bind(Gamepad.Event.BUTTON_UP, function (e) {
		if (e.gamepad.index == currentGamepad) {
			if (e.control == "RIGHT_BOTTOM_SHOULDER" || e.control == "LEFT_BOTTOM_SHOULDER") {
				return;
			}
			var c_event = {
				type: "BUTTON",
				control: e.control,
				value: "UP"
			};
			safeSend(c_event);
		}
	});

	gamepad.bind(Gamepad.Event.AXIS_CHANGED, function (e) {
		if (e.gamepad.index == currentGamepad) {
			if (e.control == "RIGHT_BOTTOM_SHOULDER" || e.control == "LEFT_BOTTOM_SHOULDER") {
				return;
			}
			var val = e.value.toFixed(2);
			var c_event = {
				type: "AXIS",
				control: e.axis,
				value: val
			};
			if (val > -0.3 && val < 0.3) {
				// TODO: Prevent repeats of this message
				// Currently will send 0 repeatedly
				c_event.value = 0;
			}
			safeSend(c_event);
		}
	});

	function axisUpdate(currGamepad, ctrl) {
		// Current value of specified control, to 2dp
		var val = currGamepad.state[ctrl].toFixed(2)
		// Compare against last value
		if (val != last_axis_state[ctrl]) {
			// Update last value with current value
			last_axis_state[ctrl] = val;
			// Create event message
			var c_event = {
				type: "AXIS",
				control: ctrl,
				value: val
			};
			// Send event message
			safeSend(c_event);
		}
	}

	gamepad.bind(Gamepad.Event.TICK, function (gamepads) {
		var gamepad = gamepads[currentGamepad];
		if (gamepad) {
			$("#gamepad-monitor-pre").html(hljs.highlight("JSON", JSON.stringify(gamepad.state, null, "\t")).value);

			// Check axis state at every tick since event binding doesn't catch all changes
			axisUpdate(gamepad, "LEFT_BOTTOM_SHOULDER");
			axisUpdate(gamepad, "RIGHT_BOTTOM_SHOULDER");
		}
	});

	if (!gamepad.init()) {
		alert('Your browser does not support gamepads, get the latest Google Chrome or Firefox.');
	}
});