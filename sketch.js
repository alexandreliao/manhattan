const SPACING = 100;
const NEUTRON_SPEED = 40;

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
            let nn = new Neutron(this.pos.copy(), p5.Vector.add(this.vel, p5.Vector.random2D().mult(random(NEUTRON_SPEED * .4, NEUTRON_SPEED * 1.6))));
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
            if (this.pos.x < this.radius || this.pos.x + this.radius > width ||
                this.pos.y < this.radius || this.pos.y + this.radius > width) {
                this.escaped = true;
            }
        }
    }
}

let neutronList;
let uraniumList;
let atomList;

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);
    atomList = [];
    neutronList = [];
    uraniumList = [];
    for (let x = width / 2; x < width; x += SPACING) {
        for (let y = 40; y < height; y += SPACING) {
            uraniumList.push(new Uranium(
                createVector(x, y),
                createVector(0, 0)
            ));
        }
    }
    neutronList.push(
        new Neutron(
            createVector(width / 2 - 300, height / 2),
            createVector(5, 0)
        )
    );
    textFont(font_1942);
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
}