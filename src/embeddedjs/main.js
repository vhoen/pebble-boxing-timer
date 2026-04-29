import Poco from "commodetto/Poco";
import Message from "pebble/message";

let render = new Poco(screen);

// Fonts
const smallFont = new render.Font("Gothic-Regular", 18);
const largeFont = new render.Font("Bitham-Black", 30);
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);

const halfHeight = render.height / 2;

const DEFAULT_ROUND_SECONDS = 120;
const DEFAULT_REST_SECONDS = 60;

let roundSeconds = DEFAULT_ROUND_SECONDS;
let restSeconds = DEFAULT_REST_SECONDS;

const messages = new Message({
	keys: ["ROUND_SECONDS", "REST_SECONDS"],
	onReadable() {
		const map = messages.read();
		if (!map)
			return;

		const newRound = map.get("ROUND_SECONDS");
		const newRest = map.get("REST_SECONDS");

		if (Number.isInteger(newRound) && (newRound > 0))
			roundSeconds = newRound;
		if (Number.isInteger(newRest) && (newRest > 0))
			restSeconds = newRest;

		draw();
	}
});

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
	drawSection(0, "Round", formatSeconds(roundSeconds));
	
	// Lower half - Repos
	drawSection(halfHeight, "Repos", formatSeconds(restSeconds));
 
	render.end();
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

draw();
