const settings = require("./settings");

const DEFAULT_ROUND_SECONDS = 120;
const DEFAULT_REST_SECONDS = 60;
const DEFAULT_VIBRATION_ENABLED = true;

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

function buildConfigPageUrl() {
    return settings.buildConfigPageUrl(localStorage);
}

Pebble.addEventListener("ready", function() {
    console.log("PKJS ready.");
    sendSettingsToWatch();
});

Pebble.addEventListener("showConfiguration", function() {
    Pebble.openURL(buildConfigPageUrl());
});

Pebble.addEventListener("webviewclosed", function(e) {
    if (!e || !e.response) {
        return;
    }

    let data;
    try {
        data = JSON.parse(decodeURIComponent(e.response));
    } catch (error) {
        console.log("Invalid config response", error);
        return;
    }

    if (data.cancelled) {
        return;
    }

    const currentSettings = settings.normalizeSettings(data);

    settings.saveSettings(currentSettings, localStorage);
    sendSettingsToWatch();
});
