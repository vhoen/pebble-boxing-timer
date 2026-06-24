const settings = require("./settings");

function sendSettingsToWatch() {
    const currentSettings = settings.loadSettings(localStorage);
    Pebble.sendAppMessage(
        {
            ROUND_SECONDS: currentSettings.round,
            REST_SECONDS: currentSettings.rest,
            VIBRATION_ENABLED: currentSettings.vibrationEnabled ? 1 : 0
        },
        function() {
            console.log("Settings sent to watch.");
        },
        function(error) {
            console.log("Failed to send settings:", error);
        }
    );
}

function parseConfigResponse(response) {
    try {
        return JSON.parse(decodeURIComponent(response));
    } catch (_) {
        return JSON.parse(response);
    }
}

Pebble.addEventListener("ready", function() {
    console.log("PKJS ready.");
    sendSettingsToWatch();
});

Pebble.addEventListener("showConfiguration", function() {
    const url = settings.buildConfigPageUrl(localStorage);
    console.log("Opening configuration:", url);
    Pebble.openURL(url);
});

Pebble.addEventListener("webviewclosed", function(e) {
    if (!e || !e.response) {
        console.log("Configuration closed without response.");
        return;
    }

    let data;
    try {
        data = parseConfigResponse(e.response);
    } catch (error) {
        console.log("Invalid config response:", e.response, error);
        return;
    }

    if (data.cancelled) {
        console.log("Configuration cancelled.");
        return;
    }

    const currentSettings = settings.normalizeSettings(data);

    settings.saveSettings(currentSettings, localStorage);
    sendSettingsToWatch();
});
