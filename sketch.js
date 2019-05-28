let uranium_spacing;
let neutron_speed;
let interact_chance_ps;
let interact_chance;

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
        super(pos, vel, 'U', 235);
    }

    fission(neutron, neutrons, atoms) {
        if (random() > interact_chance) return false;
        
        let imomentum = p5.Vector.add(this.momentum(), (neutrons[neutron].momentum()));

        let nmomentum = createVector();
        for (let j = 0; j < 3; j++) {
            let nn = new Particle(this.pos.copy(), p5.Vector.add(this.vel, p5.Vector.random2D().mult(random(neutron_speed * .4, neutron_speed * 1.6))), 5, 1, 'n');
            neutrons.push(nn);
            nmomentum.add(nn.momentum());
        }
        let kr = new Atom(
            this.pos.copy(),
            p5.Vector.add(this.vel, p5.Vector.random2D().mult(random(1.5, 6))),
            'Kr',
            89
        );
        nmomentum.add(kr.momentum());

        let ba = new Atom(
            this.pos.copy(),
            p5.Vector.div(p5.Vector.sub(imomentum, nmomentum), 144),
            'Ba',
            144
        );
        atoms.push(kr);
        atoms.push(ba);
        return true;
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
            fill('grey');
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
        return this.kleft <= mouseX && mouseX <= this.kright && this.top - this.kh <= mouseY && mouseY <= this.bottom + this.kh;
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
        if (this.mouseOver() || this.isDragging) {
            fill('white');
            stroke('white');
        } else {
            fill('grey');
        }
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

let sliders;
let neutronSpeedSlider;
let uraniumSpacingSlider;
let interactChanceSlider;

function setup() {
    createCanvas(windowWidth, windowHeight);

    restartButton = new Button(24, 24, '(Re)start', 24, function () {
        atomList = [];
        neutronList = [];
        uraniumList = [];
        neutron_speed = neutronSpeedSlider.value;
        uranium_spacing = height / uraniumSpacingSlider.value;
        interact_chance_ps = interactChanceSlider.value;
        
        for (let x = width / 2; x < width; x += uranium_spacing) {
            for (let y = 40; y < height; y += uranium_spacing) {
                uraniumList.push(new Uranium(
                    createVector(x, y),
                    createVector(0, 0)
                ));
            }
        }
        let firstNeutronSpeed = createVector(neutron_speed, 0).rotate(random(-PI / 8, PI / 8));
        neutronList.push(
            new Particle(
                createVector(width / 2 - 300, height / 2),
                firstNeutronSpeed,
                5, 1, "n"
            )
        );
    });

    neutronSpeedSlider = new Slider(24, 96, 'Speed', 20, 5, 50);
    uraniumSpacingSlider = new Slider(120, 96, 'Density', 20, 5, 10);
    interactChanceSlider = new Slider(216, 96, 'Chance', 20, .80, .995);
    sliders = [neutronSpeedSlider, uraniumSpacingSlider, interactChanceSlider];

    restartButton.onclick();

    textFont(font_1942);
}

function mouseClicked() {
    if (restartButton.mouseOver()) {
        restartButton.onclick();
    }
}

function mouseDragged() {
    sliders.forEach(slider => {
        if (slider.isDragging) {
            slider.updateValue();
        }
    });
}

function mousePressed() {
    sliders.forEach(slider => {
        if (slider.mouseOver()) {
            slider.isDragging = true;
        }
    });
}

function mouseReleased() {
    sliders.forEach(slider => {
        slider.isDragging = false;
    });
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

    interact_chance = 1 - pow((1 - interact_chance_ps), 1 / frameRate());
    
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
    sliders.forEach(slider => {
        slider.draw();
    });
}
