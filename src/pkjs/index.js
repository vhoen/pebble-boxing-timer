const DEFAULT_ROUND_SECONDS = 120;
const DEFAULT_REST_SECONDS = 60;

function toPositiveInt(value, fallback) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
}

function loadSettings() {
    return {
        round: toPositiveInt(localStorage.getItem("roundSeconds"), DEFAULT_ROUND_SECONDS),
        rest: toPositiveInt(localStorage.getItem("restSeconds"), DEFAULT_REST_SECONDS)
    };
}

function saveSettings(settings) {
    localStorage.setItem("roundSeconds", String(settings.round));
    localStorage.setItem("restSeconds", String(settings.rest));
}

function sendSettingsToWatch() {
    const settings = loadSettings();
    Pebble.sendAppMessage(
        {
            ROUND_SECONDS: settings.round,
            REST_SECONDS: settings.rest
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
    const settings = loadSettings();
    const html = `<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Boxing Timer</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; background: #f4f5f7; color: #1f2937; }
            .wrap { max-width: 480px; margin: 0 auto; padding: 20px; }
            h1 { font-size: 22px; margin: 0 0 16px; }
            .card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); }
            label { display: block; font-weight: 600; margin: 10px 0 6px; text-transform: lowercase; }
            input { width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px; }
            .hint { font-size: 13px; color: #6b7280; margin-top: 10px; }
            .actions { display: flex; gap: 10px; margin-top: 16px; }
            button { flex: 1; border: 0; border-radius: 10px; padding: 12px; font-size: 16px; }
            .save { background: #111827; color: #fff; }
            .cancel { background: #e5e7eb; color: #111827; }
        </style>
    </head>
    <body>
        <div class="wrap">
            <h1>Configuration</h1>
            <div class="card">
                <label for="round">round (seconds)</label>
                <input id="round" type="number" min="1" step="1" value="${settings.round}" />

                <label for="rest">repos (seconds)</label>
                <input id="rest" type="number" min="1" step="1" value="${settings.rest}" />

                <div class="hint">Default values: round 120, repos 60</div>

                <div class="actions">
                    <button class="cancel" id="cancel">Annuler</button>
                    <button class="save" id="save">Enregistrer</button>
                </div>
            </div>
        </div>
        <script>
            function closeWith(payload) {
                document.location = "pebblejs://close#" + encodeURIComponent(JSON.stringify(payload));
            }

            document.getElementById("cancel").addEventListener("click", function() {
                closeWith({ cancelled: true });
            });

            document.getElementById("save").addEventListener("click", function() {
                var round = parseInt(document.getElementById("round").value, 10);
                var rest = parseInt(document.getElementById("rest").value, 10);
                if (!round || round <= 0) round = ${DEFAULT_ROUND_SECONDS};
                if (!rest || rest <= 0) rest = ${DEFAULT_REST_SECONDS};
                closeWith({ round: round, rest: rest });
            });
        </script>
    </body>
</html>`;

    return "data:text/html," + encodeURIComponent(html);
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

    const settings = {
        round: toPositiveInt(data.round, DEFAULT_ROUND_SECONDS),
        rest: toPositiveInt(data.rest, DEFAULT_REST_SECONDS)
    };

    saveSettings(settings);
    sendSettingsToWatch();
});
