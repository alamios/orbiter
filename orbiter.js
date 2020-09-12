/*
 * 
 * Data: https://ssd.jpl.nasa.gov/horizons.cgi
 * Units: kg / m / m/s
 * Date: 2020/01/01
 *
 */

class AstroDefinition {
    constructor(name, mass, radius) {
        this.name = name;
        this.mass = mass;
        this.radius = radius;
    }
}

class Astro {
    constructor(definition, x, y, vx, vy) {
        this.name = definition.name;
        this.mass = definition.mass;
        this.radius = definition.radius;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }
    accelerate(gx, gy) {
        this.vx += gx;
        this.vy += gy;
    }
    move() {
        this.x += this.vx;
        this.y += this.vy;
    }
    static interact(astro1, astro2, gravity) {   
        var dx = astro2.x - astro1.x;
        var dy = astro2.y - astro1.y;
        var dist = Math.sqrt((dx * dx) + (dy * dy));
        var force = gravity * ((astro1.mass * astro2.mass) / (dist * dist));
        
        var acc = (force / astro1.mass);
        var dist_rel = dist / acc;
        var gx = dx / dist_rel;
        var gy = dy / dist_rel;
        astro1.accelerate(gx, gy);
        
        acc = (force / astro2.mass);
        dist_rel = dist / acc;
        gx = dx / dist_rel;
        gy = dy / dist_rel;
        astro2.accelerate(-gx, -gy);
    }
}

class Universe {
    constructor(name, gravity, size, astros) {
        this.name = name;
        this.gravity = gravity;
        this.size = size;
        this.astros = astros;
    }
    interact() {
        for (var i=0; i<this.astros.length-1; i++) {
            for (var j=i+1; j<this.astros.length; j++) {
                Astro.interact(this.astros[i], this.astros[j], this.gravity);
            }
        }    
        for (var astro of this.astros) {
            astro.move();
        }
    } 
}

class Orbiter {
    constructor(universe, dpatts, ratios, stepreps, stepinterval) {
        this.universe = universe;
        this.dpatts = dpatts;
        this.ratios = ratios;
        this.stepreps = stepreps;
        this.stepinterval = stepinterval;
        this.running = false;    
        this.sizes = [];
        this.images = [];
        this.speed = stepreps * (1000 / stepinterval);
        this.date = new Date(Date.UTC(2020));
        this.date.dateFn = (this.speed > 86400) ? this.date.toCommonUTCDateString : this.date.toCommonUTCString;
        this.wrapper = document.getElementById("orbiter");
        this.display = document.querySelectorAll("#orbiter .display")[0];
        this.credits = document.querySelectorAll("#orbiter .credits")[0];
        this.canvas = document.querySelectorAll("#orbiter .canvas")[0];
        this.ctxt = this.canvas.getContext('2d');
        this.sysdate = document.createElement("span");

        var info = document.querySelectorAll("#orbiter .system")[0];
        var sysinfo1 = document.createElement("span");
        var sysinfo2 = document.createElement("span");
        var sysname = document.createElement("span");
        var sysspeed = document.createElement("span");
        var sysdate = document.createElement("span");
        var sep = document.createElement("span");
        var xsep = document.createElement("span");
        
        sysname.innerHTML = universe.name;
        sysspeed.innerHTML = " Speed x" + this.speed;
        sysdate.innerHTML = " Date ";
        sep.innerHTML = " | ";
        xsep.innerHTML = " x";

        info.append(sysinfo1);
        info.append(document.createElement("br"));
        info.append(sysinfo2);
        sysinfo1.append(sysname);
        sysinfo1.append(sep.cloneNode(true));
        sysinfo1.append(sysspeed);
        sysinfo1.append(sep.cloneNode(true));
        sysinfo1.append(sysdate);
        sysinfo1.append(this.sysdate);

        for (var i=0; i<universe.astros.length; i++) {
            var astroname = document.createElement("span");
            var astrozoom = document.createElement("span");
            astroname.innerHTML = universe.astros[i].name;
            astrozoom.innerHTML = ratios[dpatts[i+1][0]];    
            
            sysinfo2.append(astroname);
            sysinfo2.append(xsep.cloneNode(true));
            sysinfo2.append(astrozoom);
            if (i < universe.astros.length-1) {
                sysinfo2.append(sep.cloneNode(true));
            }
        }

        this.sysdate.innerHTML = this.date.dateFn();
        this.credits.style.display = "none";
        var creditlink = document.querySelectorAll("#orbiter .credit-link");
        creditlink[0].addEventListener('click', function(evt) {
            this.stop();
            this.display.style.display = "none";
            this.credits.style.display = "block";
        }.bind(this));
        var creditback = document.querySelectorAll("#orbiter .credit-goback");
        creditback[0].addEventListener('click', function(evt) {
            this.credits.style.display = "none";
            this.display.style.display = "block";
            this.start();
        }.bind(this));
    }
    draw() {	
        this.ctxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (var i=0; i<this.universe.astros.length; i++) {
            var rad = this.sizes[i+1];
            var diam = Math.round(rad * 2);
            this.ctxt.drawImage(this.images[i],
                Math.round(this.universe.astros[i].x / this.sizes[0] - rad), 
                Math.round(this.universe.astros[i].y / this.sizes[0] - rad), 
                diam, diam);
        }	
    }
    step() {
        for (var i=0; i<this.stepreps; i++) {
            this.universe.interact();
        }
        this.draw();
        this.date.setSeconds(this.date.getSeconds() + this.stepreps);
        this.sysdate.innerHTML = this.date.dateFn();
    }
    resize() {
        var smaller = this.canvas.parentElement.clientWidth;
        if (smaller > this.canvas.parentElement.clientHeight)
            smaller = this.canvas.parentElement.clientHeight;
        this.canvas.width = smaller;
        this.canvas.height = smaller;
        this.canvas.style.width = smaller + "px";
        this.canvas.style.height = smaller + "px";          
        this.sizes[0] = [this.universe.size / smaller];
        var loads = 0;
        for (var i=0; i<this.universe.astros.length; i++) {
            var zoom = this.ratios[this.dpatts[i+1][0]];
            this.sizes[i+1] = this.universe.astros[i].radius * zoom / this.sizes[0];
            this.images[i] = new Image();
            if (!this.running) {
                this.images[i].addEventListener("load", function() {
                    loads++;
                    if (loads == this.universe.astros.length)
                        setTimeout(lazyImageLoad, 1000);
                }.bind(this));
            }
            var size = Math.round(this.sizes[i+1] * 2);
            var done = false;
            while (!done) {
                var path = this.dpatts[i+1][1].replace(this.dpatts[0][0], size);
                if (urlExists(path)) {
                    this.images[i].src = path;
                    done = true;
                }
                else if (size > this.dpatts[0][1]) {
                    this.images[i].src = this.dpatts[i+1][1].replace(this.dpatts[0][0], this.dpatts[0][1]);
                    done = true;
                }
                size++;
            }
        }
    }
    start() {
        this.resize();
        this.interval = setInterval(() => this.step(), this.stepinterval);
        this.running = true;
    }
    stop() {
        clearInterval(this.interval);
        this.running = false;
    }
}

function solarSystem(container) {
    var size = 3.5 * AU;
    var cx = size/2;
    var cy = size/2;
    var astros = [
        new Astro(SUN, cx-5.682653841092885E+08, cy+1.112997165528592E+09, -1.446153643855376E-05, -3.447507130430867E-06),
        new Astro(MERCURY, cx-1.004302793346122E+10, cy-6.782848247285485E+10, 3.847265155592926E+04, -4.158689546981208E+03),
        new Astro(VENUS, cx+1.076209595805564E+11, cy+8.974122818036491E+09, -2.693485084259549E+03, 3.476650462014290E+04),
        new Astro(EARTH, cx-2.545323708273825E+10, cy+1.460913442868109E+11, -2.986338200235307E+04, -5.165822246700293E+03),
        new Astro(MARS, cx-1.980535522170065E+11, cy-1.313944334060654E+11, 1.439273929359666E+04, -1.805004074289640E+04),
        new Astro(STARMAN, cx-6.364150296583878E+10, cy-1.996812140241804E+11, 2.064456758866443E+04, -1.283240781976068E+04)];
    var universe = new Universe("Solar System", GRAVITY, size, astros);

    loadHTML(false, "orbiter/orbiter.html", container);
    var dpatts = [["[s]", 500],
        [0, "orbiter/img/sun/sun1_[s].png"],
        [1, "orbiter/img/mercury/mercury_[s].png"],
        [1, "orbiter/img/venus/venus_[s].png"], 
        [1, "orbiter/img/earth/earth_[s].png"], 
        [1, "orbiter/img/mars/mars_[s].png"],
        [2, "orbiter/img/starman/starman_[s].png"]];
    var ratios = [30, 1500, 7000000000];
    var stepreps = 20000;
    var stepinterval = 10;
    return new Orbiter(universe, dpatts, ratios, stepreps, stepinterval);
}

function binarySystem(container) {
    var size = 8 * AU;
    var cx = size/2;
    var cy = size/2;
    var astros = [
        new Astro(SUN, cx+1.0E+10, cy, 0, 1.5E+04),
        new Astro(CYGNI61B, cx-2.0E+11, cy, 0, -2.5E+04)];
    var universe = new Universe("Binary System", GRAVITY, size, astros);

    loadHTML(false, "orbiter/orbiter.html", container);
    var dpatts = [["[s]", 500],
        [0, "orbiter/img/sun/sun1_[s].png"],
        [0, "orbiter/img/sun/sun2_[s].png"]];
    var ratios = [50, 1500];
    var stepreps = 20000;
    var stepinterval = 10;
    return new Orbiter(universe, dpatts, ratios, stepreps, stepinterval);
}
 
const AU = 1.495978707e11;
const GRAVITY = 6.67428e-11;

const SUN = new AstroDefinition("Sun", 1.9885e30, 6.957e8);
const MERCURY = new AstroDefinition("Mercury", 3.302e23, 2.440e6);
const VENUS = new AstroDefinition("Venus", 4.8685e24, 6.05184e6);
const EARTH = new AstroDefinition("Earth", 5.97219e24, 6.378137e6);
const MARS = new AstroDefinition("Mars", 6.4171e23, 3.38992e6);
const STARMAN = new AstroDefinition("Starman", 1.305e3, 1.974);

const PROXIMA = new AstroDefinition("Proxima Centauri", SUN.mass*0.1221, SUN.radius*0.1542);
const BELLATRIX = new AstroDefinition("Bellatrix", SUN.mass*8.6, SUN.radius*5.75);
const CYGNI61B = new AstroDefinition("61 Cygni B", SUN.mass*0.63, SUN.radius*0.595);