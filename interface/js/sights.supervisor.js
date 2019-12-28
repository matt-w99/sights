// The setInterval that calls updateService
var serviceUpdater;
var active_config;

function updateServiceInfo(response, status, jqXHR) {
    // Only runs on first call after connecting
    if ($("#service_info_status").attr("data-state") == "DISCONNECTED") {
         // Populate config file selector
        updateConfigSelector();
    }
    
    // Get state of the SIGHTS service (RUNNING, STOPPED, etc)
    var state = response[0].statename;
    // Update service state indicator
    $("#service_info_status").attr("data-original-title", "Service " + state.toLowerCase());
    // Clear button style
    $("#service_info_status").removeClass("btn-success btn-danger btn-warning btn-secondary");
    $("#service_info_status").attr("data-state", state);
    
    // Set button style conditionally
    switch (state) {
        case "RUNNING":
            $("#service_info_status").addClass("btn-success");
            break;
        case "STARTING":
        case "STOPPING":
        case "BACKOFF":
            $("#service_info_status").addClass("btn-warning");
            break;
        case "EXITED":
        case "STOPPED":
        case "FATAL":
        default:
            $("#service_info_status").addClass("btn-danger");
            break;
    }

    // Update log filename
    $("#service_info_logfile").html(response[0].logfile);
    // Update log
    $.xmlrpc({
        url: '/RPC2',
        methodName: 'supervisor.tailProcessStdoutLog',
        params: {name: 'sights', offset: '0', length: '10000'},
        success: function(response, status, jqXHR) {
            $("#service_info_pre").html(hljs.highlight("YAML", response[0][0]).value);
        },
        error: function(jqXHR, status, error) {
            $("#service_info_logfile").html("Couldn't get service information");
        }
    });
}

function serviceDisconnected(jqXHR, status, error) {
    // Update service state indicator
    $("#service_info_status").attr("data-state", "DISCONNECTED");
    $("#service_info_status").attr("data-original-title", "Service disconnected");
    $("#service_info_status").removeClass("btn-success btn-danger btn-warning");
    $("#service_info_status").addClass("btn-secondary");
    // Update log modal information
    $("#service_info_logfile").html("Couldn't get service information");
    // Empty config selector
    //$('#config_selector').html("");
}

function updateService() {
    $.xmlrpc({
        url: '/RPC2',
        methodName: 'supervisor.getProcessInfo',
        params: {name: 'sights'},
        success: updateServiceInfo,
        error: serviceDisconnected,
        statusCode: {
            404: function (response) {
                console.log("404: Supervisor is not available. Retrying.");
            },
            503: function (response) {
                console.log("503: Supervisor is not available. Retrying.");
            }
        }
    });
}

function updateConfigSelector() {
    $.xmlrpc({
        url: '/RPC2',
        methodName: 'sights_config.getConfigs',
        params: {},
        success: function(response, status, jqXHR) {
            $('#config_selector').html("");
            // Populate config selector
            var option = '';
            for (var i = 0; i < response[0].length; i++){
                option += '<option value="'+ response[0][i] + '">' + response[0][i] + '</option>';
            }
            // Add to config selector
            $('#config_selector').append(option);
            // Get the active config and make it the currently selected config
            $.xmlrpc({
                url: '/RPC2',
                methodName: 'sights_config.getActiveConfig',
                params: {},
                success: function(response, status, jqXHR) {
                    // Also remove any line breaks from the string.
                    active_config = response[0].replace(/(\r\n|\n|\r)/gm, "");
                    // And set it to be the active select element
                    $("#config_selector").val(active_config).change();
                    $("#config_delete_button").addClass("disabled");
                },
                error: function(jqXHR, status, error) {
                    serviceAlert("danger", "Couldn't get active config file");
                }
            });
        },
        error: function(jqXHR, status, error) {
            serviceAlert("danger", "Couldn't get available config files");
        }
    });
}

function requestConfig(callback) {
    $.xmlrpc({
        url: '/RPC2',
        methodName: 'sights_config.requestConfig',
        params: {},
        success: function(response, status, jqXHR) {
            callback(JSON.parse(response));
        },
        error: function(jqXHR, status, error) {
            serviceAlert("danger", "Couldn't get active config file");
        }
    });
}

function saveConfig() {
    let contents = $("#advanced_editor_pre")[0].innerText;
    let tempSavedConfig = savedConfig;
    let fileName = $(".editor_filename").val() + ".json";
    try {
        // Parse from YAML into JS
        let yml = jsyaml.safeLoad(contents);
        // And then turn that into a JSON string
        let val = JSON.stringify(yml, null, '\t');
        // Update visual editor
        configEditor.setValue(JSON.parse(val, indent = 4));
        $.xmlrpc({
            url: '/RPC2',
            methodName: 'sights_config.saveConfig',
            params: {value: val, name: fileName},
            success: function(response, status, jqXHR) {
                serviceAlert("success", "Saved config file");
                updateConfigSelector();
            },
            error: function(jqXHR, status, error) {
                serviceAlert("danger", "Couldn't save config file");
            }
        });
        configSentAlert();
        savedConfig = JSON.stringify(configEditor.getValue());
    } catch (e) {
        configInvalidAlert();
        savedConfig = tempSavedConfig;
    }
    updateConfigAlerts();
}

$(document).on("ready",function () {
    // Handle shutdown and reboot buttons
    $("#shutdown_button").on("click", function () {
        if(demo) {
            location.reload();
        }
        else {
            $.xmlrpc({
                url: '/RPC2',
                methodName: 'sights_config.poweroff',
                params: {},
                success: function (response, status, jqXHR) {
                    shutdownAlert();
                },
                error: function (jqXHR, status, error) {
                    serviceAlert("danger", "Couldn't shut down");
                }
            });
        }
    });

    $("#reboot_button").on("click", function () {
        if(demo) {
            location.reload();
        }
        else {
            $.xmlrpc({
                url: '/RPC2',
                methodName: 'sights_config.reboot',
                params: {},
                success: function (response, status, jqXHR) {
                    rebootAlert();
                },
                error: function (jqXHR, status, error) {
                    serviceAlert("danger", "Couldn't reboot");
                }
            });
        }
    });


    serviceUpdater = setInterval(updateService, 500);

    $('#config_refresh_button').on("click", function() {
        updateConfigSelector();
    });

    $('#config_enable_button').on("click", function() {
        $.xmlrpc({
            url: '/RPC2',
            methodName: 'sights_config.setActiveConfig',
            params: {value: $('#config_selector').val()},
            success: function(response, status, jqXHR) {
                serviceAlert("success", "Set config file, restart service to apply");
                $("#config_delete_button").addClass("disabled");
                active_config = $('#config_selector').val();
            },
            error: function(jqXHR, status, error) {
                serviceAlert("danger", "Couldn't set config file");
            }
        });
    });

    $('#config_delete_button').on("click", function() {
        if (running_config == $('#config_selector').val()) {
            serviceAlert("danger", "You cannot delete the current running config")
        }
        else if (active_config == $('#config_selector').val()) {
            serviceAlert("danger", "You cannot delete the next enabled config")
        }
        else {
            $.xmlrpc({
                url: '/RPC2',
                methodName: 'sights_config.deleteConfig',
                params: {value: $('#config_selector').val()},
                success: function(response, status, jqXHR) {
                    serviceAlert("success", "Deleted config");
                    updateConfigSelector();
                },
                error: function(jqXHR, status, error) {
                    serviceAlert("danger", "Couldn't delete config file");
                }
            });
        }
    });

    $('#service_start_button').on("click", function() {
        serviceAlert("info", "Starting service");
		$.xmlrpc({
            url: '/RPC2',
            methodName: 'supervisor.startProcess',
            params: {name: 'sights'},
            success: function(response, status, jqXHR) {
                serviceAlert("success", "Service started");
                updateConfigSelector();
            },
            error: function(jqXHR, status, error) {
                serviceAlert("danger", "Couldn't start service");
            }
        });
    });
    $('#service_stop_button').on("click", function() {
        serviceAlert("info", "Stopping service");
		$.xmlrpc({
            url: '/RPC2',
            methodName: 'supervisor.stopProcess',
            params: {name: 'sights'},
            success: function(response, status, jqXHR) {
                serviceAlert("danger", "Service stopped");
                controlSocket.close();
                sensorSocket.close();
            },
            error: function(jqXHR, status, error) {
                serviceAlert("danger", "Couldn't stop service");
            }
        });
    });

    $('#service_info_clear_button').on("click", function() {
        $.xmlrpc({
            url: '/RPC2',
            methodName: 'supervisor.clearProcessLog',
            params: {name: 'sights'},
            success: function(response, status, jqXHR) {
                serviceAlert("info", "Cleared service logs");
            },
            error: function(jqXHR, status, error) {
                serviceAlert("info", "Couldn't clear service logs");
            }
        });
    });


    $('#service_restart_button').on("click", function() {
        serviceAlert("info", "Restarting service");
		$.xmlrpc({
            url: '/RPC2',
            methodName: 'supervisor.stopProcess',
            params: {name: 'sights'},
            success: function(response, status, jqXHR) {
                controlSocket.close();
                sensorSocket.close();
                $.xmlrpc({
                    url: '/RPC2',
                    methodName: 'supervisor.startProcess',
                    params: {name: 'sights'},
                    success: function(response, status, jqXHR) {
                        serviceAlert("success", "Service restarted");
                        updateConfigSelector();
                    },
                    error: function(jqXHR, status, error) {
                        serviceAlert("danger", "Couldn't start service");
                    }
                });
            },
            error: function(jqXHR, status, error) {
                serviceAlert("danger", "Couldn't stop service");
            }
        });
	});
});
