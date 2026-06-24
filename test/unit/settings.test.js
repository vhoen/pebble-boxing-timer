const test = require("node:test");
const assert = require("node:assert/strict");

const settings = require("../../src/pkjs/settings");

function createStorage(initialValues = {}) {
    const entries = new Map(Object.entries(initialValues));

    return {
        getItem(key) {
            return entries.has(key) ? entries.get(key) : null;
        },
        setItem(key, value) {
            entries.set(key, String(value));
        },
        entries() {
            return Object.fromEntries(entries.entries());
        }
    };
}

test("toPositiveInt falls back on invalid values", () => {
    assert.equal(settings.toPositiveInt("42", 7), 42);
    assert.equal(settings.toPositiveInt("0", 7), 7);
    assert.equal(settings.toPositiveInt("-5", 7), 7);
    assert.equal(settings.toPositiveInt("abc", 7), 7);
});

test("loadSettings reads stored values and keeps defaults", () => {
    const storage = createStorage({
        roundSeconds: "150",
        restSeconds: "45",
        vibrationEnabled: "0"
    });

    assert.deepEqual(settings.loadSettings(storage), {
        round: 150,
        rest: 45,
        vibrationEnabled: false
    });
});

test("buildConfigQueryString encodes settings", () => {
    assert.equal(
        settings.buildConfigQueryString({ round: 135, rest: 75, vibrationEnabled: true }),
        "round=135&rest=75&vibration=1"
    );
    assert.equal(
        settings.buildConfigQueryString({ round: 90, rest: 30, vibrationEnabled: false }),
        "round=90&rest=30&vibration=0"
    );
});

test("buildConfigPageUrl returns HTTPS URL with current settings", () => {
    const storage = createStorage({
        roundSeconds: "135",
        restSeconds: "75",
        vibrationEnabled: "1"
    });

    const url = settings.buildConfigPageUrl(storage);
    assert.ok(url.startsWith("https://"));
    assert.ok(!url.startsWith("data:text/html"));
    assert.equal(
        url,
        settings.CONFIG_BASE_URL + "?round=135&rest=75&vibration=1"
    );
});
