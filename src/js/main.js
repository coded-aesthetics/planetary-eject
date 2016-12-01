function gradient(c1, c2) {
    function extractBytes(num, mask, shift) {
        var a = num & mask;
        return a >> shift;
    }
    function extractR(col) {
        return extractBytes(col, 0xff0000, 16);
    }
    function extractG(col) {
        return extractBytes(col, 0x00ff00, 8);
    }
    function extractB(col) {
        return extractBytes(col, 0x0000ff, 0);
    }
    var r1 = extractR(c1);
    var r2 = extractR(c2);
    var g1 = extractG(c1);
    var g2 = extractG(c2);
    var b1 = extractB(c1);
    var b2 = extractB(c2);
    var dR = r2 - r1;
    var dG = g2 - g1;
    var dB = b2 - b1;
    console.log(c1, c2, r1, r2, g1, g2, b1, b2, dR, dG, dB);
    this.getColor = function(v) {
        var r = Math.floor(r1 + v * dR);
        var g = Math.floor(g1 + v * dG);
        var b = Math.floor(b1 + v * dB);
        r = r << 16;
        g = g << 8;
        var color = r + g + b;
        return color.toString(16);
    }
    return this;
}

function distPoints(P1, P2) {
    var dx = P1[0]-P2[0];
    var dy = P1[1]-P2[1];
    return Math.sqrt(dx*dx+dy*dy);
}

function getDir(p1, p2) {
    return [p2[0]-p1[0], p2[1]-p1[1]];
}

function vecDot(v1, v2) {
    return v1[0]*v2[0] + v1[1]*v2[1];
}

function vecAdd(v1, v2) {
    return [v1[0]+v2[0],v1[1]+v2[1]];
}

function vecSub(v1, v2) {
    return vecAdd(v1, vecMul(v2, -1));
}

function vecMul(v, c) {
    return [v[0]*c,v[1]*c];
}

function vecDiv(v, c) {
    return vecMul(v, 1/c);
}

function vecLen(v) {
    return Math.sqrt(v[0]*v[0]+v[1]*v[1]);
}

function vecNorm(v) {
    var len = vecLen(v);
    if (len === 0) {
        return v.slice();
    }
    return vecDiv(v, len);
}

var s = Snap('#container');

function drawCircle(M, r, color) {
    if (color == undefined) {
        color = "#bada55";
    }
    var circle = s.circle(M[0], M[1], r);
    circle.attr({
        fill:color,
        strokeWidth: 1
    });
}

var width = document.querySelector('#container').getBoundingClientRect().width;
var height = document.querySelector('#container').getBoundingClientRect().height;

console.log(width, height);
var col1 = Math.floor(Math.random()*0xffffff);
var col2 = Math.floor(Math.random()*0xffffff);

var grad = new gradient(col1, col2);



function drawMover(mover) {
    var len;

    len = vecLen(mover.dir);
    len /= 300;
    len = Math.min(1, len);
    len = 1-len;
    len = mover.pos[1];
    len /= height;
    //len = Math.r
    // ound(len);
//len += 0.3;
    var colStr = "hsb("+len+ ",0.0, "+len+")";
    var colStr = "#"+grad.getColor(len);

    if (mover.isStatic) {colStr="#"+grad.getColor(1);}
    colStr = "#000";
    drawCircle(mover.pos, mover.radius, colStr);
}

var idCount = 0;
function mover(pos, dir, radius, mass, isStatic) {
    this.pos = pos;
    this.dir = dir;
    this.radius = radius;
    this.mass = mass;
    this.isStatic = isStatic;
    this.id = idCount++;
    this.lastColliders = [];
    this.move = function(time) {
        if (this.isStatic) {
            return;
        }
        this.dir = vecMul(this.dir, 0.99);
        this.pos = vecAdd(this.pos, vecMul(this.dir, time/1000));
    };
    this.moveTowards = function(mover, rate, time) {
        if (this.isStatic) {
            return;
        }
        var dir = getDir(this.pos, mover.pos);
        dir = vecNorm(dir);
        dir = vecMul(dir, rate * time / 1000);
        this.dir = vecAdd(this.dir, dir);
    };
    this.collide = function(mover) {
        var mass1 = Math.abs(this.mass);
        var mass2 = Math.abs(mover.mass);

        //mass1 = 5;
        //mass2 = 5;
        var dir = getDir(this.pos, mover.pos);
        var n = vecNorm(dir);

        var j = -(1.8) * vecDot(vecMul(vecSub(mover.dir, this.dir),1 / ((1 / mass1) + (1 / mass2))), n);

        if (j > 0) {
            this.dir = vecSub(this.dir, vecMul(n, j / mass1));
            mover.dir = vecAdd(mover.dir, vecMul(n, j / mass2));
        }
    };
    this.collide_ = function(mover) {
        for (var i = 0; i < this.lastColliders.length; i++) {
            if (this.lastColliders[i] == mover) {
                this.lastColliders.splice(i, 1);
                return;
            }
        }
        var newVelX1 = (this.dir[0] * (this.mass - mover.mass) + (2 * mover.mass * mover.dir[0])) / (this.mass + mover.mass);
        var newVelY1 = (this.dir[1] * (this.mass - mover.mass) + (2 * mover.mass * mover.dir[1])) / (this.mass + mover.mass);
        var newVelX2 = (mover.dir[0] * (mover.mass - this.mass) + (2 * this.mass * this.dir[0])) / (mover.mass + this.mass);
        var newVelY2 = (mover.dir[1] * (mover.mass - this.mass) + (2 * this.mass * this.dir[1])) / (mover.mass + this.mass);
        this.dir = [newVelX1, newVelY1];
        mover.dir = [-newVelX2, newVelY2];
        this.lastColliders.push(mover);
    };
    return this;
}

function spawnMover() {
    var x = Math.random() * width;
    var y = Math.random() * height*3/4;
    var radius = Math.random() * 10 + 5;
    var mass = Math.random() * 1000 + 500;
    return new mover([x,y], [Math.random()*20-10, Math.random()*20-10], radius, mass, false);
}

var startVec = [690, 190];
var r1 = 50;
drawCircle(startVec, r1, "#ff0000");

var gravOnVal = 12000;
var gravOffVal = 2000;
var gravOnValBottom = 350000;
var gravOffValBottom = -20000;

var center = new mover([width /8, 190], [0, 0], 70, gravOnVal, false);
var center2 = new mover([2*width/8, 190], [0, 0], 70, gravOnVal, false);
var center3 = new mover([3*width/8, 190], [0, 0], 70, gravOnVal, false);
var center4 = new mover([4*width/8, 190], [0, 0], 70, gravOnVal, false);
var center5 = new mover([5*width/8, 190], [0, 0], 70, gravOnVal, false);
var center6 = new mover([6*width/8, 190], [0, 0], 70, gravOnVal, false);
var center7 = new mover([7*width/8, 190], [0, 0], 70, gravOnVal, false);

var topRight = new mover([width, 0], [0, 0], 70, gravOffVal, true);
var topLeft = new mover([0, 0], [0, 0], 70, gravOffVal, true);

var centercenter = new mover([width/2, height/2], [0, 0], 50, 8000, true);

var bottomAttractor = new mover([width/2, height+Math.sqrt(3400*3400-(width/2)*(width/2))-100], [0, 0], 3400, gravOffValBottom, true);
var bottomAttractor2 = new mover([550, -2450+height], [0, 0], 1800, gravOffValBottom, true);

var gravOn = false;
var gOn = 0;
function switchGrav(){
    if (Math.random()> 0.5) {
        center.mass=gravOnVal*-2;
    } else {
        center.mass=gravOffVal;
    }
    if (Math.random()> 0.5) {
        center2.mass=gravOnVal*-2;
    } else {
        center2.mass=gravOffVal;
    }
    if (Math.random()> 0.5) {
        center3.mass=gravOnVal*-2;
    } else {
        center3.mass=gravOffVal;
    }
    if (Math.random()> 0.5) {
        center4.mass=gravOnVal*-2;
    } else {
        center4.mass=gravOffVal;
    }
    if (Math.random()> 0.5) {
        center5.mass=gravOnVal*-2;
    } else {
        center5.mass=gravOffVal;
    }
    if (Math.random()> 0.5) {
        center6.mass=gravOnVal*-2;
    } else {
        center6.mass=gravOffVal;
    }
    if (Math.random()> 0.5) {
        center7.mass=gravOnVal*-2;
    } else {
        center7.mass=gravOffVal;
    }
    if (Math.random()> 0.5) {
        topLeft.mass=gravOnVal*-1;
    } else {
        topLeft.mass=gravOffVal;
    }
    if (Math.random()> 0.5) {
        topRight.mass=gravOnVal*-1;
    } else {
        topRight.mass=gravOffVal;
    }
    if (Math.random()> 1) {
        bottomAttractor.mass=gravOffValBottom;
    } else {
        bottomAttractor.mass=gravOnValBottom;
    }
}

document.body.addEventListener('click', function() {
    gravOn = !gravOn;
    gOn++;
    gOn %= 3;
    if (gOn == 0) {
        center.mass=gravOnVal*-2;
        //center2.mass=gravOnVal*-2;
        center2.mass=gravOffVal;
        center3.mass=gravOffVal;
    }
    if (gOn == 1) {
        center.mass=gravOffVal;
        //center2.mass=gravOnVal*-2;
        center2.mass=gravOnVal*-2;
        center3.mass=gravOffVal;
    }
    if (gOn == 2) {
        center.mass=gravOffVal;
        //center2.mass=gravOnVal*-2;
        center2.mass=gravOffVal;
        center3.mass=gravOnVal*-2;
    }
    if (!gravOn) {

        center4.mass=gravOffVal;
        bottomAttractor.mass=gravOnValBottom;
        bottomAttractor2.mass=gravOnValBottom;
        topRight.mass = gravOnVal;
        topLeft.mass = gravOnVal;
    } else {
        var neg = Math.random()<0.5?1:-1;
        /*center.mass=gravOnVal*-2;
        //center2.mass=gravOffVal;
        center2.mass=gravOnVal*-2;
        center3.mass=gravOnVal*-2;
        center4.mass=gravOnVal;*/
        bottomAttractor.mass=gravOffValBottom;
        bottomAttractor2.mass=gravOffValBottom;
        topLeft.mass = gravOffVal;
        topRight.mass = gravOffVal;
    }
})

var movers = [/*topLeft, topRight,*/bottomAttractor, center, center2, center3, center4, center5, center6, center7];
for (var i = 0; i < 200; i++) {
    movers.push(spawnMover());
}
function doTheNewton(mover1, mover2) {
    var G = 0.003;
    var dist = distPoints(mover1.pos, mover2.pos);
    return G * (mover1.mass*mover2.mass) / (dist*dist);
}

switchGrav();

/*
 newVelX1 = (firstBall.speed.x * (firstBall.mass – secondBall.mass) + (2 * secondBall.mass * secondBall.speed.x)) / (firstBall.mass + secondBall.mass);
 newVelY1 = (firstBall.speed.y * (firstBall.mass – secondBall.mass) + (2 * secondBall.mass * secondBall.speed.y)) / (firstBall.mass + secondBall.mass);
 newVelX2 = (secondBall.speed.x * (secondBall.mass – firstBall.mass) + (2 * firstBall.mass * firstBall.speed.x)) / (firstBall.mass + secondBall.mass);
 newVelY2 = (secondBall.speed.y * (secondBall.mass – firstBall.mass) + (2 * firstBall.mass * firstBall.speed.y)) / (firstBall.mass + secondBall.mass); */
function checkCollision(mover, movers) {
    var colls = [];
    for (var i = 0; i < movers.length; i++) {
        if (movers[i].id != mover.id) {

            var dist = distPoints(mover.pos, movers[i].pos);
            if (dist <= (mover.radius + movers[i].radius)) {
                var dir = vecNorm(getDir(mover.pos, movers[i].pos));
                var delta = mover.radius + movers[i].radius - dist;
                //if (!movers[i].isStatic) {
                  movers[i].pos = vecAdd(movers[i].pos, vecMul(dir, delta));
                //}
                colls.push(movers[i]);
            }
        }
    }
    return colls;
}

function collideWalls(mover) {
    if (mover.isStatic) {
        return;
    }
    if (mover.pos[0]-mover.radius < 0) {
        mover.dir[0] = Math.abs(mover.dir[0]);
        mover.pos[0] = mover.radius;
    }
    if (mover.pos[0]+mover.radius > width) {
        mover.dir[0] = -1 * Math.abs(mover.dir[0]);
        mover.pos[0] = width-mover.radius;
    }
    if (mover.pos[1]-mover.radius < 0) {
        mover.dir[1] = Math.abs(mover.dir[1]);
        mover.pos[1] = mover.radius;
    }
    if (mover.pos[1]+mover.radius > height) {
        mover.dir[1] = -1 * Math.abs(mover.dir[1]);
        mover.pos[1] = height-mover.radius;
    }
}


var timeSum = 0;
//var maxVecLen = 0;
var lastTime = 1*new Date();
setInterval(function() {
    var thisTime = 1*new Date();
    var timePassed = thisTime - lastTime;
    s.clear();
    var g = s.gradient("l(0,1, 0, 0.25)#"+grad.getColor(1 )+"-#fff");
    var g = s.gradient("l(0,1, 0, 0.25)#000-#fff");
    s.rect(0,0,width, height).attr({fill:g});
    for (var i = movers.length; i--;) {
        movers[i].move(timePassed);
    }
//    for (var i = movers.length; i--;) {
        for (var i = 0; i < movers.length; i++) {

            drawMover(movers[i]);
    }
    for (var i = 0; i < movers.length; i++) {

        collideWalls(movers[i]);
        //maxVecLen = Math.max(maxVecLen, vecLen(movers[i].dir));
        var colls = checkCollision(movers[i], movers.slice(i+1));
        colls.forEach(function(col) {
            movers[i].collide(col);
        });
        for (var t = i+1; t<movers.length; t++) {
            var f = doTheNewton(movers[i], movers[t]);
            //movers[i].moveTowards(movers[t], f * movers[t].mass / movers[i].mass, timePassed);
            movers[t].moveTowards(movers[i], f * movers[i].mass / movers[t].mass, timePassed);
        }
    }
    timeSum += timePassed;
    if (timeSum > 10000) {
        switchGrav();
        timeSum = 0;
    }
    lastTime = thisTime;
},51);
