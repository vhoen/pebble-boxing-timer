const DEFAULT_ROUND_SECONDS = 120;
const DEFAULT_REST_SECONDS = 60;
const DEFAULT_VIBRATION_ENABLED = true;

// Hosted on GitHub Pages (docs/ folder). Enable Pages: Settings → Pages → /docs.
const CONFIG_BASE_URL = "https://vhoen.github.io/pebble-boxing-timer/config.html";

function toPositiveInt(value, fallback) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
}

function loadSettings(storage) {
    const localStore = storage || localStorage;

    return {
        round: toPositiveInt(localStore.getItem("roundSeconds"), DEFAULT_ROUND_SECONDS),
        rest: toPositiveInt(localStore.getItem("restSeconds"), DEFAULT_REST_SECONDS),
        vibrationEnabled: localStore.getItem("vibrationEnabled") !== "0"
    };
}

function saveSettings(settings, storage) {
    const localStore = storage || localStorage;

    localStore.setItem("roundSeconds", String(settings.round));
    localStore.setItem("restSeconds", String(settings.rest));
    localStore.setItem("vibrationEnabled", settings.vibrationEnabled ? "1" : "0");
}

function normalizeSettings(data) {
    return {
        round: toPositiveInt(data.round, DEFAULT_ROUND_SECONDS),
        rest: toPositiveInt(data.rest, DEFAULT_REST_SECONDS),
        vibrationEnabled: ("vibrationEnabled" in data) ? !!data.vibrationEnabled : DEFAULT_VIBRATION_ENABLED
    };
}

function buildConfigQueryString(settings) {
    const params = [
        "round=" + encodeURIComponent(String(settings.round)),
        "rest=" + encodeURIComponent(String(settings.rest)),
        "vibration=" + (settings.vibrationEnabled ? "1" : "0")
    ];
    return params.join("&");
}

function buildConfigPageUrl(storage, baseUrl) {
    const currentSettings = storage ? loadSettings(storage) : loadSettings();
    const urlBase = baseUrl || CONFIG_BASE_URL;
    return urlBase + "?" + buildConfigQueryString(currentSettings);
}

module.exports = {
    CONFIG_BASE_URL,
    DEFAULT_ROUND_SECONDS,
    DEFAULT_REST_SECONDS,
    DEFAULT_VIBRATION_ENABLED,
    toPositiveInt,
    loadSettings,
    saveSettings,
    normalizeSettings,
    buildConfigQueryString,
    buildConfigPageUrl
};
