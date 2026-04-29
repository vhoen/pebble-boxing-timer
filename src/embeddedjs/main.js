import Poco from "commodetto/Poco";

let render = new Poco(screen);

// Fonts
const smallFont = new render.Font("Gothic-Regular", 18);
const largeFont = new render.Font("Bitham-Black", 30);
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);

const halfHeight = render.height / 2;

function draw() {
	render.begin();
	render.fillRectangle(white, 0, 0, render.width, render.height);
	
	// Upper half - Round
	drawSection(0, "Round", "--:--");
	
	// Lower half - Repos
	drawSection(halfHeight, "Repos", "--:--");
 
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
