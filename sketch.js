let uranium_spacing = 100;
let neutron_speed = 5;

let font_1942;

function preload() {
	font_1942 = loadFont('1942.ttf');
}

class Particle {
	constructor(pos, vel, radius, mass, name) {
		this.pos = pos;
		this.vel = vel;
		this.radius = radius;
		this.mass = mass;
		this.name = name;
		this.textSize = this.radius * 2 / this.name.length;
		this.dx = -(this.name.length * this.textSize / 3);
		this.dy = this.textSize / 3;
	}
	draw() {
		this.pos.add(this.vel);

		noFill();
		stroke('white');
		ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);

		textSize(this.textSize);
		fill('white');
		noStroke();
		text(this.name, this.dx + this.pos.x, this.dy + this.pos.y);
	}
	momentum() {
		return p5.Vector.mult(this.vel, this.mass);
	}
}

class Atom extends Particle {
	constructor(pos, vel, name, mass) {
		super(pos, vel, mass / 10, mass, name);
	}

	fission(neutron, particles) {
		return false;
	}
}

class Uranium extends Atom {
	constructor(pos, vel) {
		super(pos, vel, "U", 235);
	}

	fission(neutron, neutrons, atoms) {
		let imomentum = p5.Vector.add(this.momentum(), (neutrons[neutron].momentum()));

		let nmomentum = createVector();
		for (let j = 0; j < 3; j++) {
			let nn = new Neutron(this.pos.copy(), p5.Vector.add(this.vel, p5.Vector.random2D().mult(random(neutron_speed * .4, neutron_speed * 1.6))));
			neutrons.push(nn);
			nmomentum.add(nn.momentum());
		}
		let kr = new Atom(
			this.pos.copy(),
			p5.Vector.add(this.vel, p5.Vector.random2D().mult(random(1.5, 6))),
			"Kr",
			89
		);
		nmomentum.add(kr.momentum());

		let ba = new Atom(
			this.pos.copy(),
			p5.Vector.div(p5.Vector.sub(imomentum, nmomentum), 144),
			"Ba",
			144
		);
		atoms.push(kr);
		atoms.push(ba);
		return true;
	}
}

class Neutron extends Particle {
	constructor(pos, vel) {
		super(pos, vel, 5, 1, "n");
		this.speed = vel.mag();
		this.escaped = false;
	}
	draw() {
		super.draw();
		if (!this.escaped && random() < 5 / this.speed) {
			if (this.pos.x < this.radius || this.pos.x + this.radius > width) {
				this.vel.x *= -1;
			}
			if (this.pos.y < this.radius || this.pos.y + this.radius > height) {
				this.vel.y *= -1;
			}
		} else {
			if (this.pos.x < this.radius || this.pos.x + this.radius > width || this.pos.y < this.radius || this.pos.y + this.radius > width) {
				this.escaped = true;
			}
		}
	}
}

class Button {
	constructor(x, y, text, textSize, onclick) {
		this.x = x;
		this.y = y;
		this.text = text;
		this.textSize = textSize;
		this.width = textSize * text.length;
		this.right = x + this.width;
		this.height = textSize;
		this.bottom = y + this.height;
		this.onclick = onclick;
	}
	mouseOver() {
		return this.x <= mouseX && mouseX <= this.right && this.y <= mouseY && mouseY <= this.bottom;
	}
	draw() {
		if (this.mouseOver()) {
			stroke('white');
			fill('white');
		} else {
			noStroke();
			fill('white');
		}
		textSize(this.textSize);
		text(this.text, this.x, this.y + this.height);
	}
}

class Slider {
	constructor(x, y, text, textSize, begin, end) {
		this.x = x;
		this.y = y;
		this.w = 2;
		this.left = x + textSize / 3 * text.length;
		this.right = this.left + this.w;
		this.h = 200;
		this.top = y + textSize / 2;
		this.bottom = this.top + this.h;
		this.text = text;
		this.textSize = textSize;
		this.begin = begin;
		this.end = end;
		this.range = end - begin;
		
		this.value = begin;
		this.kleft = this.left - 10;
		this.kright = this.right + 10;
		this.kw = this.kright - this.kleft;
		this.kh = 4;

		this.isDragging = false;
	}
	mouseOver() {
		return this.kleft <= mouseX && mouseX <= this.kright && this.top <= mouseY && mouseY <= this.bottom;
	}
	knobPosition() {
		return this.bottom - this.h * (this.value - this.begin) / this.range;
	}
	updateValue() {
		this.value = this.range * (this.bottom - mouseY) / this.h + this.begin;
		if (this.value < this.begin) {
			this.value = this.begin;
		}
		if (this.value > this.end) {
			this.value = this.end;
		}
	}
	draw() {
		noStroke();
		fill('white');
		textSize(this.textSize);
		text(this.text, this.x, this.y);
		
		rect(this.left, this.top, this.w, this.h);
		
		fill('black');
		stroke('white');
		rect(this.kleft, this.knobPosition(), this.kw, this.kh);
	}
}

let neutronList;
let uraniumList;
let atomList;
let restartButton;
let neutronSpeedSlider;
let uraniumSpacingSlider;

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(60);

	restartButton = new Button(24, 24, '(Re)start', 24, function () {
		atomList = [];
		neutronList = [];
		uraniumList = [];
		neutron_speed = neutronSpeedSlider.value;
		uranium_spacing = uraniumSpacingSlider.value;
		for (let x = width / 2; x < width; x += uranium_spacing) {
			for (let y = 40; y < height; y += uranium_spacing) {
				uraniumList.push(new Uranium(
					createVector(x, y),
					createVector(0, 0)
				));
			}
		}
		let firstNeutronSpeed = p5.Vector.random2D().mult(neutron_speed);
		firstNeutronSpeed.x = Math.abs(firstNeutronSpeed.x);
		neutronList.push(
			new Neutron(
				createVector(width / 2 - 300, height / 2),
				firstNeutronSpeed,
			)
		);
	});

	neutronSpeedSlider = new Slider(24, 96, 'N-vel', 20, 5, 50);
	uraniumSpacingSlider = new Slider(96, 96, 'U-spc', 20, 100, 250);

	restartButton.onclick();

	textFont(font_1942);
}

function mouseClicked() {
	if (restartButton.mouseOver()) {
		restartButton.onclick();
	}
}

function mouseDragged() {
	if (neutronSpeedSlider.isDragging) {
		neutronSpeedSlider.updateValue();
	}
	if (uraniumSpacingSlider.isDragging) {
		uraniumSpacingSlider.updateValue();
	}
}

function mousePressed() {
	if (neutronSpeedSlider.mouseOver()) {
		neutronSpeedSlider.isDragging = true;
	}
	if (uraniumSpacingSlider.mouseOver()) {
		uraniumSpacingSlider.isDragging = true;
	}
}

function mouseReleased() {
	neutronSpeedSlider.isDragging = false;
	uraniumSpacingSlider.isDragging = false;
}

function distSq(x1, y1, x2, y2) {
	let dx = x1 - x2;
	let dy = y1 - y2;
	return dx * dx + dy * dy;
}

function removeRemoved(particles, toRemove) {
	for (let p = particles.length - 1; p >= 0; p--) {
		if (particles[p].pos.x < 0 || particles[p].pos.x > width ||
			particles[p].pos.y < 0 || particles[p].pos.y > height ||
			toRemove.includes(p)) {
			particles.splice(p, 1);
		}
	}
}

function draw() {
	background('black');

	atomList.forEach(p => {
		p.draw();
	});
	neutronList.forEach(p => {
		p.draw();
	});
	uraniumList.forEach(p => {
		p.draw();
	});

	let removedNeutron = [];
	if (uraniumList.length > 0 && neutronList.length > 0) {
		let mk = [];
		nlop: for (let n = neutronList.length - 1; n >= 0; n--) {
			for (let u = uraniumList.length - 1; u >= 0; u--) {
				const dsq = distSq(neutronList[n].pos.x, neutronList[n].pos.y, uraniumList[u].pos.x, uraniumList[u].pos.y);
				const cd = neutronList[n].radius + uraniumList[u].radius;
				if (dsq < cd * cd) {
					mk.push([n, u]);
					continue nlop;
				}
			}
		}
		let removedUranium = [];
		mk.forEach(function ([n, u]) {
			if (uraniumList[u].fission(n, neutronList, atomList)) {
				removedNeutron.push(n);
				removedUranium.push(u);
			}
		});
		removeRemoved(uraniumList, removedUranium);
	}

	removeRemoved(neutronList, removedNeutron);
	removeRemoved(atomList, []);

	restartButton.draw();
	neutronSpeedSlider.draw();
	uraniumSpacingSlider.draw();
}