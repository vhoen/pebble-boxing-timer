const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const vm = require("node:vm");

function createStorage(initialValues = {}) {
    const entries = new Map(Object.entries(initialValues));

    return {
        getItem(key) {
            return entries.has(key) ? entries.get(key) : null;
        },
        setItem(key, value) {
            entries.set(key, String(value));
        },
        snapshot() {
            return Object.fromEntries(entries.entries());
        }
    };
}

function extractScript(html) {
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    if (!match) {
        throw new Error("Embedded script not found");
    }

    return match[1];
}

function createFakeDocument() {
    const elements = new Map();

    function createElement(id) {
        return {
            id,
            value: "",
            checked: false,
            listeners: {},
            addEventListener(eventName, handler) {
                this.listeners[eventName] = handler;
            },
            click() {
                if (this.listeners.click) {
                    this.listeners.click();
                }
            }
        };
    }

    return {
        location: "",
        getElementById(id) {
            if (!elements.has(id)) {
                elements.set(id, createElement(id));
            }
            return elements.get(id);
        }
    };
}

function createConfigPageSandbox(document, locationSearch) {
    return {
        document,
        location: {
            search: locationSearch
        },
        encodeURIComponent,
        decodeURIComponent,
        JSON,
        parseInt,
        isNaN: Number.isNaN,
        console: { log() {} }
    };
}

function runConfigPageScript(document, locationSearch) {
    const configHtmlPath = path.join(__dirname, "../../docs/config.html");
    const html = fs.readFileSync(configHtmlPath, "utf8");
    const script = extractScript(html);
    const pageSandbox = createConfigPageSandbox(document, locationSearch);

    vm.createContext(pageSandbox);
    vm.runInContext(script, pageSandbox, { filename: "config-page.js" });
    return pageSandbox;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test("PKJS flow sends settings, opens configuration and persists the submitted payload", () => {
    const modulePath = path.join(__dirname, "../../src/pkjs/index.js");
    const source = fs.readFileSync(modulePath, "utf8");
    const sourceRequire = createRequire(modulePath);
    const localStorage = createStorage({
        roundSeconds: "90",
        restSeconds: "30",
        vibrationEnabled: "0"
    });

    const openedUrls = [];
    const sentMessages = [];
    const listeners = {};
    const timerHandles = new Set();

    class FakePoco {
        constructor() {
            this.width = 240;
            this.height = 240;
            this.Font = class {
                constructor(family, size) {
                    this.family = family;
                    this.size = size;
                    this.height = size;
                }
            };
        }
        makeColor(r, g, b) {
            return { r, g, b };
        }
        begin() {}
        fillRectangle() {}
        drawText() {}
        end() {}
        getTextWidth(text) {
            return String(text).length * 10;
        }
    }

    class FakeMessage {
        constructor(config) {
            this.config = config;
        }
        read() {
            return null;
        }
    }

    class FakeButton {
        constructor(config) {
            this.config = config;
        }
    }

    const sandbox = {
        console: { log() {} },
        screen: {},
        localStorage,
        Pebble: {
            addEventListener(name, handler) {
                listeners[name] = handler;
            },
            openURL(url) {
                openedUrls.push(url);
            },
            sendAppMessage(payload, onSuccess) {
                sentMessages.push(payload);
                if (onSuccess) {
                    onSuccess();
                }
            }
        },
        require(moduleName) {
            if (moduleName === "commodetto/Poco") {
                return FakePoco;
            }
            if (moduleName === "pebble/message") {
                return FakeMessage;
            }
            if (moduleName === "pebble/button") {
                return FakeButton;
            }
            if (moduleName === "timer") {
                return {
                    set(callback) {
                        const handle = { callback, type: "set" };
                        timerHandles.add(handle);
                        return handle;
                    },
                    repeat(callback) {
                        const handle = { callback, type: "repeat" };
                        timerHandles.add(handle);
                        return handle;
                    },
                    clear(handle) {
                        timerHandles.delete(handle);
                    }
                };
            }
            return sourceRequire(moduleName);
        },
        globalThis: null
    };

    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: modulePath });

    assert.equal(typeof listeners.ready, "function");
    assert.equal(typeof listeners.showConfiguration, "function");
    assert.equal(typeof listeners.webviewclosed, "function");

    listeners.ready();
    assert.deepEqual(plain(sentMessages.at(-1)), {
        ROUND_SECONDS: 90,
        REST_SECONDS: 30,
        VIBRATION_ENABLED: 0
    });

    listeners.showConfiguration();
    assert.equal(openedUrls.length, 1);
    assert.ok(openedUrls[0].startsWith("https://"));
    assert.match(openedUrls[0], /round=90&rest=30&vibration=0/);

    const document = createFakeDocument();
    runConfigPageScript(document, "?round=90&rest=30&vibration=0");

    const roundInput = document.getElementById("round");
    const restInput = document.getElementById("rest");
    const vibrationInput = document.getElementById("vibration");
    assert.equal(roundInput.value, "90");
    assert.equal(restInput.value, "30");
    assert.equal(vibrationInput.checked, false);

    roundInput.value = "180";
    restInput.value = "90";
    vibrationInput.checked = true;

    document.getElementById("save").click();
    assert.match(document.location, /^pebblejs:\/\/close#/);

    listeners.webviewclosed({ response: document.location.slice("pebblejs://close#".length) });

    assert.deepEqual(localStorage.snapshot(), {
        roundSeconds: "180",
        restSeconds: "90",
        vibrationEnabled: "1"
    });
    assert.deepEqual(plain(sentMessages.at(-1)), {
        ROUND_SECONDS: 180,
        REST_SECONDS: 90,
        VIBRATION_ENABLED: 1
    });
});

test("config page uses return_to for CloudPebble emulator save flow", () => {
    const document = createFakeDocument();
    const returnTo = "http://localhost/emulator/close?";

    runConfigPageScript(document, "?round=120&rest=60&vibration=1&return_to=" + encodeURIComponent(returnTo));

    document.getElementById("round").value = "200";
    document.getElementById("rest").value = "45";
    document.getElementById("vibration").checked = false;
    document.getElementById("save").click();

    assert.ok(document.location.startsWith(returnTo));
    const payload = JSON.parse(decodeURIComponent(document.location.slice(returnTo.length)));
    assert.deepEqual(payload, {
        round: 200,
        rest: 45,
        vibrationEnabled: false
    });
});

test("config page uses return_to for CloudPebble emulator cancel flow", () => {
    const document = createFakeDocument();
    const returnTo = "http://localhost/emulator/close?";

    runConfigPageScript(document, "?return_to=" + encodeURIComponent(returnTo));
    document.getElementById("cancel").click();

    assert.equal(document.location, returnTo);
});

test("webviewclosed accepts raw JSON without URI encoding", () => {
    const modulePath = path.join(__dirname, "../../src/pkjs/index.js");
    const source = fs.readFileSync(modulePath, "utf8");
    const sourceRequire = createRequire(modulePath);
    const localStorage = createStorage();
    const sentMessages = [];
    const listeners = {};

    const sandbox = {
        console: { log() {} },
        localStorage,
        Pebble: {
            addEventListener(name, handler) {
                listeners[name] = handler;
            },
            openURL() {},
            sendAppMessage(payload, onSuccess) {
                sentMessages.push(payload);
                if (onSuccess) {
                    onSuccess();
                }
            }
        },
        require(moduleName) {
            return sourceRequire(moduleName);
        },
        globalThis: null
    };

    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: modulePath });

    listeners.webviewclosed({
        response: JSON.stringify({ round: 150, rest: 30, vibrationEnabled: true })
    });

    assert.deepEqual(localStorage.snapshot(), {
        roundSeconds: "150",
        restSeconds: "30",
        vibrationEnabled: "1"
    });
    assert.deepEqual(plain(sentMessages.at(-1)), {
        ROUND_SECONDS: 150,
        REST_SECONDS: 30,
        VIBRATION_ENABLED: 1
    });
});
