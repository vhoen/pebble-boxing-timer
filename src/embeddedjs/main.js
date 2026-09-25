import Poco from "commodetto/Poco";
import Message from "pebble/message";
import Button from "pebble/button";
import Timer from "timer";

let render = new Poco(screen);

// Fonts
const smallFont = new render.Font("Gothic-Regular", 18);
const largeFont = new render.Font("Bitham-Black", 30);
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);

const halfHeight = render.height / 2;

const DEFAULT_ROUND_SECONDS = 120;
const DEFAULT_REST_SECONDS = 60;
const DEFAULT_VIBRATION_ENABLED = true;
const LONG_PRESS_MS = 700;

let roundSeconds = DEFAULT_ROUND_SECONDS;
let restSeconds = DEFAULT_REST_SECONDS;
let roundRemaining = DEFAULT_ROUND_SECONDS;
let restRemaining = DEFAULT_REST_SECONDS;
let activeTimer = "round";
let isRunning = false;
let vibrationEnabled = DEFAULT_VIBRATION_ENABLED;
let tickTimer;
let longPressTimer;
let longPressHandled = false;

const messages = new Message({
	keys: ["ROUND_SECONDS", "REST_SECONDS", "VIBRATION_ENABLED"],
	onReadable() {
		const map = messages.read();
		if (!map)
			return;

		const newRound = map.get("ROUND_SECONDS");
		const newRest = map.get("REST_SECONDS");
		const newVibrationEnabled = map.get("VIBRATION_ENABLED");

		if (Number.isInteger(newRound) && (newRound > 0))
			roundSeconds = newRound;
		if (Number.isInteger(newRest) && (newRest > 0))
			restSeconds = newRest;
		if ((newVibrationEnabled === 0) || (newVibrationEnabled === 1))
			vibrationEnabled = (newVibrationEnabled === 1);

		resetTimers();

		draw();
	}
});

function onSelectPush(pushed) {
	if (pushed) {
		longPressHandled = false;
		longPressTimer = Timer.set(() => {
			longPressHandled = true;
			resetTimers();
			draw();
		}, LONG_PRESS_MS);
		return;
	}

	if (longPressTimer) {
		Timer.clear(longPressTimer);
		longPressTimer = undefined;
	}

	if (!longPressHandled)
		toggleRunning();
}

function formatSeconds(totalSeconds) {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const paddedSeconds = String(seconds).padStart(2, "0");
	return `${minutes}:${paddedSeconds}`;
}

function draw() {
	render.begin();
	render.fillRectangle(white, 0, 0, render.width, render.height);
	
	// Upper half - Round
	drawSection(0, "Round", formatSeconds(roundRemaining));
	
	// Lower half - Repos
	drawSection(halfHeight, "Repos", formatSeconds(restRemaining));
 
	render.end();
}

function resetTimers() {
	stopTicking();
	roundRemaining = roundSeconds;
	restRemaining = restSeconds;
	activeTimer = "round";
	isRunning = false;
}

function toggleRunning() {
	if (isRunning) {
		stopTicking();
		isRunning = false;
		return;
	}

	isRunning = true;
	if (!tickTimer)
		tickTimer = Timer.repeat(onTick, 1000);
}

function stopTicking() {
	if (!tickTimer)
		return;
	Timer.clear(tickTimer);
	tickTimer = undefined;
}

function onTick() {
	if (!isRunning)
		return;

	if ("round" === activeTimer) {
		roundRemaining -= 1;
		if (roundRemaining <= 0) {
			vibrateRoundEnd();
			roundRemaining = roundSeconds;
			restRemaining = restSeconds;
			activeTimer = "rest";
		}
	}
	else {
		restRemaining -= 1;
		if (restRemaining <= 0) {
			vibrateRestEnd();
			restRemaining = restSeconds;
			roundRemaining = roundSeconds;
			activeTimer = "round";
		}
	}

	draw();
}

function drawSection(yOffset, label, time) {
	const sectionHeight = render.height / 2;
	const labelX = render.width - 10;
	const labelY = yOffset + 10;
	
	// Draw label (right-aligned, small font)
	render.drawText(label, smallFont, black, labelX - render.getTextWidth(label, smallFont), labelY);
	
	// Draw time placeholder (centered, large font)
	const timeWidth = render.getTextWidth(time, largeFont);
	const timeX = (render.width - timeWidth) / 2;
	const timeY = yOffset + (sectionHeight - largeFont.height) / 2;
	render.drawText(time, largeFont, black, timeX, timeY);
}

function tryShortVibration() {
	const fn = globalThis.vibes_short_pulse;
	if ("function" !== typeof fn)
		return false;
	try {
		fn();
		return true;
	}
	catch (_) {
		return false;
	}
}

function vibrateRoundEnd() {
	if (!vibrationEnabled)
		return;

	if (!tryShortVibration())
		return;

	Timer.set(() => {
		tryShortVibration();
	}, 180);
}

function vibrateRestEnd() {
	if (!vibrationEnabled)
		return;

	tryShortVibration();
}

// A zero delay still runs before the pushed window can take clicks or paint.
Timer.set(() => {
	draw();
	new Button({
		type: "select",
		raw: true,
		onPush: onSelectPush
	});
}, 50);
